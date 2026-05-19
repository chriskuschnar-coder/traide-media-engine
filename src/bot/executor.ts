import { generateContentScript, generateContentPlan, adaptForPlatform } from '../services/ai/claude.js';
import { createDraft, getDraft, updateDraftStatus, updateDraftScript, getPendingDrafts, getDraftsForChat, saveDraft, deleteDraft, type Draft, type DraftStatus } from './drafts.js';
import { getRecentDraftIds, type ContextMessage } from './context.js';
import { reviewContent, appendDisclaimer } from '../services/compliance/index.js';
import type { ParsedAction } from './router.js';
import type { ContentStyle, Platform } from '../types/index.js';

// Platform imports are lazy — loaded only when actually publishing
// This prevents crashes when API keys aren't configured yet

// Scheduler state (simple in-memory flag, would be Redis in production)
let postingPaused = false;

export function isPostingPaused(): boolean { return postingPaused; }

export async function executeAction(
  action: ParsedAction,
  context: ContextMessage[],
  chatId: string
): Promise<{ reply: string; draftIds: string[] }> {
  const recentDraftIds = getRecentDraftIds(context);

  switch (action.action) {
    case 'create_video':
      return handleCreateContent(chatId, 'video', action.params, context);
    case 'create_post':
      return handleCreateContent(chatId, 'post', action.params, context);
    case 'create_thread':
      return handleCreateContent(chatId, 'thread', action.params, context);
    case 'create_ad':
      return handleCreateContent(chatId, 'ad', action.params, context);
    case 'create_carousel':
      return handleCreateContent(chatId, 'carousel', action.params, context);
    case 'create_scenario':
      return handleCreateContent(chatId, 'scenario', action.params, context);

    case 'approve':
      return handleApprove(chatId, action.params.draft_id, recentDraftIds);
    case 'reject':
      return handleReject(chatId, action.params.draft_id, action.params.reason, recentDraftIds);
    case 'revise':
      return handleRevise(chatId, action.params.draft_id, action.params.feedback, recentDraftIds);

    case 'schedule':
      return handleSchedule(chatId, action.params.draft_id, action.params.when, recentDraftIds);
    case 'publish_now':
      return handlePublishNow(chatId, action.params.draft_id, recentDraftIds);

    case 'show_drafts':
      return handleShowDrafts(chatId, action.params);
    case 'show_draft':
      return handleShowDraft(action.params.draft_id);

    case 'plan_week':
      return handlePlanWeek(action.params);
    case 'plan_campaign':
      return handlePlanCampaign(action.params);
    case 'suggest_topics':
      return handleSuggestTopics(action.params);

    case 'show_metrics':
    case 'show_top_posts':
    case 'viral_check':
    case 'weekly_digest':
      return { reply: '\u{1F4CA} Analytics not wired yet. Coming in the next update.', draftIds: [] };

    case 'analyze_trends':
    case 'competitor_check':
      return { reply: 'Trend analysis coming soon. For now, tell me what to create.', draftIds: [] };

    case 'show_scheduled':
      return handleShowScheduled(chatId);

    case 'pause_posting':
      postingPaused = true;
      return { reply: 'Paused. All scheduled posts on hold. Say "resume" when ready.', draftIds: [] };
    case 'resume_posting':
      postingPaused = false;
      return { reply: 'Resumed. Scheduled posts will continue.', draftIds: [] };

    case 'change_platforms':
      return { reply: `Platform change noted: ${action.params.platforms?.join(', ')}. Update ENABLED_PLATFORMS in .env to persist.`, draftIds: [] };

    case 'status':
      return handleStatus(chatId);

    default:
      return { reply: '', draftIds: [] };
  }
}

