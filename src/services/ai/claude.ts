// ── Claude AI Service ──
// The brain behind all content creation decisions

import Anthropic from '@anthropic-ai/sdk';
import { TRAIDE_CONTEXT, CONTENT_ANGLES } from '../../context/traide-context.js';
import type { ContentType, Platform, ContentStyle, ContentPlanItem } from '../../types/index.js';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are the content creation brain for traide.live, an AI-powered trading platform.

PRODUCT CONTEXT:
${JSON.stringify(TRAIDE_CONTEXT, null, 2)}

CONTENT ANGLES TO DRAW FROM:
${CONTENT_ANGLES.map((a, i) => `${i + 1}. ${a}`).join('\n')}

BRAND VOICE: ${TRAIDE_CONTEXT.brandVoice}

YOUR ROLE:
- Generate viral, engaging content that drives signups to traide.live
- Write scripts for short-form video (15-60s)
- Create compelling captions, hooks, and CTAs
- Adapt content per platform (X is punchy, IG is visual, TikTok is trend-aware)
- Think like a growth marketer who trades

RULES:
- Every piece of content must have a clear CTA pointing to traide.live
- Never make financial promises or guarantees
- Be authentic - no "get rich quick" vibes
- Use trading terminology naturally
- Hook viewers in the first 2 seconds
- Keep it real, keep it sharp`;

export async function generateContentScript(params: {
  type: ContentType;
  topic: string;
  platform: Platform;
  style: ContentStyle;
}): Promise<{
  hook: string;
  script: string;
  caption: string;
  hashtags: string[];
  cta: string;
}> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Create content for:
Type: ${params.type}
Platform: ${params.platform}
Topic: ${params.topic}
Tone: ${params.style.tone}
Visual style: ${params.style.visual}
Duration: ${params.style.duration || 30} seconds

Return JSON with: hook, script, caption, hashtags (array), cta`
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse Claude response as JSON');
  return JSON.parse(jsonMatch[0]);
}

export async function generateContentPlan(params: {
  days: number;
  postsPerDay: number;
  focus?: string;
}): Promise<ContentPlanItem[]> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Create a ${params.days}-day content plan with ${params.postsPerDay} posts per day.
${params.focus ? `Focus area: ${params.focus}` : ''}

For each post, return JSON array with objects containing:
- day (number)
- time (string like "09:00" or "18:00")
- type (short_video | image_post | thread | text_post)
- platforms (array of: youtube, x, instagram, tiktok, facebook, telegram)
- topic (what it's about)
- hook (the opening line/hook)
- style: { tone, visual, music, duration }

Mix content types. Prioritize short_video for reach. Use threads on X for education.
Peak times: morning 8-10am, lunch 12-1pm, evening 6-9pm EST.`
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Failed to parse content plan');
  return JSON.parse(jsonMatch[0]);
}

export async function adaptForPlatform(params: {
  content: string;
  fromPlatform: Platform;
  toPlatform: Platform;
}): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Adapt this ${params.fromPlatform} content for ${params.toPlatform}:

${params.content}

Adjust length, tone, hashtags, and format for the target platform.
Return just the adapted content.`
    }],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

export async function interpretCommand(userMessage: string): Promise<{
  action: 'create_content' | 'create_plan' | 'post_now' | 'schedule' | 'status' | 'unknown';
  contentType?: ContentType;
  platforms?: Platform[];
  topic?: string;
  style?: Partial<ContentStyle>;
  schedule?: string;
}> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: `You interpret user commands for a content distribution system.
Parse the user's message and extract their intent as JSON.
Actions: create_content, create_plan, post_now, schedule, status
Content types: short_video, long_video, image_post, carousel, thread, text_post, story, ad
Platforms: youtube, x, instagram, tiktok, facebook, telegram
If they say "everywhere" or "all platforms", include all platforms.`,
    messages: [{
      role: 'user',
      content: userMessage,
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { action: 'unknown' };
  return JSON.parse(jsonMatch[0]);
}
