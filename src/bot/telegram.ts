// ── Telegram Bot - Command Center ──
// This is YOUR control panel. Send commands to create & distribute content.

import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';
import { nanoid } from 'nanoid';
import { interpretCommand, generateContentScript, generateContentPlan } from '../services/ai/claude.js';
import { addContentJob, getQueueStats } from '../services/queue/index.js';
import {
  getBacklogStatus,
  approveItem,
  pauseScheduler,
  resumeScheduler,
  addToBacklog,
} from '../scheduler/index.js';
import { getAnalyticsStore } from '../workers/analytics-puller.js';
import type { ContentRequest, ContentStyle, Platform } from '../types/index.js';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const ALLOWED_CHAT = process.env.TELEGRAM_CHAT_ID!;

// Only respond to your chat
function isAuthorized(chatId: number | string): boolean {
  return String(chatId) === ALLOWED_CHAT;
}

// ── Commands ──

bot.command('start', (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  ctx.reply(`🎬 Traide Media Engine Online

Commands:
/create <description> — Create content
/video <topic> — Create a short video for all platforms
/post <message> — Post text to all platforms
/thread <topic> — Create an X thread
/plan <days> — Generate a content plan
/status — Check queue status
/approve <id> — Approve a flagged item
/schedule <time> <description> — Schedule content
/backlog — Show what's queued
/pause — Stop autonomous posting
/resume — Resume autonomous posting
/digest — Weekly performance summary
/idea <text> — Drop an idea into the backlog

Or just describe what you want in plain English and I'll figure it out.`);
});

bot.command('status', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  const stats = await getQueueStats();
  ctx.reply(`📊 Queue Status:
Content: ${stats.content.waiting} waiting, ${stats.content.active} active
Distribution: ${stats.distribution.waiting} waiting, ${stats.distribution.active} active`);
});

bot.command('video', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  const topic = ctx.message.text.replace('/video ', '').trim();
  if (!topic) return ctx.reply('Usage: /video <topic>');

  ctx.reply('🎬 Creating short video for all platforms...');

  const script = await generateContentScript({
    type: 'short_video',
    topic,
    platform: 'tiktok', // Generate for vertical-first
    style: { tone: 'hype', visual: 'dark_trading', music: 'energetic', duration: 30 },
  });

  const request: ContentRequest = {
    id: nanoid(),
    type: 'short_video',
    platforms: ['youtube', 'tiktok', 'instagram', 'facebook', 'x', 'telegram'],
    prompt: topic,
    status: 'queued',
    createdAt: new Date(),
    style: { tone: 'hype', visual: 'dark_trading', music: 'energetic', duration: 30 },
  };

  await addContentJob(request);

  ctx.reply(`✅ Video queued!

📝 Script:
Hook: "${script.hook}"
Caption: "${script.caption}"
CTA: "${script.cta}"
Hashtags: ${script.hashtags.join(' ')}

📤 Will post to: YouTube Shorts, TikTok, IG Reels, FB Reels, X, Telegram

Use /approve to review before posting.`);
});

bot.command('post', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  const message = ctx.message.text.replace('/post ', '').trim();
  if (!message) return ctx.reply('Usage: /post <message>');

  const request: ContentRequest = {
    id: nanoid(),
    type: 'text_post',
    platforms: ['x', 'facebook', 'telegram'],
    prompt: message,
    status: 'queued',
    createdAt: new Date(),
  };

  await addContentJob(request);
  ctx.reply(`✅ Text post queued for X, Facebook, Telegram\n\n"${message}"`);
});

bot.command('thread', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  const topic = ctx.message.text.replace('/thread ', '').trim();
  if (!topic) return ctx.reply('Usage: /thread <topic>');

  ctx.reply('🧵 Generating X thread...');

  const script = await generateContentScript({
    type: 'thread',
    topic,
    platform: 'x',
    style: { tone: 'educational', visual: 'clean_minimal', music: 'none' },
  });

  ctx.reply(`🧵 Thread Draft:\n\n${script.script}\n\nSend /approve to post.`);
});