async function handleCreateContent(
  chatId: string,
  type: string,
  params: Record<string, any>,
  context: ContextMessage[]
): Promise<{ reply: string; draftIds: string[] }> {
  const topic = params.topic || params.description || 'traide.live feature showcase';
  const platform = params.platform || 'youtube';
  const style: ContentStyle = {
    tone: params.style?.tone || (type === 'ad' ? 'urgency' : 'hype'),
    visual: params.style?.visual || 'dark_trading',
    music: params.style?.music || (type === 'video' ? 'energetic' : 'none'),
    duration: params.length || (type === 'video' ? 30 : undefined),
  };

  const contentTypeMap: Record<string, string> = {
    video: 'short_video',
    post: 'text_post',
    thread: 'thread',
    ad: 'ad',
    carousel: 'carousel',
    scenario: 'short_video',
  };

  const script = await generateContentScript({
    type: contentTypeMap[type] as any || 'short_video',
    topic,
    platform: platform as any,
    style,
  });

  const draft = await createDraft({
    chatId,
    type,
    topic,
    platform,
    platforms: params.platforms || [platform],
    script: {
      hook: script.hook,
      body: script.script,
      caption: script.caption,
      hashtags: script.hashtags,
      cta: script.cta,
    },
    style,
  });

  const typeLabel = type === 'video' ? `${style.duration}s ${platform} short` : type;
  let reply = `Draft ${draft.id} \u2014 ${typeLabel}\n\n`;
  reply += `Hook: "${script.hook}"\n\n`;
  reply += `${script.script}\n\n`;
  reply += `Caption: ${script.caption}\n`;
  reply += `#${script.hashtags.join(' #')}\n\n`;
  reply += `Approve for visuals, revise, or scrap?`;

  return { reply, draftIds: [draft.id] };
}

async function resolveDraftId(
  chatId: string,
  explicitId: string | undefined,
  recentIds: string[]
): Promise<Draft | 'ambiguous' | 'none'> {
  if (explicitId) {
    const d = await getDraft(explicitId);
    return d || 'none';
  }

  // Try most recent from context
  for (const id of recentIds) {
    const d = await getDraft(id);
    if (d && !['published', 'measuring', 'rejected'].includes(d.status)) return d;
  }

  // Fall back to pending drafts
  const pending = await getPendingDrafts(chatId);
  if (pending.length === 1) return pending[0];
  if (pending.length === 0) return 'none';
  return 'ambiguous';
}

function formatDraftList(drafts: Draft[]): string {
  return drafts.map(d => `\u2022 ${d.id}: ${d.type} \u2014 "${d.topic.slice(0, 40)}" [${d.status}]`).join('\n');
}

async function handleApprove(
  chatId: string,
  draftId: string | undefined,
  recentIds: string[]
): Promise<{ reply: string; draftIds: string[] }> {
  const result = await resolveDraftId(chatId, draftId, recentIds);

  if (result === 'none') return { reply: 'Nothing pending to approve.', draftIds: [] };
  if (result === 'ambiguous') {
    const pending = await getPendingDrafts(chatId);
    return { reply: `Which one?\n${formatDraftList(pending)}`, draftIds: pending.map(d => d.id) };
  }

  const draft = result;
  const nextStatus: Record<string, DraftStatus> = {
    'script_draft': 'script_approved',
    'script_approved': 'assets_generating',
    'assets_ready': 'published',
  };

  const next = nextStatus[draft.status];
  if (!next) {
    return { reply: `Draft ${draft.id} is at "${draft.status}" \u2014 can't approve from here.`, draftIds: [draft.id] };
  }

  await updateDraftStatus(draft.id, next);

  const messages: Record<string, string> = {
    'script_approved': `Script approved for ${draft.id}. Generating visuals \u2014 I'll ping when ready.`,
    'assets_generating': `Assets queued for ${draft.id}. Will notify when preview is ready.`,
    'published': `${draft.id} published. Will track performance.`,
  };

  return { reply: messages[next] || `${draft.id} moved to ${next}.`, draftIds: [draft.id] };
}

async function handleReject(
  chatId: string,
  draftId: string | undefined,
  reason: string | undefined,
  recentIds: string[]
): Promise<{ reply: string; draftIds: string[] }> {
  const result = await resolveDraftId(chatId, draftId, recentIds);
  if (result === 'none') return { reply: 'Nothing to reject.', draftIds: [] };
  if (result === 'ambiguous') {
    const pending = await getPendingDrafts(chatId);
    return { reply: `Which one?\n${formatDraftList(pending)}`, draftIds: pending.map(d => d.id) };
  }

  await updateDraftStatus(result.id, 'rejected');
  return { reply: `Scrapped ${result.id}.${reason ? ` Noted: ${reason}` : ''}`, draftIds: [result.id] };
}

