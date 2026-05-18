// ── Instagram Publisher (via Meta Graph API) ──

import axios from 'axios';

const BASE_URL = 'https://graph.facebook.com/v21.0';

export async function postReel(params: {
  videoUrl: string;  // Must be a publicly accessible URL
  caption: string;
}): Promise<{ id: string; url: string }> {
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID!;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN!;

  // Step 1: Create media container
  const container = await axios.post(`${BASE_URL}/${accountId}/media`, {
    media_type: 'REELS',
    video_url: params.videoUrl,
    caption: params.caption,
    access_token: token,
  });

  const containerId = container.data.id;

  // Step 2: Wait for processing
  let status = 'IN_PROGRESS';
  while (status === 'IN_PROGRESS') {
    await new Promise(r => setTimeout(r, 5000));
    const check = await axios.get(`${BASE_URL}/${containerId}`, {
      params: { fields: 'status_code', access_token: token },
    });
    status = check.data.status_code;
  }

  // Step 3: Publish
  const publish = await axios.post(`${BASE_URL}/${accountId}/media_publish`, {
    creation_id: containerId,
    access_token: token,
  });

  return {
    id: publish.data.id,
    url: `https://www.instagram.com/reel/${publish.data.id}/`,
  };
}

export async function postImage(params: {
  imageUrl: string;
  caption: string;
}): Promise<{ id: string }> {
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID!;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN!;

  const container = await axios.post(`${BASE_URL}/${accountId}/media`, {
    image_url: params.imageUrl,
    caption: params.caption,
    access_token: token,
  });

  const publish = await axios.post(`${BASE_URL}/${accountId}/media_publish`, {
    creation_id: container.data.id,
    access_token: token,
  });

  return { id: publish.data.id };
}
