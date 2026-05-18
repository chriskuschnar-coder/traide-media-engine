// ── Root Remotion Composition ──
// Registers all video templates for the traide.live media engine

import React from 'react';
import { Composition } from 'remotion';
import { TraideTalk, type TraideTalkProps } from './templates/traide-talk.js';
import { WinOfTheDay, type WinOfTheDayProps } from './templates/win-of-day.js';
import { TraderTip, type TraderTipProps } from './templates/trader-tip.js';
import { MistakeMonday, type MistakeMondayProps } from './templates/mistake-monday.js';

// Shared dimensions for all vertical (portrait) video templates
const VERTICAL_WIDTH = 1080;
const VERTICAL_HEIGHT = 1920;
const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* TraideTalk — 45 seconds, market commentary / educational */}
      <Composition<TraideTalkProps>
        id="TraideTalk"
        component={TraideTalk}
        durationInFrames={1350}
        fps={FPS}
        width={VERTICAL_WIDTH}
        height={VERTICAL_HEIGHT}
        defaultProps={{
          title: 'Market Update',
          hook: 'Here is what you missed today...',
          marketData: 'EUR/USD up 0.45%',
        }}
      />

      {/* WinOfTheDay — 30 seconds, trade recap celebration */}
      <Composition<WinOfTheDayProps>
        id="WinOfTheDay"
        component={WinOfTheDay}
        durationInFrames={900}
        fps={FPS}
        width={VERTICAL_WIDTH}
        height={VERTICAL_HEIGHT}
        defaultProps={{
          pair: 'EUR/USD',
          direction: 'Long',
          entryPrice: '1.0850',
          exitPrice: '1.0920',
          pips: '+70',
          winPercentage: '78',
        }}
      />

      {/* TraderTip — 20 seconds, quick actionable tips */}
      <Composition<TraderTipProps>
        id="TraderTip"
        component={TraderTip}
        durationInFrames={600}
        fps={FPS}
        width={VERTICAL_WIDTH}
        height={VERTICAL_HEIGHT}
        defaultProps={{
          tipNumber: 1,
          tip: 'Always set your stop loss before entering a trade.',
          explanation: 'Risk management is the foundation of consistent profitability.',
        }}
      />

      {/* MistakeMonday — 45 seconds, common trading mistakes */}
      <Composition<MistakeMondayProps>
        id="MistakeMonday"
        component={MistakeMonday}
        durationInFrames={1350}
        fps={FPS}
        width={VERTICAL_WIDTH}
        height={VERTICAL_HEIGHT}
        defaultProps={{
          mistakeTitle: 'Revenge Trading',
          description: 'Entering impulsive trades after a loss to try to recover quickly.',
          correction: 'Step away, review your journal, and only trade your next setup.',
        }}
      />

      {/* BehindTheAI — 60 seconds, behind-the-scenes of the AI system */}
      {/* Uses TraideTalk layout with extended duration */}
      <Composition<TraideTalkProps>
        id="BehindTheAI"
        component={TraideTalk}
        durationInFrames={1800}
        fps={FPS}
        width={VERTICAL_WIDTH}
        height={VERTICAL_HEIGHT}
        defaultProps={{
          title: 'Behind the AI',
          hook: 'How our AI spotted this trade...',
          marketData: 'Model confidence: 94%',
        }}
      />
    </>
  );
};