async function handleRevise(
  chatId: string,
  draftId: string | undefined,
  feedback: string | undefined,
  recentIds: string[]
): Promise<{ reply: string; draftIds: string[] }> {
  const result = await resolveDraftId(chatId, draftId, recentIds);
  if (result === 'none') return { reply: 'No draft to revise.', draftIds: [] };
  if (result === 'ambiguous') {
    const pending = await getPendingDrafts(chatId);
    return { reply: `Which draft?\n${formatDraftList(pending)}`, draftIds: pending.map(d => d.id) };
  }

  const draft = result;
  if (!feedback) return { reply: 'What should I change?', draftIds: [draft.id] };

  draft.revisionHistory.push(feedback);

  // Re-generate with feedback
  const script = await generateContentScript({
    type: (draft.type === 'video' ? 'short_video' : draft.type) as any,
    topic: `${draft.topic}\n\nPREVIOUS VERSION:\n${draft.script?.body}\n\nFEEDBACK: ${feedback}\n\nRevise based on the feedback. Keep what works, fix what was called out.`,
    platform: draft.platform as any,
    style: draft.style as any || { tone: 'hype', visual: 'dark_trading', music: 'energetic' },
  });

  await updateDraftScript(draft.id, {
    hook: script.hook,
    body: script.script,
    caption: script.caption,
    hashtags: script.hashtags,
    cta: script.cta,
  });

  let reply = `Revised ${draft.id}:\n\n`;
  reply += `Hook: "${script.hook}"\n\n`;
  reply += `${script.script}\n\n`;
  reply += `Better?`;

  return { reply, draftIds: [draft.id] };
}

async function handleSchedule(
  chatId: string,
  draftId: string | undefined,
  when: string | undefined,
  recentIds: string[]
): Promise<{ reply: string; draftIds: string[] }> {
  const result = await resolveDraftId(chatId, draftId, recentIds);
  if (result === 'none') return { reply: 'No draft to schedule.', draftIds: [] };
  if (result === 'ambiguous') {
    const pending = await getPendingDrafts(chatId);
    return { reply: `Which draft?\n${formatDraftList(pending)}`, draftIds: pending.map(d => d.id) };
  }

  const draft = result;
  draft.scheduledFor = when || 'next available slot';
  draft.status = 'scheduled';
  await saveDraft(draft);

  return { reply: `${draft.id} scheduled for ${draft.scheduledFor}. Will ping before it posts.`, draftIds: [draft.id] };
}

async function handlePublishNow(
  chatId: string,
  draftId: string | undefined,
  recentIds: string[]
): Promise<{ reply: string; draftIds: string[] }> {
  const result = await resolveDraftId(chatId, draftId, recentIds);
  if (result === 'none') return { reply: 'No draft to publish.', draftIds: [] };
  if (result === 'ambiguous') {
    const pending = await getPendingDrafts(chatId);
    return { reply: `Which one?\n${formatDraftList(pending)}`, draftIds: pending.map(d => d.id) };
  }

  const draft = result;
  if (!draft.script) return { reply: `Draft ${draft.id} has no script. Revise first.`, draftIds: [draft.id] };

  // Run compliance check
  const complianceResult = await reviewContent(draft.script.body + ' ' + draft.script.caption);
  if (!complianceResult.approved) {
    return {
      reply: `⚠️ Compliance blocked ${draft.id}:\n${complianceResult.issues.map(i => `• ${i}`).join('\n')}${complianceResult.suggestedRevision ? `\n\nSuggested fix: ${complianceResult.suggestedRevision}` : ''}`,
      draftIds: [draft.id],
    };
  }

  const caption = appendDisclaimer(draft.script.caption + '\n\n' + draft.script.hashtags.map(h => `#${h}`).join(' '));
  const enabledPlatforms = (process.env.ENABLED_PLATFORMS || 'youtube').split(',').map(p => p.trim());
  const targetPlatforms = draft.platforms.filter(p => enabledPlatforms.includes(p));

  if (targetPlatforms.length === 0) {
    return { reply: `No enabled platforms match this draft. Enabled: ${enabledPlatforms.join(', ')}. Draft targets: ${draft.platforms.join(', ')}.`, draftIds: [draft.id] };
  }

  const results: string[] = [];
  const publishedResults: { platform: string; url?: string; id?: string }[] = [];

  for (const platform of targetPlatforms) {
    try {
      const postResult = await publishToPlatform(platform, draft, caption);
      results.push(`${platform}: ${postResult.url || postResult.id || 'posted'}`);
      publishedResults.push({ platform, ...postResult });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push(`${platform}: failed — ${msg.slice(0, 100)}`);
    }
  }

  draft.status = 'published';
  draft.publishedResults = publishedResults;
  await saveDraft(draft);

  return {
    reply: `Published ${draft.id}:\n${results.map(r => `• ${r}`).join('\n')}`,
    draftIds: [draft.id],
  };
}

