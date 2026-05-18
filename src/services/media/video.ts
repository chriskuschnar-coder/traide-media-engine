// ── Video Generation Service ──
// Orchestrates AI video creation using multiple providers

import Replicate from 'replicate';
import { ElevenLabsClient } from 'elevenlabs';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import type { ContentStyle, Platform } from '../../types/index.js';

const replicate = new Replicate();
const elevenlabs = new ElevenLabsClient();

// Platform-specific video dimensions
const PLATFORM_SPECS: Record<string, { width: number; height: number; maxDuration: number }> = {
  youtube: { width: 1080, height: 1920, maxDuration: 60 },
  tiktok: { width: 1080, height: 1920, maxDuration: 60 },
  instagram: { width: 1080, height: 1920, maxDuration: 90 },
  facebook: { width: 1080, height: 1920, maxDuration: 60 },
  x: { width: 1080, height: 1920, maxDuration: 140 },
};

export async function generateImage(params: {
  prompt: string;
  style: ContentStyle['visual'];
  width?: number;
  height?: number;
}): Promise<string> {
  const stylePrompts: Record<string, string> = {
    dark_trading: 'dark theme, trading charts, neon accents, professional fintech, moody lighting',
    clean_minimal: 'clean white background, minimal design, modern UI, professional',
    neon_tech: 'cyberpunk neon, tech aesthetic, glowing elements, futuristic',
    data_heavy: 'data visualization, charts and graphs, analytical, professional',
    lifestyle: 'lifestyle photography style, aspirational, modern workspace',
  };

  const fullPrompt = `${params.prompt}. Style: ${stylePrompts[params.style] || stylePrompts.dark_trading}.
  High quality, professional marketing material for a trading platform called traide.live`;

  // Use Flux (via Replicate) for image generation
  const output = await replicate.run('black-forest-labs/flux-1.1-pro', {
    input: {
      prompt: fullPrompt,
      width: params.width || 1080,
      height: params.height || 1920,
      num_outputs: 1,
    },
  });

  // Save the generated image
  const outputPath = path.join(process.cwd(), 'output', 'images', `img_${Date.now()}.png`);
  const imageUrl = Array.isArray(output) ? output[0] : output;

  if (typeof imageUrl === 'string') {
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(outputPath, buffer);
  }

  return outputPath;
}

export async function generateVoiceover(params: {
  script: string;
  voice?: string;
}): Promise<string> {
  const outputPath = path.join(process.cwd(), 'output', 'videos', `voice_${Date.now()}.mp3`);

  const audio = await elevenlabs.textToSpeech.convert('pNInz6obpgDQGcFmaJgB', {
    text: params.script,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
    },
  });

  // Collect stream chunks
  const chunks: Buffer[] = [];
  for await (const chunk of audio) {
    chunks.push(Buffer.from(chunk));
  }
  await fs.writeFile(outputPath, Buffer.concat(chunks));

  return outputPath;
}

export async function generateVideoClip(params: {
  prompt: string;
  imageUrl?: string;
  duration?: number;
}): Promise<string> {
  // Use Runway Gen-3 or Kling via Replicate for video generation
  const output = await replicate.run('minimax/video-01-live', {
    input: {
      prompt: params.prompt,
      ...(params.imageUrl && { first_frame_image: params.imageUrl }),
    },
  });

  const outputPath = path.join(process.cwd(), 'output', 'videos', `clip_${Date.now()}.mp4`);
  const videoUrl = typeof output === 'string' ? output : (output as Record<string, string>).url;

  if (videoUrl) {
    const response = await fetch(videoUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(outputPath, buffer);
  }

  return outputPath;
}

export async function addBrandOverlay(params: {
  imagePath: string;
  text?: string;
  logoPath?: string;
}): Promise<string> {
  const outputPath = params.imagePath.replace('.png', '_branded.png');

  let pipeline = sharp(params.imagePath);

  // Add traide.live watermark/branding
  if (params.text) {
    const svgText = `
      <svg width="1080" height="200">
        <style>
          .brand { fill: white; font-size: 48px; font-family: Arial, sans-serif; font-weight: bold; }
          .url { fill: #00D4FF; font-size: 36px; font-family: Arial, sans-serif; }
        </style>
        <text x="540" y="80" text-anchor="middle" class="brand">${params.text}</text>
        <text x="540" y="140" text-anchor="middle" class="url">traide.live</text>
      </svg>`;

    pipeline = pipeline.composite([{
      input: Buffer.from(svgText),
      gravity: 'south',
    }]);
  }

  await pipeline.toFile(outputPath);
  return outputPath;
}

export function getSpecsForPlatform(platform: Platform) {
  return PLATFORM_SPECS[platform] || PLATFORM_SPECS.youtube;
}
