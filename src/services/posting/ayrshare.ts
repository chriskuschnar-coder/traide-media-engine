// ── Ayrshare Unified Posting API ──
// Single API to post to all social platforms (X, Instagram, TikTok, Facebook, LinkedIn, etc.)

import 'dotenv/config';
import axios, { AxiosError } from 'axios';

const API_BASE = 'https://api.ayrshare.com/api';
const API_KEY = process.env.AYRSHARE_API_KEY;

function getHeaders() {
  if (!API_KEY) {
    throw new Error('AYRSHARE_API_KEY is not set in environment variables');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  };
}

interface AyrshareError {
  message: string;
  code?: string;
  status?: number;
}

function handleError(error: unknown): never {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    const msg = data?.message || data?.error || error.message;
    throw new Error(`Ayrshare API error (${error.response?.status}): ${msg}`);
  }
  throw error;
}

// ── Post to multiple platforms in one call ──
export async function postToAll(params: {
  post: string;
  platforms: string[];
  mediaUrls?: string[];
  scheduledDate?: string;
}): Promise<{ id: string; postIds: Record<string, string> }> {
  try {
    const body: Record<string, unknown> = {
      post: params.post,
      platforms: params.platforms,
    };

    if (params.mediaUrls?.length) {
      body.mediaUrls = params.mediaUrls;
    }

    if (params.scheduledDate) {
      body.scheduleDate = params.scheduledDate;
    }

    const res = await axios.post(`${API_BASE}/post`, body, {
      headers: getHeaders(),
    });

    return {
      id: res.data.id,
      postIds: res.data.postIds ?? {},
    };
  } catch (error) {
    handleError(error);
  }
}

// ── Post video content ──
export async function postVideo(params: {
  videoUrl: string;
  title: string;
  caption: string;
  platforms: string[];
}): Promise<{ id: string; postIds: Record<string, string> }> {
  try {
    const res = await axios.post(
      `${API_BASE}/post`,
      {
        post: params.caption,
        platforms: params.platforms,
        mediaUrls: [params.videoUrl],
        title: params.title,
        isVideo: true,
      },
      { headers: getHeaders() },
    );

    return {
      id: res.data.id,
      postIds: res.data.postIds ?? {},
    };
  } catch (error) {
    handleError(error);
  }
}

// ── Get post performance analytics ──
export async function getAnalytics(params: {
  postId: string;
}): Promise<{
  analytics: Record<string, unknown>;
  platforms: Record<string, unknown>;
}> {
  try {
    const res = await axios.get(`${API_BASE}/analytics/post`, {
      headers: getHeaders(),
      params: { id: params.postId },
    });

    return {
      analytics: res.data.analytics ?? res.data,
      platforms: res.data.platforms ?? {},
    };
  } catch (error) {
    handleError(error);
  }
}

// ── Get comments on a post ──
export async function getComments(params: {
  postId: string;
}): Promise<{ comments: Array<{ id: string; comment: string; platform: string; created: string }> }> {
  try {
    const res = await axios.get(`${API_BASE}/comments`, {
      headers: getHeaders(),
      params: { id: params.postId },
    });

    return {
      comments: res.data.comments ?? [],
    };
  } catch (error) {
    handleError(error);
  }
}

// ── Reply to a comment ──
export async function replyToComment(params: {
  commentId: string;
  platforms: string[];
  comment: string;
}): Promise<{ status: string }> {
  try {
    const res = await axios.post(
      `${API_BASE}/comments`,
      {
        commentId: params.commentId,
        platforms: params.platforms,
        comment: params.comment,
      },
      { headers: getHeaders() },
    );

    return {
      status: res.data.status ?? 'ok',
    };
  } catch (error) {
    handleError(error);
  }
}
