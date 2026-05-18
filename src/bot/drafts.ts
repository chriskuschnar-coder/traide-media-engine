import Redis from 'ioredis';
import { nanoid } from 'nanoid';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const PREFIX = 'draft:';
const INDEX_PREFIX = 'drafts:'; // per-chat index
const TTL_SECONDS = 86400 * 7; // 7 days

export type DraftStatus =
  | 'script_draft'
  | 'script_approved'
  | 'assets_generating'
  | 'assets_ready'
  | 'scheduled'
  | 'published'
  | 'measuring'
  | 'rejected';

export interface Draft {
  id: string;
  chatId: string;
  type: string; // video, post, thread, ad, carousel, scenario
  topic: string;
  platform: string;
  platforms: string[];
  status: DraftStatus;
  script?: {
    hook: string;
    body: string;
    caption: string;
    hashtags: string[];
    cta: string;
  };
  style?: {
    tone: string;
    visual: string;
    music: string;
    duration: number;
  };
  assets?: { type: string; path: string }[];
  scheduledFor?: string;
  publishedResults?: { platform: string; url?: string; id?: string }[];
  revisionHistory: string[]; // feedback strings
  createdAt: number;
  updatedAt: number;
}

export async function createDraft(params: {
  chatId: string;
  type: string;
  topic: string;
  platform?: string;
  platforms?: string[];
  script?: Draft['script'];
  style?: Draft['style'];
}): Promise<Draft> {
  const id = nanoid(8);
  const draft: Draft = {
    id,
    chatId: params.chatId,
    type: params.type,
    topic: params.topic,
    platform: params.platform || 'youtube',
    platforms: params.platforms || [params.platform || 'youtube'],
    status: 'script_draft',
    script: params.script,
    style: params.style,
    revisionHistory: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await saveDraft(draft);
  // Add to chat's draft index
  await redis.sadd(`${INDEX_PREFIX}${params.chatId}`, id);
  return draft;
}

export async function getDraft(id: string): Promise<Draft | null> {
  const raw = await redis.get(`${PREFIX}${id}`);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function saveDraft(draft: Draft): Promise<void> {
  draft.updatedAt = Date.now();
  await redis.setex(`${PREFIX}${draft.id}`, TTL_SECONDS, JSON.stringify(draft));
}

export async function updateDraftStatus(id: string, status: DraftStatus): Promise<Draft | null> {
  const draft = await getDraft(id);
  if (!draft) return null;
  draft.status = status;
  await saveDraft(draft);
  return draft;
}

export async function updateDraftScript(id: string, script: Draft['script']): Promise<Draft | null> {
  const draft = await getDraft(id);
  if (!draft) return null;
  draft.script = script;
  await saveDraft(draft);
  return draft;
}

export async function getDraftsForChat(chatId: string): Promise<Draft[]> {
  const ids = await redis.smembers(`${INDEX_PREFIX}${chatId}`);
  const drafts: Draft[] = [];
  for (const id of ids) {
    const d = await getDraft(id);
    if (d) drafts.push(d);
  }
  // Sort by most recent first
  return drafts.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getPendingDrafts(chatId: string): Promise<Draft[]> {
  const all = await getDraftsForChat(chatId);
  return all.filter(d => !['published', 'measuring', 'rejected'].includes(d.status));
}

export async function deleteDraft(id: string, chatId: string): Promise<void> {
  await redis.del(`${PREFIX}${id}`);
  await redis.srem(`${INDEX_PREFIX}${chatId}`, id);
}
