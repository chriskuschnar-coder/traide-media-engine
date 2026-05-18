// ── WinOfTheDay Template ──
// Celebratory trade recap video for traide.live

import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  AbsoluteFill,
} from 'remotion';

export interface WinOfTheDayProps {
  pair: string;
  direction: string;
  entryPrice: string;
  exitPrice: string;
  pips: string;
  winPercentage: string;
}

const BRAND_DARK = '#0a0a0f';
const BRAND_GREEN = '#00E676';
const BRAND_GREEN_DIM = '#00E67633';
const BRAND_CYAN = '#00D4FF';
const BRAND_WHITE = '#f0f0f5';
const BRAND_MUTED = '#8a8a9a';

const StatRow: React.FC<{
  label: string;
  value: string;
  frame: number;
  delay: number;
  fps: number;
  accent?: boolean;
}> = ({ label, value, frame, delay, fps, accent }) => {
  const progress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 14, stiffness: 70 },
  });
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateX = interpolate(progress, [0, 1], [80, 0]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '28px 0',
        borderBottom: `1px solid #ffffff0d`,
        opacity,
        transform: `translateX(${translateX}px)`,
      }}
    >
      <span style={{ fontSize: 28, color: BRAND_MUTED, fontWeight: 500 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: accent ? BRAND_GREEN : BRAND_WHITE,
        }}
      >
        {value}
      </span>
    </div>
  );
};

export const WinOfTheDay: React.FC<WinOfTheDayProps> = ({
  pair,
  direction,
  entryPrice,
  exitPrice,
  pips,
  winPercentage,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Animations ──

  // Header badge: scale in
  const badgeScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 100 },
  });

  // Pair name: fade + slide
  const pairOpacity = interpolate(frame, [10, 35], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pairSlide = interpolate(frame, [10, 35], [50, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Pips highlight: pop in late
  const pipsScale = spring({
    frame: Math.max(0, frame - 90),
    fps,
    config: { damping: 8, stiffness: 120 },
  });

  // Branding
  const brandOpacity = interpolate(frame, [100, 120], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND_DARK,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ── Decorative green glow ── */}
      <div
        style={{
          position: 'absolute',
          top: -200,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${BRAND_GREEN}15 0%, transparent 70%)`,
        }}
      />

      {/* ── Badge ── */}
      <Sequence from={0}>
        <div
          style={{
            position: 'absolute',
            top: 160,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            transform: `scale(${badgeScale})`,
          }}
        >
          <div
            style={{
              backgroundColor: BRAND_GREEN_DIM,
              border: `2px solid ${BRAND_GREEN}`,
              borderRadius: 60,
              padding: '16px 48px',
              fontSize: 24,
              fontWeight: 700,
              color: BRAND_GREEN,
              textTransform: 'uppercase',
              letterSpacing: 4,
            }}
          >
            Win of the Day
          </div>
        </div>
      </Sequence>

      {/* ── Pair & Direction ── */}
      <Sequence from={10}>
        <div
          style={{
            position: 'absolute',
            top: 300,
            left: 60,
            right: 60,
            textAlign: 'center',
            opacity: pairOpacity,
            transform: `translateY(${pairSlide}px)`,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: BRAND_WHITE,
              letterSpacing: 2,
            }}
          >
            {pair}
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 600,
              color: BRAND_GREEN,
              marginTop: 12,
              textTransform: 'uppercase',
              letterSpacing: 6,
            }}
          >
            {direction}
          </div>
        </div>
      </Sequence>

      {/* ── Trade Stats ── */}
      <Sequence from={30}>
        <div
          style={{
            position: 'absolute',
            top: 560,
            left: 60,
            right: 60,
            backgroundColor: '#12121a',
            borderRadius: 20,
            padding: '20px 40px',
            border: `1px solid ${BRAND_GREEN}22`,
          }}
        >
          <StatRow label="Entry" value={entryPrice} frame={frame} delay={30} fps={fps} />
          <StatRow label="Exit" value={exitPrice} frame={frame} delay={45} fps={fps} />
          <StatRow label="Pips" value={pips} frame={frame} delay={60} fps={fps} accent />
          <StatRow label="Win Rate" value={`${winPercentage}%`} frame={frame} delay={75} fps={fps} accent />
        </div>
      </Sequence>

      {/* ── Pips Highlight ── */}
      <Sequence from={90}>
        <div
          style={{
            position: 'absolute',
            top: 1100,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            transform: `scale(${pipsScale})`,
          }}
        >
          <div
            style={{
              fontSize: 120,
              fontWeight: 900,
              color: BRAND_GREEN,
              textShadow: `0 0 60px ${BRAND_GREEN}66`,
            }}
          >
            {pips}
          </div>
          <div
            style={{
              fontSize: 28,
              color: BRAND_MUTED,
              position: 'absolute',
              bottom: -30,
              textTransform: 'uppercase',
              letterSpacing: 6,
            }}
          >
            pips captured
          </div>
        </div>
      </Sequence>

      {/* ── Bottom Branding ── */}
      <Sequence from={100}>
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: 60,
            right: 60,
            opacity: brandOpacity,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: BRAND_CYAN,
              letterSpacing: 2,
            }}
          >
            traide.live
          </div>
          <div style={{ fontSize: 16, color: BRAND_MUTED }}>
            Not financial advice
          </div>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
