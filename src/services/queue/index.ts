// ── Job Queue Service ──
// Bull queue for processing content creation and posting jobs

import Bull from 'bull';
import type { ContentRequest } from '../../types/index.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Content creation queue (AI generation, video rendering)
export const contentQueue = new Bull<ContentRequest>('content-creation', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Distribution queue (posting to platforms)
export const distributionQueue = new Bull<ContentRequest>('distribution', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Scheduled content queue
export const scheduleQueue = new Bull<ContentRequest>('scheduled', REDIS_URL, {
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: 50,
  },
});

export async function addContentJob(request: ContentRequest) {
  if (request.schedule) {
    const delay = new Date(request.schedule).getTime() - Date.now();
    return scheduleQueue.add(request, { delay: Math.max(0, delay) });
  }
  return contentQueue.add(request);
}

export async function getQueueStats() {
  const [contentWaiting, contentActive, distWaiting, distActive] = await Promise.all([
    contentQueue.getWaitingCount(),
    contentQueue.getActiveCount(),
    distributionQueue.getWaitingCount(),
    distributionQueue.getActiveCount(),
  ]);

  return {
    content: { waiting: contentWaiting, active: contentActive },
    distribution: { waiting: distWaiting, active: distActive },
  };
}
