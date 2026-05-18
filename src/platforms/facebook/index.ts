// ── Facebook Publisher (via Graph API) ──

import axios from 'axios';

const BASE_URL = 'https://graph.facebook.com/v21.0';

export async function postToPage(params: {
  message: string;
  link?: string;
  imageUrl?: string;
}): Promise<{ id: string; url: string }> {
  const pageId = process.env.FACEBOOK_PAGE_ID!;
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN!;

  let endpoint = `${BASE_URL}/${pageId}/feed`;
  const data: Record<string, string> = {
    message: params.message,
    access_token: token,
  };

  if (params.link) data.link = params.link;

  if (params.imageUrl) {
    endpoint = `${BASE_URL}/${pageId}/photos`;
    data.url = params.imageUrl;
  }

  const res = await axios.post(endpoint, data);

  return {
    id: res.data.id,
    url: `https://facebook.com/${res.data.id}`,
  };
}

export async function postReel(params: {
  videoUrl: string;
  description: string;
}): Promise<{ id: string }> {
  const pageId = process.env.FACEBOOK_PAGE_ID!;
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN!;

  // Initialize reel upload
  const init = await axios.post(`${BASE_URL}/${pageId}/video_reels`, {
    upload_phase: 'start',
    access_token: token,
  });

  const videoId = init.data.video_id;

  // Upload video
  await axios.post(`${BASE_URL}/${videoId}`, {
    upload_phase: 'finish',
    video_file_url: params.videoUrl,
    description: params.description,
    access_token: token,
  });

  return { id: videoId };
}
