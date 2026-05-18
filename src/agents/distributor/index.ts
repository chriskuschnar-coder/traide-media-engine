// ── Distribution Agent ──
// Takes created content and posts it to all target platforms

import { uploadShort } from '../../platforms/youtube/index.js';
import { postTweet, postThread } from '../../platforms/x/index.js';
import { postReel as postIGReel, postImage as postIGImage } from '../../platforms/instagram/index.js';
import { postVideo as postTikTokVideo } from '../../platforms/tiktok/index.js';
import { postToPage as postFB, postReel as postFBReel } from '../../platforms/facebook/index.js';
import { postToChannel as postTelegram } from '../../platforms/telegram/index.js';
import type { ContentRequest, Platform, PostResult } from '../../types/index.js';

export async function distribute(request: ContentRequest): Promise<PostResult[]> {
  const results: PostResult[] = [];

  for (const platform of request.platforms) {
    try {
      const result = await postToPlatform(platform, request);
      results.push({ platform, ...result, status: 'success', postedAt: new Date() });
      console.log(`✅ Posted to ${platform}: ${result.url || result.postId}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      results.push({ platform, status: 'failed', error: msg });
      console.error(`❌ Failed to post to ${platform}: ${msg}`);
    }
  }

  return results;
}

async function postToPlatform(
  platform: Platform,
  request: ContentRequest
): Promise<{ postId?: string; url?: string }> {
  const videoAsset = request.assets?.find(a => a.type === 'video');
  const imageAsset = request.assets?.find(a => a.type === 'image');
  const caption = request.prompt;

  switch (platform) {
    case 'youtube': {
      if (!videoAsset) throw new Error('No video asset for YouTube');
      const res = await uploadShort({
        videoPath: videoAsset.path,
        title: caption.slice(0, 100),
        description: caption,
        tags: ['traide', 'trading', 'ai'],
      });
      return { postId: res.id, url: res.url };
    }

    case 'x': {
      if (request.type === 'thread') {
        const tweets = caption.split('\n---\n'); // Split on separator
        const res = await postThread({ tweets, mediaPath: videoAsset?.path });
        return { postId: res.ids[0], url: res.url };
      }
      const res = await postTweet({ text: caption, mediaPath: videoAsset?.path || imageAsset?.path });
      return { postId: res.id, url: res.url };
    }

    case 'instagram': {
      if (videoAsset) {
        const res = await postIGReel({ videoUrl: videoAsset.path, caption });
        return { postId: res.id, url: res.url };
      }
      if (imageAsset) {
        const res = await postIGImage({ imageUrl: imageAsset.path, caption });
        return { postId: res.id };
      }
      throw new Error('Instagram requires media');
    }

    case 'tiktok': {
      if (!videoAsset) throw new Error('TikTok requires video');
      const res = await postTikTokVideo({ videoPath: videoAsset.path, title: caption });
      return { postId: res.id };
    }

    case 'facebook': {
      if (videoAsset) {
        const res = await postFBReel({ videoUrl: videoAsset.path, description: caption });
        return { postId: res.id };
      }
      const res = await postFB({ message: caption, link: 'https://traide.live' });
      return { postId: res.id, url: res.url };
    }

    case 'telegram': {
      const res = await postTelegram({
        text: caption,
        videoPath: videoAsset?.path,
        imagePath: imageAsset?.path,
        buttons: [{ text: '🚀 Try Traide.live', url: 'https://traide.live' }],
      });
      return { postId: String(res.messageId) };
    }

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}