async function publishToPlatform(
  platform: string,
  draft: Draft,
  caption: string
): Promise<{ url?: string; id?: string }> {
  const videoAsset = draft.assets?.find(a => a.type === 'video');
  const imageAsset = draft.assets?.find(a => a.type === 'image');

  switch (platform) {
    case 'x': {
      const { postTweet, postThread } = await import('../platforms/x/index.js');
      if (draft.type === 'thread' && draft.script) {
        const tweets = draft.script.body.split('\n\n').filter(t => t.trim());
        const res = await postThread({ tweets, mediaPath: videoAsset?.path });
        return { url: res.url, id: res.ids[0] };
      }
      const text = caption.slice(0, 280);
      const res = await postTweet({ text, mediaPath: videoAsset?.path || imageAsset?.path });
      return { url: res.url, id: res.id };
    }

    case 'youtube': {
      const { uploadShort } = await import('../platforms/youtube/index.js');
      if (!videoAsset) return { id: 'skipped — no video asset' };
      const res = await uploadShort({
        videoPath: videoAsset.path,
        title: (draft.script?.hook || draft.topic).slice(0, 100),
        description: caption,
        tags: draft.script?.hashtags || ['traide', 'trading', 'ai'],
      });
      return { url: res.url, id: res.id };
    }

    case 'instagram': {
      const { postReel, postImage } = await import('../platforms/instagram/index.js');
      if (videoAsset) {
        const res = await postReel({ videoUrl: videoAsset.path, caption });
        return { url: res.url, id: res.id };
      }
      if (imageAsset) {
        const res = await postImage({ imageUrl: imageAsset.path, caption });
        return { id: res.id };
      }
      return { id: 'skipped — no media' };
    }

    case 'tiktok': {
      const { postVideo } = await import('../platforms/tiktok/index.js');
      if (!videoAsset) return { id: 'skipped — no video' };
      const res = await postVideo({ videoPath: videoAsset.path, title: caption.slice(0, 150) });
      return { id: res.id };
    }

    case 'facebook': {
      const { postToPage } = await import('../platforms/facebook/index.js');
      const res = await postToPage({ message: caption, link: 'https://traide.live' });
      return { url: res.url, id: res.id };
    }

    case 'telegram': {
      const { postToChannel } = await import('../platforms/telegram/index.js');
      const res = await postToChannel({
        text: caption,
        videoPath: videoAsset?.path,
        imagePath: imageAsset?.path,
        buttons: [{ text: 'Try Traide.live', url: 'https://traide.live' }],
      });
      return { id: String(res.messageId) };
    }

    default:
      return { id: `unsupported platform: ${platform}` };
  }
}

async function handleShowDrafts(chatId: string, params: Record<string, any>): Promise<{ reply: string; draftIds: string[] }> {
  let drafts = await getDraftsForChat(chatId);

  if (params.status) {
    drafts = drafts.filter(d => d.status === params.status);
  }
  if (params.platform) {
    drafts = drafts.filter(d => d.platforms.includes(params.platform));
  }

  if (drafts.length === 0) return { reply: 'No drafts.', draftIds: [] };

  const pending = drafts.filter(d => !['published', 'measuring', 'rejected'].includes(d.status));
  const published = drafts.filter(d => d.status === 'published' || d.status === 'measuring');

  let reply = '';
  if (pending.length > 0) {
    reply += `Pending (${pending.length}):\n${formatDraftList(pending)}\n`;
  }
  if (published.length > 0) {
    reply += `\nPublished (${published.length}):\n${formatDraftList(published.slice(0, 5))}`;
  }

  return { reply: reply || 'No drafts.', draftIds: drafts.map(d => d.id) };
}

