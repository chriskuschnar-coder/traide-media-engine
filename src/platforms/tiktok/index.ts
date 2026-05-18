// ── TikTok Publisher (via Content Posting API) ──

import axios from 'axios';
import fs from 'fs';

const BASE_URL = 'https://open.tiktokapis.com/v2';

export async function postVideo(params: {
  videoPath: string;
  title: string;
}): Promise<{ id: string }> {
  const token = process.env.TIKTOK_ACCESS_TOKEN!;

  // Step 1: Initialize upload
  const initRes = await axios.post(`${BASE_URL}/post/publish/video/init/`, {
    post_info: {
      title: params.title.slice(0, 150),
      privacy_level: 'PUBLIC_TO_EVERYONE',
      disable_duet: false,
      disable_comment: false,
      disable_stitch: false,
    },
    source_info: {
      source: 'FILE_UPLOAD',
      video_size: fs.statSync(params.videoPath).size,
    },
  }, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const { upload_url, publish_id } = initRes.data.data;

  // Step 2: Upload video
  const videoBuffer = fs.readFileSync(params.videoPath);
  await axios.put(upload_url, videoBuffer, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Range': `bytes 0-${videoBuffer.length - 1}/${videoBuffer.length}`,
    },
  });

  return { id: publish_id };
}
