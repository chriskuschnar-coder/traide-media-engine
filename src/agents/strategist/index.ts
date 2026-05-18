// ── Weekly Strategist Agent ──
// Analyzes content performance and generates the upcoming content backlog.
// Runs weekly to keep the content engine data-driven.

import Anthropic from '@anthropic-ai/sdk';
import type { Series } from '../../context/series.js';
import type { Platform } from '../../types/index.js';

const client = new Anthropic();

// ── Types ──

export interface PostMetric {
  postId: string;
  seriesSlug: string;
  platform: Platform;
  hook: string;
  postedAt: Date;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;           // link clicks to traide.live
  watchTime: number;        // average watch time in seconds
  completionRate: number;   // 0-1, percentage who watched to end
}

export interface WeeklyReviewResult {
  topHooks: { hook: string; reason: string }[];
  bottomHooks: { hook: string; reason: string }[];
  bestPostingTimes: { day: string; time: string; reason: string }[];
  seriesRanking: { series: string; score: number; insight: string }[];
  recommendedAdjustments: string[];
  summary: string;
}

export interface BacklogItem {
  seriesSlug: string;
  scheduledAt: string;       // ISO datetime
  topic: string;
  hook: string;
  briefScript: string;
  platforms: Platform[];
  approvalRequired: boolean;
}

export interface ContentBacklog {
  startDate: string;
  endDate: string;
  items: BacklogItem[];
}

// ── Weekly Review ──

export async function runWeeklyReview(
  metrics: PostMetric[],
): Promise<WeeklyReviewResult> {
  const metricsJson = JSON.stringify(
    metrics.map((m) => ({
      ...m,
      postedAt: m.postedAt instanceof Date ? m.postedAt.toISOString() : m.postedAt,
    })),
    null,
    2,
  );

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: `You are a content strategist for traide.live, an AI-powered trading platform.
Analyze the past week's social media performance data and produce an actionable weekly review.

Your analysis should be data-driven and specific. Reference actual numbers.
Focus on what's working, what's not, and concrete next steps.

Respond in JSON matching this structure:
{
  "topHooks": [{ "hook": "...", "reason": "..." }],        // top 3
  "bottomHooks": [{ "hook": "...", "reason": "..." }],     // bottom 3
  "bestPostingTimes": [{ "day": "...", "time": "...", "reason": "..." }],
  "seriesRanking": [{ "series": "slug", "score": 0-100, "insight": "..." }],
  "recommendedAdjustments": ["..."],
  "summary": "2-3 sentence executive summary"
}`,
    messages: [
      {
        role: 'user',
        content: `Here is this week's content performance data:\n\n${metricsJson}`,
      },
    ],
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse weekly review response');
  }

  return JSON.parse(jsonMatch[0]);
}

// ── Content Backlog Generation ──

export async function generateBacklog(
  days: number,
  series: Series[],
): Promise<ContentBacklog> {
  const seriesInfo = series.map((s) => ({
    name: s.name,
    slug: s.slug,
    description: s.description,
    cadence: s.cadenceHuman,
    durationSeconds: s.durationSeconds,
    platforms: s.platforms,
    hookLibrary: s.hookLibrary,
    approvalRequired: s.approvalRequired,
  }));

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + days);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 6000,
    system: `You are a content planner for traide.live, an AI-powered trading platform.
Generate a detailed content backlog for the specified time period.

RULES:
- Respect each series' cadence (scheduling pattern)
- Never make financial promises or guarantees in hooks/scripts
- Every piece must have a CTA to traide.live
- Hooks should be scroll-stopping — first 2 seconds matter
- Topics should be timely, varied, and non-repetitive
- Scripts should be brief outlines (3-5 bullet points), not full scripts
- Use the hook library as inspiration but generate fresh hooks

Respond in JSON:
{
  "startDate": "ISO string",
  "endDate": "ISO string",
  "items": [
    {
      "seriesSlug": "...",
      "scheduledAt": "ISO datetime",
      "topic": "...",
      "hook": "...",
      "briefScript": "...",
      "platforms": ["youtube"],
      "approvalRequired": true/false
    }
  ]
}

Sort items chronologically.`,
    messages: [
      {
        role: 'user',
        content: `Generate a ${days}-day content backlog starting from ${now.toISOString()}.

SERIES AVAILABLE:
${JSON.stringify(seriesInfo, null, 2)}`,
      },
    ],
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse content backlog response');
  }

  return JSON.parse(jsonMatch[0]);
}
