// ── Caption Burning Service ──
// Burns styled captions onto videos using Submagic API
// Fallback: ffmpeg + whisper-based captioning (see TODO below)

import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';

const SUBMAGIC_BASE_URL = 'https://api.submagic.co/v1';

type CaptionStyle = 'viral' | 'clean' | 'bold';

function getApiKey(): string {
  const key = process.env.SUBMAGIC_API_KEY;
  if (!key) throw new Error('SUBMAGIC_API_KEY is not set in environment');
  return key;
}

export interface BurnCaptionsParams {
  /** Absolute path to the source video file */
  videoPath: string;
  /** Caption visual style */
  style?: CaptionStyle;
}

/**
 * Burns stylised captions onto a video.
 *
 * Primary path: Submagic API
 *   1. Upload the video
 *   2. Request captioned render with the chosen style
 *   3. Poll until done, download the result
 *
 * Returns the absolute path to the captioned video.
 */
export async function burnCaptions(params: BurnCaptionsParams): Promise<string> {
  const { videoPath, style = 'viral' } = params;
  const apiKey = getApiKey();

  const headers = {
    Authorization: `Bearer ${apiKey}`,
  };

  // Verify source video exists
  await fs.access(videoPath);

  const outputDir = path.dirname(videoPath);
  const ext = path.extname(videoPath);
  const baseName = path.basename(videoPath, ext);
  const outputPath = path.join(outputDir, `${baseName}_captioned${ext}`);

  // Step 1 — Upload the video to Submagic
  console.log('[captions] Uploading video to Submagic...');
  const fileBuffer = await fs.readFile(videoPath);

  const uploadResponse = await axios.post<{ data: { id: string } }>(
    `${SUBMAGIC_BASE_URL}/videos/upload`,
    fileBuffer,
    {
      headers: {
        ...headers,
        'Content-Type': 'video/mp4',
      },
    },
  );

  const videoId = uploadResponse.data.data.id;
  console.log(`[captions] Uploaded: ${videoId}`);

  // Step 2 — Request captioned render
  const styleConfig: Record<CaptionStyle, Record<string, unknown>> = {
    viral: {
      font: 'Montserrat',
      font_size: 48,
      font_weight: 'black',
      color: '#FFFFFF',
      stroke_color: '#000000',
      stroke_width: 4,
      position: 'center',
      animation: 'pop',
    },
    clean: {
      font: 'Inter',
      font_size: 36,
      font_weight: 'medium',
      color: '#FFFFFF',
      stroke_color: '#00000088',
      stroke_width: 2,
      position: 'bottom',
      animation: 'fade',
    },
    bold: {
      font: 'Impact',
      font_size: 56,
      font_weight: 'bold',
      color: '#FFD700',
      stroke_color: '#000000',
      stroke_width: 6,
      position: 'center',
      animation: 'scale',
    },
  };

  console.log(`[captions] Requesting captioned render (style=${style})...`);
  const renderResponse = await axios.post<{ data: { render_id: string } }>(
    `${SUBMAGIC_BASE_URL}/videos/${videoId}/caption`,
    {
      style: styleConfig[style],
      language: 'en',
    },
    { headers: { ...headers, 'Content-Type': 'application/json' } },
  );

  const renderId = renderResponse.data.data.render_id;

  // Step 3 — Poll for completion
  const maxAttempts = 120;
  const pollIntervalMs = 5_000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(pollIntervalMs);

    const statusResponse = await axios.get<{
      data: { status: string; download_url?: string };
    }>(`${SUBMAGIC_BASE_URL}/renders/${renderId}`, { headers });

    const { status, download_url } = statusResponse.data.data;

    if (status === 'completed' && download_url) {
      // Download the captioned video
      console.log('[captions] Downloading captioned video...');
      const videoResponse = await axios.get(download_url, {
        responseType: 'arraybuffer',
      });
      await fs.writeFile(outputPath, Buffer.from(videoResponse.data as ArrayBuffer));
      console.log(`[captions] Saved to ${outputPath}`);
      return outputPath;
    }

    if (status === 'failed') {
      throw new Error(`Submagic caption render failed for renderId=${renderId}`);
    }

    console.log(`[captions] Polling... status=${status} (attempt ${attempt + 1}/${maxAttempts})`);
  }

  throw new Error(`Submagic caption render timed out for renderId=${renderId}`);

  // TODO: ffmpeg + whisper fallback
  // If Submagic is unavailable or too expensive, implement local captioning:
  //
  // 1. Extract audio from video:
  //    ffmpeg -i <videoPath> -vn -acodec pcm_s16le -ar 16000 -ac 1 audio.wav
  //
  // 2. Run whisper (openai/whisper or whisper.cpp) to generate SRT:
  //    whisper audio.wav --model small --output_format srt
  //
  // 3. Burn SRT onto video with ffmpeg:
  //    ffmpeg -i <videoPath> -vf "subtitles=audio.srt:force_style='FontName=Montserrat,FontSize=24,PrimaryColour=&Hffffff&,OutlineColour=&H000000&,Outline=2,Alignment=10'" output.mp4
  //
  // This avoids external API costs but requires whisper + ffmpeg installed locally.
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
