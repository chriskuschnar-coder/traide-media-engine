// ── YouTube Native Integration ──
// Kept as native integration for better quota control and YouTube-specific features.
// Improved from src/platforms/youtube/index.ts with error handling, retry logic, and analytics.

import 'dotenv/config';
import { google } from 'googleapis';
import fs from 'fs';
import type { ContentAsset } from '../../types/index.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function createOAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
  });
  return oauth2Client;
}

function getYouTubeClient() {
  return google.youtube({ version: 'v3', auth: createOAuthClient() });
}

function getYouTubeAnalyticsClient() {
  return google.youtubeAnalytics({ version: 'v2', auth: createOAuthClient() });
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  label: string = 'YouTube API call',
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const isRetryable =
        lastError.message.includes('quota') === false &&
        lastError.message.includes('forbidden') === false &&
        lastError.message.includes('notFound') === false;

      if (!isRetryable || attempt === retries) {
        break;
      }

      console.warn(
        `[YouTube] ${label} attempt ${attempt}/${retries} failed: ${lastError.message}. Retrying in ${RETRY_DELAY_MS * attempt}ms...`,
      );
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  throw new Error(`[YouTube] ${label} failed after ${retries} attempts: ${lastError?.message}`);
}

// ── Upload a YouTube Short ──
export async function uploadShort(params: {
  videoPath: string;
  title: string;
  description: string;
  tags: string[];
}): Promise<{ id: string; url: string }> {
  return withRetry(async () => {
    const yt = getYouTubeClient();

    if (!fs.existsSync(params.videoPath)) {
      throw new Error(`Video file not found: ${params.videoPath}`);
    }

    const res = await yt.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: params.title.slice(0, 100),
          description: `${params.description}\n\n🔗 Try traide.live - AI-Powered Trading Intelligence\n\n#trading #ai #forex #crypto #traide`,
          tags: [...params.tags, 'traide', 'trading', 'AI trading', 'forex', 'crypto'],
          categoryId: '22',
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false,
          madeForKids: false,
        },
      },
      media: {
        body: fs.createReadStream(params.videoPath),
      },
    });

    const videoId = res.data.id;
    if (!videoId) {
      throw new Error('Upload succeeded but no video ID returned');
    }

    return {
      id: videoId,
      url: `https://youtube.com/shorts/${videoId}`,
    };
  }, MAX_RETRIES, 'uploadShort');
}

// ── Upload a long-form video ──
export async function uploadVideo(params: {
  videoPath: string;
  title: string;
  description: string;
  tags: string[];
  privacyStatus?: 'public' | 'private' | 'unlisted';
}): Promise<{ id: string; url: string }> {
  return withRetry(async () => {
    const yt = getYouTubeClient();

    if (!fs.existsSync(params.videoPath)) {
      throw new Error(`Video file not found: ${params.videoPath}`);
    }

    const res = await yt.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: params.title.slice(0, 100),
          description: params.description,
          tags: params.tags,
          categoryId: '22',
        },
        status: {
          privacyStatus: params.privacyStatus ?? 'public',
          selfDeclaredMadeForKids: false,
          madeForKids: false,
        },
      },
      media: {
        body: fs.createReadStream(params.videoPath),
      },
    });

    const videoId = res.data.id;
    if (!videoId) {
      throw new Error('Upload succeeded but no video ID returned');
    }

    return {
      id: videoId,
      url: `https://youtube.com/watch?v=${videoId}`,
    };
  }, MAX_RETRIES, 'uploadVideo');
}

// ── Get video statistics (views, likes, comments) ──
export async function getVideoStats(videoId: string): Promise<{
  views: number;
  likes: number;
  comments: number;
  favorites: number;
}> {
  return withRetry(async () => {
    const yt = getYouTubeClient();

    const res = await yt.videos.list({
      part: ['statistics'],
      id: [videoId],
    });

    const stats = res.data.items?.[0]?.statistics;
    if (!stats) {
      throw new Error(`No statistics found for video ${videoId}`);
    }

    return {
      views: parseInt(stats.viewCount || '0', 10),
      likes: parseInt(stats.likeCount || '0', 10),
      comments: parseInt(stats.commentCount || '0', 10),
      favorites: parseInt(stats.favoriteCount || '0', 10),
    };
  }, MAX_RETRIES, 'getVideoStats');
}

// ── Get video analytics (watch time, retention) via YouTube Analytics API ──
export async function getVideoAnalytics(params: {
  videoId: string;
  startDate?: string; // YYYY-MM-DD, defaults to 7 days ago
  endDate?: string;   // YYYY-MM-DD, defaults to today
}): Promise<{
  views: number;
  likes: number;
  comments: number;
  watchTimeMinutes: number;
  averageViewDuration: number;
  subscribersGained: number;
}> {
  return withRetry(async () => {
    const analytics = getYouTubeAnalyticsClient();

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startDate = params.startDate ?? weekAgo.toISOString().split('T')[0];
    const endDate = params.endDate ?? now.toISOString().split('T')[0];

    const res = await analytics.reports.query({
      ids: 'channel==MINE',
      startDate,
      endDate,
      metrics: 'views,likes,comments,estimatedMinutesWatched,averageViewDuration,subscribersGained',
      filters: `video==${params.videoId}`,
    });

    const row = res.data.rows?.[0];
    if (!row) {
      // Return zeros if no data yet (new video)
      return {
        views: 0,
        likes: 0,
        comments: 0,
        watchTimeMinutes: 0,
        averageViewDuration: 0,
        subscribersGained: 0,
      };
    }

    return {
      views: row[0] as number,
      likes: row[1] as number,
      comments: row[2] as number,
      watchTimeMinutes: row[3] as number,
      averageViewDuration: row[4] as number,
      subscribersGained: row[5] as number,
    };
  }, MAX_RETRIES, 'getVideoAnalytics');
}

// ── Delete a video ──
export async function deleteVideo(videoId: string): Promise<void> {
  return withRetry(async () => {
    const yt = getYouTubeClient();
    await yt.videos.delete({ id: videoId });
  }, MAX_RETRIES, 'deleteVideo');
}
