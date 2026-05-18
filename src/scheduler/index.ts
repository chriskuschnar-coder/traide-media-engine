// ── Autonomous Content Scheduler ──
// Reads from a content backlog, generates content, runs compliance,
// and auto-posts or routes to Telegram for approval.

import 'dotenv/config';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { postToAll, postVideo } from '../services/posting/ayrshare.js';
import { uploadShort } from '../services/posting/youtube-native.js';
import { registerPost } from '../workers/analytics-puller.js';
import type { Platform, ContentType } from '../types/index.js';

// ── Types ──

export interface BacklogItem {
  id: string;
  scheduledAt: string;          // ISO datetime
  contentType: ContentType;
  platforms: Platform[];
  topic: string;
  hook: string;
  script?: string;
  seriesName?: string;
  approvalRequired: boolean;
  status: 'pending' | 'generating' | 'compliance_review' | 'awaiting_approval' | 'approved' | 'posting' | 'posted' | 'failed' | 'rejected';
  complianceFlags?: string[];
  ayrshareId?: string;
  assetUrl?: string;
  error?: string;
  createdAt: string;
}

interface Backlog {
  items: BacklogItem[];
}

// ── Config ──

const BACKLOG_PATH = path.resolve('output/backlog.json');
const ENABLED_PLATFORMS: Platform[] = (process.env.ENABLED_PLATFORMS || 'youtube')
  .split(',')
  .map((p) => p.trim() as Platform);

let schedulerPaused = false;
let schedulerCron: cron.ScheduledTask | null = null;
let backlogRefillCron: cron.ScheduledTask | null = null;

// ── Storage Helpers ──

