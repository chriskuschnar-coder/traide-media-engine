// ── YouTube Shorts Publisher ──

import { google } from 'googleapis';
import fs from 'fs';
import type { ContentAsset } from '../../types/index.js';

function getYouTube() {
  if (!process.env.YOUTUBE_CLIENT_ID) throw new Error('YOUTUBE_CLIENT_ID not set — configure YouTube credentials in .env');
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });
  return google.youtube({ version: 'v3', auth: oauth2Client });
}

export async function uploadShort(params: {
  videoPath: string;
  title: string;
  description: string;
  tags: string[];
}): Promise<{ id: string; url: string }> {
  const youtube = getYouTube();
  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: params.title.slice(0, 100),
        description: `${params.description}\n\n🔗 Try traide.live - AI-Powered Trading Intelligence\n\n#trading #ai #forex #crypto #traide`,
        tags: [...params.tags, 'traide', 'trading', 'AI trading', 'forex', 'crypto'],
        categoryId: '22', // People & Blogs
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false,
        madeForKids: false,
      },
    },
    media: {
      body: fs.createReadStream(params.videoPath),
    },
  });

  const videoId = res.data.id!;
  return {
    id: videoId,
    url: `https://youtube.com/shorts/${videoId}`,
  };
}
