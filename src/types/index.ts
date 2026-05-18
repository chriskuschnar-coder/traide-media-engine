// ── Core Types for Traide Media Engine ──

export type Platform = 'youtube' | 'x' | 'instagram' | 'tiktok' | 'facebook' | 'telegram';

export type ContentType =
  | 'short_video'      // 15-60s vertical (YT Shorts, Reels, TikTok)
  | 'long_video'       // 1-10min (YouTube)
  | 'image_post'       // Static image + caption
  | 'carousel'         // Multi-image (IG, FB)
  | 'thread'           // X thread
  | 'text_post'        // Plain text post
  | 'story'            // 24hr stories (IG, FB)
  | 'ad';              // Paid promotion creative

export type ContentStatus =
  | 'queued'
  | 'creating'
  | 'rendering'
  | 'review'           // Waiting for human approval in Telegram
  | 'approved'
  | 'posting'
  | 'posted'
  | 'failed';

export interface ContentRequest {
  id: string;
  type: ContentType;
  platforms: Platform[];
  prompt: string;              // What the user asked for
  context?: string;            // Additional context about traide.live
  style?: ContentStyle;
  schedule?: Date;             // When to post (null = immediate)
  status: ContentStatus;
  createdAt: Date;
  assets?: ContentAsset[];
  results?: PostResult[];
}

export interface ContentStyle {
  tone: 'hype' | 'educational' | 'professional' | 'casual' | 'urgency';
  visual: 'dark_trading' | 'clean_minimal' | 'neon_tech' | 'data_heavy' | 'lifestyle';
  music: 'energetic' | 'ambient' | 'dramatic' | 'none';
  duration?: number;           // seconds for video
}

export interface ContentAsset {
  type: 'video' | 'image' | 'audio' | 'text';
  path: string;
  platform?: Platform;         // Platform-specific version
  metadata?: Record<string, unknown>;
}

export interface PostResult {
  platform: Platform;
  postId?: string;
  url?: string;
  status: 'success' | 'failed';
  error?: string;
  postedAt?: Date;
}

export interface ContentPlan {
  id: string;
  name: string;
  description: string;
  items: ContentPlanItem[];
  createdAt: Date;
}

export interface ContentPlanItem {
  day: number;
  time: string;
  type: ContentType;
  platforms: Platform[];
  topic: string;
  hook: string;
  style: ContentStyle;
}

export interface TraideContext {
  features: string[];
  recentUpdates: string[];
  metrics: Record<string, string>;
  targetAudience: string[];
  competitors: string[];
  uniqueSellingPoints: string[];
  brandVoice: string;
}
