// ── Video Worker ──
// Processes content creation jobs from the queue

import 'dotenv/config';
import { contentQueue } from '../services/queue/index.js';
import { createContent } from '../agents/content-creator/index.js';
import { distributionQueue } from '../services/queue/index.js';
import type { ContentRequest } from '../types/index.js';

contentQueue.process(async (job) => {
  const request = job.data;
  console.log(`🎬 Processing content job: ${request.id} (${request.type})`);

  try {
    // Create the content
    const assets = await createContent(request);
    request.assets = assets;
    request.status = 'review'; // Or 'approved' for auto-post

    // Forward to distribution queue
    await distributionQueue.add({ ...request, status: 'posting' });

    console.log(`✅ Content created: ${request.id}, forwarded to distribution`);
    return { success: true, assets: assets.length };
  } catch (error) {
    console.error(`❌ Content creation failed: ${error}`);
    request.status = 'failed';
    throw error;
  }
});

console.log('🎬 Video worker started, waiting for jobs...');