async function handleShowDraft(draftId: string): Promise<{ reply: string; draftIds: string[] }> {
  if (!draftId) return { reply: 'Which draft? Give me an ID.', draftIds: [] };
  const draft = await getDraft(draftId);
  if (!draft) return { reply: `Draft ${draftId} not found.`, draftIds: [] };

  let reply = `${draft.id} \u2014 ${draft.type} [${draft.status}]\n`;
  reply += `Topic: ${draft.topic}\n`;
  reply += `Platform: ${draft.platforms.join(', ')}\n`;
  if (draft.script) {
    reply += `\nHook: "${draft.script.hook}"\n`;
    reply += `${draft.script.body}\n`;
    reply += `\nCaption: ${draft.script.caption}`;
  }
  if (draft.scheduledFor) reply += `\nScheduled: ${draft.scheduledFor}`;

  return { reply, draftIds: [draft.id] };
}

async function handlePlanWeek(params: Record<string, any>): Promise<{ reply: string; draftIds: string[] }> {
  const plan = await generateContentPlan({ days: 7, postsPerDay: 3, focus: params.theme });

  let reply = '7-day plan:\n\n';
  for (const item of plan.slice(0, 14)) {
    reply += `Day ${item.day} ${item.time} \u2014 ${item.type}\n`;
    reply += `  "${item.hook}"\n`;
    reply += `  \u2192 ${item.platforms.join(', ')}\n\n`;
  }
  reply += 'Want me to start creating these?';
  return { reply, draftIds: [] };
}

async function handlePlanCampaign(params: Record<string, any>): Promise<{ reply: string; draftIds: string[] }> {
  const days = params.days || 14;
  const plan = await generateContentPlan({ days, postsPerDay: 2, focus: params.theme });

  let reply = `${days}-day campaign "${params.theme || 'general'}":\n\n`;
  for (const item of plan.slice(0, 10)) {
    reply += `Day ${item.day} ${item.time}: ${item.type} \u2014 "${item.hook}"\n`;
  }
  if (plan.length > 10) reply += `...and ${plan.length - 10} more\n`;
  reply += '\nApprove to queue all, or pick specific ones.';
  return { reply, draftIds: [] };
}

async function handleSuggestTopics(params: Record<string, any>): Promise<{ reply: string; draftIds: string[] }> {
  const count = params.count || 5;
  // Use Claude to suggest topics
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic();
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages: [{ role: 'user', content: `Suggest ${count} viral content topics for traide.live (AI trading platform). ${params.vibe ? `Vibe: ${params.vibe}.` : ''} Format: numbered list, each with a hook line. Short, punchy, trader-speak.` }],
  });
  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return { reply: text, draftIds: [] };
}

async function handleShowScheduled(chatId: string): Promise<{ reply: string; draftIds: string[] }> {
  const drafts = await getDraftsForChat(chatId);
  const scheduled = drafts.filter(d => d.status === 'scheduled');
  if (scheduled.length === 0) return { reply: 'Nothing scheduled.', draftIds: [] };
  return { reply: `Scheduled:\n${formatDraftList(scheduled)}`, draftIds: scheduled.map(d => d.id) };
}

async function handleStatus(chatId: string): Promise<{ reply: string; draftIds: string[] }> {
  const drafts = await getDraftsForChat(chatId);
  const pending = drafts.filter(d => !['published', 'measuring', 'rejected'].includes(d.status));
  const published = drafts.filter(d => d.status === 'published' || d.status === 'measuring');

  let reply = `Engine ${postingPaused ? '\u23F8 paused' : '\u25B6 running'}\n`;
  reply += `Drafts: ${pending.length} pending, ${published.length} published\n`;
  reply += `Platforms: ${process.env.ENABLED_PLATFORMS || 'youtube'}`;

  return { reply, draftIds: [] };
}
