// ── HeyGen Avatar Video Service ──
// Generates AI talking-head videos via the HeyGen API v2

import axios from 'axios';

const HEYGEN_BASE_URL = 'https://api.heygen.com/v2';

function getApiKey(): string {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) throw new Error('HEYGEN_API_KEY is not set in environment');
  return key;
}

function getDefaultAvatarId(): string {
  return process.env.HEYGEN_AVATAR_ID || 'default';
}

interface GenerateAvatarVideoParams {
  /** The script the avatar will speak */
  script: string;
  /** HeyGen avatar ID (falls back to HEYGEN_AVATAR_ID env var) */
  avatarId?: string;
}

interface HeyGenVideoResult {
  videoId: string;
  videoUrl: string;
  status: string;
}

/**
 * Creates a talking-head avatar video through HeyGen's API.
 *
 * Flow:
 * 1. POST to /video/generate to start the render
 * 2. Poll GET /video/{id} until status is "completed"
 * 3. Return the video URL
 */
export async function generateAvatarVideo(
  params: GenerateAvatarVideoParams,
): Promise<HeyGenVideoResult> {
  const apiKey = getApiKey();
  const avatarId = params.avatarId || getDefaultAvatarId();

  const headers = {
    'X-Api-Key': apiKey,
    'Content-Type': 'application/json',
  };

  // Step 1 — Request video generation
  console.log('[heygen] Requesting avatar video generation...');
  const createResponse = await axios.post<{ data: { video_id: string } }>(
    `${HEYGEN_BASE_URL}/video/generate`,
    {
      video_inputs: [
        {
          character: {
            type: 'avatar',
            avatar_id: avatarId,
            avatar_style: 'normal',
          },
          voice: {
            type: 'text',
            input_text: params.script,
            voice_id: process.env.HEYGEN_VOICE_ID || undefined,
          },
        },
      ],
      dimension: {
        width: 1080,
        height: 1920,
      },
    },
    { headers },
  );

  const videoId = createResponse.data.data.video_id;
  console.log(`[heygen] Video queued: ${videoId}`);

  // Step 2 — Poll for completion
  const maxAttempts = 120; // up to ~10 minutes at 5s intervals
  const pollIntervalMs = 5_000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(pollIntervalMs);

    const statusResponse = await axios.get<{
      data: { status: string; video_url?: string };
    }>(`${HEYGEN_BASE_URL}/video/${videoId}`, { headers });

    const { status, video_url } = statusResponse.data.data;

    if (status === 'completed' && video_url) {
      console.log(`[heygen] Video ready: ${video_url}`);
      return {
        videoId,
        videoUrl: video_url,
        status,
      };
    }

    if (status === 'failed') {
      throw new Error(`HeyGen video generation failed for videoId=${videoId}`);
    }

    console.log(`[heygen] Polling... status=${status} (attempt ${attempt + 1}/${maxAttempts})`);
  }

  throw new Error(`HeyGen video generation timed out after ${maxAttempts} attempts for videoId=${videoId}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
