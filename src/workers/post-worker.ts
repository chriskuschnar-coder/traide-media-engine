// ── Post Worker ──
// Processes distribution jobs - actually posts to platforms

import 'dotenv/config';
import { distributionQueue } from '../services/queue/index.js';
import { distribute } from '../agents/distributor/index.js';

distributionQueue.process(async (job) => {
  const request = job.data;
  console.log(`📤 Distributing content: ${request.id} to ${request.platforms.join(', ')}`);

  const results = await distribute(request);

  const succeeded = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;

  console.log(`📊 Distribution complete: ${succeeded} succeeded, ${failed} failed`);

  return { results, succeeded, failed };
});

console.log('📤 Post worker started, waiting for distribution jobs...');
