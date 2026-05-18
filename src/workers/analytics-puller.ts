// ── Analytics Puller Worker ──
// Runs every 4 hours via node-cron. Pulls metrics for posts from the last 7 days
// and stores results in output/analytics.json (will be Supabase later).

import 'dotenv/config';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { getAnalytics as getAyrshareAnalytics } from '../services/posting/ayrshare.js';
import { getVideoStats } from '../services/posting/youtube-native.js';

// ── Types ──

export interface PostRecord {
  id: string;
  platform: string;
  contentType: string;
  seriesName: string;
  hook: string;
  script: string;
  assetUrl: string;
  ayrshareId: string;
  postedAt: string;
}

export interface MetricRecord {
  postId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  watchTimePct: number;
  retention3s: number;
  retention10s: number;
  retentionEnd: number;
  capturedAt: string;
}

export interface AnalyticsStore {
  posts: PostRecord[];
  metrics: MetricRecord[];
}

// ── Storage ──

const ANALYTICS_PATH = path.resolve('output/analytics.json');

function ensureOutputDir(): void {
  const dir = path.dirname(ANALYTICS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadStore(): AnalyticsStore {
  ensureOutputDir();
  if (!fs.existsSync(ANALYTICS_PATH)) {
    return { posts: [], metrics: [] };
  }
  try {
    const raw = fs.readFileSync(ANALYTICS_PATH, 'utf-8');
    return JSON.parse(raw) as AnalyticsStore;
  } catch {
    console.warn('[Analytics] Corrupted analytics file, starting fresh');
    return { posts: [], metrics: [] };
  }
}

function saveStore(store: AnalyticsStore): void {
  ensureOutputDir();
  fs.writeFileSync(ANALYTICS_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

// ── Helpers ──

function isWithinLastDays(dateStr: string, days: number): boolean {
  const postDate = new Date(dateStr);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return postDate >= cutoff;
}

// ── Core Pull Logic ──

async function pullMetricsForPost(post: PostRecord): Promise<MetricRecord | null> {
  try {
    // For YouTube posts, use the native API for richer data
    if (post.platform === 'youtube' && post.id) {
      const stats = await getVideoStats(post.id);
      return {
        postId: post.id,
        views: stats.views,
        likes: stats.likes,
        comments: stats.comments,
        shares: 0, // YouTube API doesn't expose shares directly
        watchTimePct: 0,
        retention3s: 0,
        retention10s: 0,
        retentionEnd: 0,
        capturedAt: new Date().toISOString(),
      };
    }

    // For all other platforms, use Ayrshare analytics
    if (post.ayrshareId) {
      const result = await getAyrshareAnalytics({ postId: post.ayrshareId });
      const analytics = result.analytics as Record<string, number>;
      return {
        postId: post.id,
        views: analytics.views ?? analytics.impressions ?? 0,
        likes: analytics.likes ?? analytics.reactions ?? 0,
        comments: analytics.comments ?? analytics.replies ?? 0,
        shares: analytics.shares ?? analytics.retweets ?? analytics.reposts ?? 0,
        watchTimePct: analytics.watchTimePct ?? 0,
        retention3s: analytics.retention3s ?? 0,
        retention10s: analytics.retention10s ?? 0,
        retentionEnd: analytics.retentionEnd ?? 0,
        capturedAt: new Date().toISOString(),
      };
    }

    console.warn(`[Analytics] Post ${post.id} has no ayrshareId or YouTube ID, skipping`);
    return null;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Analytics] Failed to pull metrics for post ${post.id}: ${msg}`);
    return null;
  }
}

export async function pullAllMetrics(): Promise<{ pulled: number; errors: number }> {
  const store = loadStore();
  const recentPosts = store.posts.filter((p) => isWithinLastDays(p.postedAt, 7));

  console.log(`[Analytics] Pulling metrics for ${recentPosts.length} posts from last 7 days`);

  let pulled = 0;
  let errors = 0;

  for (const post of recentPosts) {
    const metric = await pullMetricsForPost(post);
    if (metric) {
      store.metrics.push(metric);
      pulled++;
    } else {
      errors++;
    }
  }

  saveStore(store);
  console.log(`[Analytics] Done. Pulled: ${pulled}, Errors: ${errors}`);

  return { pulled, errors };
}

// ── Post Registration ──

export function registerPost(post: PostRecord): void {
  const store = loadStore();
  store.posts.push(post);
  saveStore(store);
  console.log(`[Analytics] Registered post ${post.id} on ${post.platform}`);
}

// ── Cron Job Setup ──

let cronTask: cron.ScheduledTask | null = null;

export function startAnalyticsPuller(): void {
  if (cronTask) {
    console.warn('[Analytics] Puller already running');
    return;
  }

  // Run every 4 hours
  cronTask = cron.schedule('0 */4 * * *', async () => {
    console.log(`[Analytics] Cron triggered at ${new Date().toISOString()}`);
    await pullAllMetrics();
  });

  console.log('[Analytics] Puller started — runs every 4 hours');
}

export function stopAnalyticsPuller(): void {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    console.log('[Analytics] Puller stopped');
  }
}

export function getAnalyticsStore(): AnalyticsStore {
  return loadStore();
}