function ensureOutputDir(): void {
  const dir = path.dirname(BACKLOG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadBacklog(): Backlog {
  ensureOutputDir();
  if (!fs.existsSync(BACKLOG_PATH)) {
    return { items: [] };
  }
  try {
    const raw = fs.readFileSync(BACKLOG_PATH, 'utf-8');
    return JSON.parse(raw) as Backlog;
  } catch {
    console.warn('[Scheduler] Corrupted backlog file, starting fresh');
    return { items: [] };
  }
}

function saveBacklog(backlog: Backlog): void {
  ensureOutputDir();
  fs.writeFileSync(BACKLOG_PATH, JSON.stringify(backlog, null, 2), 'utf-8');
}

// ── Content Generation (stub — wire to your content-creator agent) ──

async function generateContent(item: BacklogItem): Promise<{
  script: string;
  assetUrl?: string;
}> {
  // TODO: Wire to src/agents/content-creator to generate actual content
  console.log(`[Scheduler] Generating content for: ${item.topic}`);
  return {
    script: item.script || `Generated script for: ${item.topic}`,
    assetUrl: item.assetUrl,
  };
}

// ── Compliance Review (stub — wire to your compliance service) ──

async function runComplianceReview(item: BacklogItem): Promise<{
  passed: boolean;
  flags: string[];
}> {
  // TODO: Wire to src/services/compliance when it exists
  console.log(`[Scheduler] Running compliance review for: ${item.id}`);

  const flags: string[] = [];

  // Basic checks
  const script = item.script?.toLowerCase() || '';
  if (script.includes('guaranteed returns') || script.includes('risk free')) {
    flags.push('financial_claim: potentially misleading financial claim');
  }
  if (script.includes('buy now') && script.includes('limited time')) {
    flags.push('pressure_tactics: high-pressure sales language detected');
  }

  return {
    passed: flags.length === 0,
    flags,
  };
}

// ── Telegram Notification (stub — calls back to telegram bot) ──

async function sendToTelegramForApproval(item: BacklogItem, reason: string): Promise<void> {
  // TODO: Wire to the Telegram bot's sendMessage for approval routing
  console.log(`[Scheduler] Sending to Telegram for approval: ${item.id} — ${reason}`);
}

// ── Posting Logic ──

async function postItem(item: BacklogItem): Promise<void> {
  const platformsToPost = item.platforms.filter((p) => ENABLED_PLATFORMS.includes(p));

  if (platformsToPost.length === 0) {
    console.warn(`[Scheduler] No enabled platforms for item ${item.id}`);
    return;
  }

  const nonYoutubePlatforms = platformsToPost.filter((p) => p !== 'youtube');
  const postToYoutube = platformsToPost.includes('youtube');

  // Post to non-YouTube platforms via Ayrshare
  if (nonYoutubePlatforms.length > 0 && item.script) {
    try {
      const isVideo = ['short_video', 'long_video'].includes(item.contentType);

      const result = isVideo && item.assetUrl
        ? await postVideo({
            videoUrl: item.assetUrl,
            title: item.hook,
            caption: item.script,
            platforms: nonYoutubePlatforms,
          })
        : await postToAll({
            post: item.script,
            platforms: nonYoutubePlatforms,
            mediaUrls: item.assetUrl ? [item.assetUrl] : undefined,
          });

      item.ayrshareId = result.id;

      // Register for analytics tracking
      for (const platform of nonYoutubePlatforms) {
        registerPost({
          id: `${item.id}-${platform}`,
          platform,
          contentType: item.contentType,
          seriesName: item.seriesName || '',
          hook: item.hook,
          script: item.script || '',
          assetUrl: item.assetUrl || '',
          ayrshareId: result.id,
          postedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[Scheduler] Ayrshare post failed for ${item.id}: ${msg}`);
      throw error;
    }
  }

  // Post to YouTube natively
  if (postToYoutube && item.assetUrl && item.contentType === 'short_video') {
    try {
      const result = await uploadShort({
        videoPath: item.assetUrl,
        title: item.hook,
        description: item.script || '',
        tags: ['traide', 'trading', 'AI'],
      });

      registerPost({
        id: result.id,
        platform: 'youtube',
        contentType: item.contentType,
        seriesName: item.seriesName || '',
        hook: item.hook,
        script: item.script || '',
        assetUrl: item.assetUrl,
        ayrshareId: '',
        postedAt: new Date().toISOString(),
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[Scheduler] YouTube upload failed for ${item.id}: ${msg}`);
      throw error;
    }
  }
}

// ── Process a single backlog item ──

async function processItem(item: BacklogItem, backlog: Backlog): Promise<void> {
  try {
    // Step 1: Generate content
    item.status = 'generating';
    saveBacklog(backlog);

    const content = await generateContent(item);
    item.script = content.script;
    if (content.assetUrl) item.assetUrl = content.assetUrl;

    // Step 2: Compliance review
    item.status = 'compliance_review';
    saveBacklog(backlog);

    const compliance = await runComplianceReview(item);
    item.complianceFlags = compliance.flags;

    // Step 3: Route based on approval requirements and compliance
    if (item.approvalRequired || !compliance.passed) {
      item.status = 'awaiting_approval';
      saveBacklog(backlog);

      const reason = !compliance.passed
        ? `Compliance flags: ${compliance.flags.join(', ')}`
        : 'Manual approval required';
      await sendToTelegramForApproval(item, reason);
      return;
    }

    // Step 4: Auto-post
    item.status = 'posting';
    saveBacklog(backlog);

    await postItem(item);
    item.status = 'posted';
    saveBacklog(backlog);

    console.log(`[Scheduler] Successfully posted item ${item.id}`);
  } catch (error) {
    item.status = 'failed';
    item.error = error instanceof Error ? error.message : String(error);
    saveBacklog(backlog);
    console.error(`[Scheduler] Failed to process item ${item.id}: ${item.error}`);
  }
}

// ── Main Scheduler Tick ──

async function schedulerTick(): Promise<void> {
  if (schedulerPaused) {
    return;
  }

  const backlog = loadBacklog();
  const now = new Date();

  const dueItems = backlog.items.filter(
    (item) =>
      item.status === 'pending' &&
      new Date(item.scheduledAt) <= now,
  );

  if (dueItems.length === 0) return;

  console.log(`[Scheduler] Processing ${dueItems.length} due items`);

  for (const item of dueItems) {
    await processItem(item, backlog);
  }
}

// ── Backlog Auto-Refill ──

async function checkAndRefillBacklog(): Promise<void> {
  const backlog = loadBacklog();
  const now = new Date();
  const threeDaysAhead = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const upcomingItems = backlog.items.filter(
    (item) =>
      item.status === 'pending' &&
      new Date(item.scheduledAt) <= threeDaysAhead &&
      new Date(item.scheduledAt) >= now,
  );

  if (upcomingItems.length < 3) {
    console.log(`[Scheduler] Backlog low (${upcomingItems.length} items in next 3 days). Auto-generating...`);

    // TODO: Wire to content plan generator to create more items
    // For now, log the need
    console.log('[Scheduler] Auto-generation not yet wired. Please add items manually via /idea or the backlog file.');
  }
}

// ── Exported API ──

export function startScheduler(): void {
  if (schedulerCron) {
    console.warn('[Scheduler] Already running');
    return;
  }

  schedulerPaused = false;

  // Check for due items every minute
  schedulerCron = cron.schedule('* * * * *', async () => {
    try {
      await schedulerTick();
    } catch (error) {
      console.error('[Scheduler] Tick error:', error);
    }
  });

  // Daily at midnight: check if backlog needs refilling
  backlogRefillCron = cron.schedule('0 0 * * *', async () => {
    try {
      await checkAndRefillBacklog();
    } catch (error) {
      console.error('[Scheduler] Backlog refill error:', error);
    }
  });

  console.log('[Scheduler] Started — checking every minute for due items');
}

export function pauseScheduler(): void {
  schedulerPaused = true;
  console.log('[Scheduler] Paused');
}

export function resumeScheduler(): void {
  schedulerPaused = false;
  console.log('[Scheduler] Resumed');
}

export function getBacklogStatus(): {
  total: number;
  pending: number;
  posted: number;
  failed: number;
  awaitingApproval: number;
  nextScheduled: string | null;
  isPaused: boolean;
} {
  const backlog = loadBacklog();
  const pending = backlog.items.filter((i) => i.status === 'pending');
  const nextItem = pending.sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  )[0];

  return {
    total: backlog.items.length,
    pending: pending.length,
    posted: backlog.items.filter((i) => i.status === 'posted').length,
    failed: backlog.items.filter((i) => i.status === 'failed').length,
    awaitingApproval: backlog.items.filter((i) => i.status === 'awaiting_approval').length,
    nextScheduled: nextItem?.scheduledAt ?? null,
    isPaused: schedulerPaused,
  };
}

// ── Backlog Management ──

export function addToBacklog(item: Omit<BacklogItem, 'id' | 'status' | 'createdAt'>): BacklogItem {
  const backlog = loadBacklog();
  const newItem: BacklogItem = {
    ...item,
    id: nanoid(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  backlog.items.push(newItem);
  saveBacklog(backlog);
  console.log(`[Scheduler] Added to backlog: ${newItem.id} — ${newItem.topic}`);
  return newItem;
}

export function approveItem(itemId: string): boolean {
  const backlog = loadBacklog();
  const item = backlog.items.find((i) => i.id === itemId);
  if (!item || item.status !== 'awaiting_approval') {
    return false;
  }
  item.status = 'pending';
  item.scheduledAt = new Date().toISOString(); // Post ASAP
  saveBacklog(backlog);
  console.log(`[Scheduler] Approved item: ${itemId}`);
  return true;
}

export function rejectItem(itemId: string): boolean {
  const backlog = loadBacklog();
  const item = backlog.items.find((i) => i.id === itemId);
  if (!item || item.status !== 'awaiting_approval') {
    return false;
  }
  item.status = 'rejected';
  saveBacklog(backlog);
  console.log(`[Scheduler] Rejected item: ${itemId}`);
  return true;
}
