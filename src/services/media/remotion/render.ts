// ── Remotion Rendering Service ──
// Handles bundling and rendering video templates to MP4

import path from 'path';
import fs from 'fs/promises';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

const COMPOSITION_ENTRY = path.resolve(
  import.meta.dirname,
  'composition.tsx',
);

export interface RenderVideoParams {
  /** Composition ID: TraideTalk | WinOfTheDay | TraderTip | MistakeMonday | BehindTheAI */
  template: string;
  /** Props to pass into the Remotion composition */
  props: Record<string, unknown>;
  /** Absolute path for the rendered MP4 output */
  outputPath: string;
}

/**
 * Bundles the Remotion project and renders a composition to MP4.
 *
 * Full pipeline:
 * 1. Bundle the composition entry point via webpack
 * 2. Select the target composition by ID
 * 3. Render to MP4 using the Remotion renderer
 */
export async function renderVideo(params: RenderVideoParams): Promise<string> {
  const { template, props, outputPath } = params;

  // Ensure the output directory exists
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });

  // Step 1 — Bundle the Remotion project
  console.log(`[render] Bundling composition entry...`);
  const bundleLocation = await bundle({
    entryPoint: COMPOSITION_ENTRY,
    // Webpack override can be added here for custom aliases / loaders
  });

  // Step 2 — Select the composition matching the requested template
  console.log(`[render] Selecting composition "${template}"...`);
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: template,
    inputProps: props,
  });

  // Step 3 — Render the video to MP4
  console.log(`[render] Rendering ${composition.durationInFrames} frames at ${composition.fps}fps...`);
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps: props,
  });

  console.log(`[render] Video saved to ${outputPath}`);
  return outputPath;
}