bot.command('plan', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  const days = parseInt(ctx.message.text.replace('/plan ', '')) || 7;

  ctx.reply(`📅 Generating ${days}-day content plan...`);

  const plan = await generateContentPlan({ days, postsPerDay: 3 });

  let planText = `📅 ${days}-Day Content Plan:\n\n`;
  for (const item of plan.slice(0, 15)) {
    planText += `Day ${item.day} @ ${item.time} — ${item.type}\n`;
    planText += `  📌 ${item.topic}\n`;
    planText += `  🎣 "${item.hook}"\n`;
    planText += `  📤 ${item.platforms.join(', ')}\n\n`;
  }

  if (plan.length > 15) {
    planText += `...and ${plan.length - 15} more posts.\n`;
  }

  planText += `\nSend /execute_plan to schedule all posts.`;
  ctx.reply(planText);
});

// ── Backlog Command ──
bot.command('backlog', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  const status = getBacklogStatus();

  let msg = `📋 Backlog Status:
Total items: ${status.total}
Pending: ${status.pending}
Posted: ${status.posted}
Failed: ${status.failed}
Awaiting approval: ${status.awaitingApproval}
Scheduler: ${status.isPaused ? '⏸ Paused' : '▶️ Running'}`;

  if (status.nextScheduled) {
    const next = new Date(status.nextScheduled);
    msg += `\nNext scheduled: ${next.toLocaleString()}`;
  }

  ctx.reply(msg);
});

// ── Approve Command ──
bot.command('approve', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  const itemId = ctx.message.text.replace('/approve', '').trim();
  if (!itemId) return ctx.reply('Usage: /approve <id>');

  const success = approveItem(itemId);
  if (success) {
    ctx.reply(`✅ Item ${itemId} approved and queued for posting.`);
  } else {
    ctx.reply(`❌ Could not approve item ${itemId}. It may not exist or is not awaiting approval.`);
  }
});

// ── Pause Command ──
bot.command('pause', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  pauseScheduler();
  ctx.reply('⏸ Autonomous posting paused. Use /resume to restart.');
});

// ── Resume Command ──
bot.command('resume', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  resumeScheduler();
  ctx.reply('▶️ Autonomous posting resumed.');
});

// ── Digest Command — Weekly performance summary ──
bot.command('digest', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;

  const store = getAnalyticsStore();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const recentMetrics = store.metrics.filter(
    (m) => new Date(m.capturedAt) >= weekAgo,
  );

  if (recentMetrics.length === 0) {
    return ctx.reply('📊 No analytics data from the past 7 days yet.');
  }

  // Aggregate latest metrics per post (take the most recent capture)
  const latestByPost = new Map<string, typeof recentMetrics[0]>();
  for (const m of recentMetrics) {
    const existing = latestByPost.get(m.postId);
    if (!existing || new Date(m.capturedAt) > new Date(existing.capturedAt)) {
      latestByPost.set(m.postId, m);
    }
  }

  const metrics = Array.from(latestByPost.values());
  const totalViews = metrics.reduce((sum, m) => sum + m.views, 0);
  const totalLikes = metrics.reduce((sum, m) => sum + m.likes, 0);
  const totalComments = metrics.reduce((sum, m) => sum + m.comments, 0);
  const totalShares = metrics.reduce((sum, m) => sum + m.shares, 0);

  const topPost = metrics.sort((a, b) => b.views - a.views)[0];
  const postRecord = store.posts.find((p) => p.id === topPost?.postId);

  let msg = `📊 Weekly Digest (${metrics.length} posts):

👀 Total views: ${totalViews.toLocaleString()}
❤️ Total likes: ${totalLikes.toLocaleString()}
💬 Total comments: ${totalComments.toLocaleString()}
🔄 Total shares: ${totalShares.toLocaleString()}`;

  if (topPost && postRecord) {
    msg += `\n\n🏆 Top post: "${postRecord.hook}"
   ${topPost.views.toLocaleString()} views on ${postRecord.platform}`;
  }

  const backlogStatus = getBacklogStatus();
  msg += `\n\n📋 Backlog: ${backlogStatus.pending} pending, ${backlogStatus.awaitingApproval} awaiting approval`;

  ctx.reply(msg);
});

