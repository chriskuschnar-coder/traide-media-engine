// ── Content Creator Agent ──
// Orchestrates AI content creation: script → visuals → audio → final asset

import { generateContentScript, adaptForPlatform } from '../../services/ai/claude.js';
import { generateImage, generateVoiceover, generateVideoClip, addBrandOverlay } from '../../services/media/video.js';
import type { ContentRequest, ContentAsset, Platform } from '../../types/index.js';

export async function createContent(request: ContentRequest): Promise<ContentAsset[]> {
  const assets: ContentAsset[] = [];

  switch (request.type) {
    case 'short_video':
      return await createShortVideo(request);

    case 'image_post':
      return await createImagePost(request);

    case 'thread':
    case 'text_post':
      return await createTextContent(request);

    case 'ad':
      return await createAd(request);

    default:
      return await createShortVideo(request); // Default to video
  }
}

async function createShortVideo(request: ContentRequest): Promise<ContentAsset[]> {
  const style = request.style || { tone: 'hype' as const, visual: 'dark_trading' as const, music: 'energetic' as const, duration: 30 };
  const assets: ContentAsset[] = [];

  // Step 1: Generate script
  const script = await generateContentScript({
    type: 'short_video',
    topic: request.prompt,
    platform: request.platforms[0] || 'tiktok',
    style,
  });

  // Step 2: Generate visuals (hero image for video background)
  const heroImage = await generateImage({
    prompt: `Trading platform showcase: ${request.prompt}. traide.live UI with charts and AI indicators`,
    style: style.visual,
    width: 1080,
    height: 1920,
  });

  // Step 3: Generate voiceover from script
  const voiceover = await generateVoiceover({ script: script.script });

  // Step 4: Generate video clip from hero image
  const videoClip = await generateVideoClip({
    prompt: `Cinematic motion: ${request.prompt}. Trading charts with AI analysis overlay, professional fintech`,
    imageUrl: heroImage,
    duration: style.duration,
  });

  // Step 5: Brand the output
  const brandedImage = await addBrandOverlay({
    imagePath: heroImage,
    text: script.hook,
  });

  assets.push(
    { type: 'video', path: videoClip },
    { type: 'image', path: brandedImage },
    { type: 'audio', path: voiceover },
    { type: 'text', path: '', metadata: { script: script.script, caption: script.caption, hashtags: script.hashtags, cta: script.cta, hook: script.hook } },
  );

  return assets;
}

async function createImagePost(request: ContentRequest): Promise<ContentAsset[]> {
  const style = request.style || { tone: 'professional' as const, visual: 'dark_trading' as const, music: 'none' as const };

  const image = await generateImage({
    prompt: request.prompt,
    style: style.visual,
    width: 1080,
    height: 1080,
  });

  const branded = await addBrandOverlay({ imagePath: image, text: request.prompt.slice(0, 50) });

  const script = await generateContentScript({
    type: 'image_post',
    topic: request.prompt,
    platform: request.platforms[0] || 'instagram',
    style,
  });

  return [
    { type: 'image', path: branded },
    { type: 'text', path: '', metadata: { caption: script.caption, hashtags: script.hashtags } },
  ];
}

async function createTextContent(request: ContentRequest): Promise<ContentAsset[]> {
  const assets: ContentAsset[] = [];

  // Generate platform-specific text for each target
  for (const platform of request.platforms) {
    const script = await generateContentScript({
      type: request.type,
      topic: request.prompt,
      platform,
      style: request.style || { tone: 'professional' as const, visual: 'clean_minimal' as const, music: 'none' as const },
    });

    assets.push({
      type: 'text',
      path: '',
      platform,
      metadata: { text: script.script, caption: script.caption, hashtags: script.hashtags },
    });
  }

  return assets;
}

async function createAd(request: ContentRequest): Promise<ContentAsset[]> {
  // Ads get both image and video versions
  const imageAssets = await createImagePost(request);
  const videoAssets = await createShortVideo(request);
  return [...imageAssets, ...videoAssets];
}
