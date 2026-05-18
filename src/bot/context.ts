// Keeps last 10 messages per chat_id in Redis with 1-hour TTL
// Each entry: { role: 'user' | 'bot', text: string, draftIds: string[], timestamp: number }

import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const PREFIX = 'ctx:';
const MAX_MESSAGES = 10;
const TTL_SECONDS = 3600; // 1 hour

export interface ContextMessage {
  role: 'user' | 'bot';
  text: string;
  draftIds: string[];
  timestamp: number;
}

export async function getContext(chatId: string | number): Promise<ContextMessage[]> {
  const raw = await redis.get(`${PREFIX}${chatId}`);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export async function addMessage(chatId: string | number, msg: ContextMessage): Promise<void> {
  const ctx = await getContext(chatId);
  ctx.push(msg);
  // Keep only last MAX_MESSAGES
  const trimmed = ctx.slice(-MAX_MESSAGES);
  await redis.setex(`${PREFIX}${chatId}`, TTL_SECONDS, JSON.stringify(trimmed));
}

export async function clearContext(chatId: string | number): Promise<void> {
  await redis.del(`${PREFIX}${chatId}`);
}

export async function hasContext(chatId: string | number): Promise<boolean> {
  return (await redis.exists(`${PREFIX}${chatId}`)) === 1;
}

// Extract draft IDs mentioned in recent context
export function getRecentDraftIds(ctx: ContextMessage[]): string[] {
  const ids: string[] = [];
  for (const msg of ctx.slice().reverse()) {
    ids.push(...msg.draftIds);
  }
  return [...new Set(ids)];
}