// ── Idea Command — Drop an idea into the backlog ──
bot.command('idea', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  const ideaText = ctx.message.text.replace('/idea', '').trim();
  if (!ideaText) return ctx.reply('Usage: /idea <your content idea>');

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const item = addToBacklog({
    scheduledAt: tomorrow.toISOString(),
    contentType: 'short_video',
    platforms: ['youtube', 'x', 'instagram', 'tiktok'] as Platform[],
    topic: ideaText,
    hook: ideaText,
    approvalRequired: true,
  });

  ctx.reply(`💡 Idea added to backlog!
ID: ${item.id}
Topic: "${ideaText}"
Scheduled: ${tomorrow.toLocaleString()}
Status: Pending (approval required)

The scheduler will generate content and send it for your approval.`);
});

// ── Auto-alerts: Milestone notifications ──
// Call this periodically (e.g., from the analytics puller) to check for milestones
const notifiedMilestones = new Set<string>();

export function checkViewMilestones(
  postId: string,
  views: number,
  hook: string,
  platform: string,
): void {
  const milestones = [
    { threshold: 1_000_000, label: '1M' },
    { threshold: 100_000, label: '100K' },
    { threshold: 10_000, label: '10K' },
  ];

  for (const milestone of milestones) {
    const key = `${postId}-${milestone.threshold}`;
    if (views >= milestone.threshold && !notifiedMilestones.has(key)) {
      notifiedMilestones.add(key);
      const msg = `🎉 MILESTONE: "${hook}" just passed ${milestone.label} views on ${platform}! (${views.toLocaleString()} views)`;
      bot.telegram.sendMessage(ALLOWED_CHAT, msg).catch((err) =>
        console.error('[Telegram] Failed to send milestone alert:', err),
      );
      break; // Only notify for the highest unnotified milestone
    }
  }
}

// ── Natural Language Handler ──
bot.on('text', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;

  const message = ctx.message.text;
  ctx.reply('🤖 Processing your request...');

  const parsed = await interpretCommand(message);

  switch (parsed.action) {
    case 'create_content': {
      const allPlatforms: Platform[] = ['youtube', 'x', 'instagram', 'tiktok', 'facebook', 'telegram'];
      const request: ContentRequest = {
        id: nanoid(),
        type: parsed.contentType || 'short_video',
        platforms: parsed.platforms || allPlatforms,
        prompt: parsed.topic || message,
        status: 'queued',
        createdAt: new Date(),
        style: {
          tone: parsed.style?.tone || 'hype',
          visual: parsed.style?.visual || 'dark_trading',
          music: parsed.style?.music || 'energetic',
          duration: parsed.style?.duration || 30,
        } as ContentStyle,
      };

      await addContentJob(request);
      ctx.reply(`✅ Content creation queued!\nType: ${request.type}\nPlatforms: ${request.platforms.join(', ')}\nTopic: ${request.prompt}`);
      break;
    }

    case 'create_plan': {
      ctx.reply('📅 Use /plan <number_of_days> to generate a content plan');
      break;
    }

    case 'status': {
      const stats = await getQueueStats();
      ctx.reply(`📊 Content: ${stats.content.waiting} queued | Distribution: ${stats.distribution.waiting} queued`);
      break;
    }

    default:
      ctx.reply(`I understood: "${message}"\n\nBut I'm not sure what action to take. Try:\n/video <topic>\n/post <message>\n/thread <topic>\n/plan <days>\n\nOr describe more specifically what content you want created.`);
  }
});

// ── Photo/Video Handler (forward content to post) ──
bot.on('photo', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  const caption = ctx.message.caption || '';
  ctx.reply(`📸 Got image! Caption: "${caption}"\nI'll queue this for posting. Which platforms? Reply with: all, x, ig, tiktok, fb, telegram`);
});

bot.on('video', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  const caption = ctx.message.caption || '';
  ctx.reply(`🎥 Got video! Caption: "${caption}"\nI'll queue this for posting. Which platforms? Reply with: all, x, ig, tiktok, fb, yt, telegram`);
});

// ── Launch ──
bot.launch().then(() => {
  console.log('🚀 Traide Media Engine bot is running');
  console.log('Send /start to your bot to see available commands');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
