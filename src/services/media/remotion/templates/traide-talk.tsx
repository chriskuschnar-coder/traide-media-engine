// ── TraideTalk Template ──
// Market commentary / educational video series for traide.live

import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Img,
  AbsoluteFill,
} from 'remotion';

export interface TraideTalkProps {
  title: string;
  hook: string;
  marketData: string;
  chartImageUrl?: string;
  avatarVideoUrl?: string;
}

const BRAND_DARK = '#0a0a0f';
const BRAND_CYAN = '#00D4FF';
const BRAND_WHITE = '#f0f0f5';
const BRAND_MUTED = '#8a8a9a';

export const TraideTalk: React.FC<TraideTalkProps> = ({
  title,
  hook,
  marketData,
  chartImageUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Animations ──

  // Hook text: fade in + slide up (frames 0–30)
  const hookOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const hookTranslateY = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });
  const hookSlide = interpolate(hookTranslateY, [0, 1], [60, 0]);

  // Title: fade in after hook (frames 20–50)
  const titleOpacity = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleSlide = interpolate(frame, [20, 50], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Market data area: fade in (frames 40–70)
  const dataOpacity = interpolate(frame, [40, 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Chart: scale in (frames 50–80)
  const chartScale = spring({
    frame: Math.max(0, frame - 50),
    fps,
    config: { damping: 12, stiffness: 60 },
  });

  // Branding: fade in last (frames 60–90)
  const brandOpacity = interpolate(frame, [60, 90], [0, 1], {
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
      {/* ── Top Section: Hook Text ── */}
      <Sequence from={0}>
        <div
          style={{
            position: 'absolute',
            top: 120,
            left: 60,
            right: 60,
            opacity: hookOpacity,
            transform: `translateY(${hookSlide}px)`,
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: BRAND_CYAN,
              textTransform: 'uppercase',
              letterSpacing: 3,
              marginBottom: 20,
              opacity: titleOpacity,
              transform: `translateY(${titleSlide}px)`,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: BRAND_WHITE,
              lineHeight: 1.2,
              textWrap: 'balance',
            }}
          >
            {hook}
          </div>
        </div>
      </Sequence>

      {/* ── Middle Section: Chart / Market Data ── */}
      <Sequence from={40}>
        <div
          style={{
            position: 'absolute',
            top: 520,
            left: 60,
            right: 60,
            bottom: 400,
            opacity: dataOpacity,
            display: 'flex',
            flexDirection: 'column',
            gap: 30,
          }}
        >
          {/* Chart image area */}
          {chartImageUrl && (
            <div
              style={{
                flex: 1,
                borderRadius: 16,
                overflow: 'hidden',
                border: `1px solid ${BRAND_CYAN}33`,
                transform: `scale(${chartScale})`,
              }}
            >
              <Img
                src={chartImageUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          )}

          {/* Market data text */}
          <div
            style={{
              backgroundColor: '#12121a',
              borderRadius: 16,
              padding: 40,
              border: `1px solid ${BRAND_CYAN}22`,
            }}
          >
            <div
              style={{
                fontSize: 22,
                color: BRAND_MUTED,
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: 2,
              }}
            >
              Market Data
            </div>
            <div
              style={{
                fontSize: 40,
                fontWeight: 700,
                color: BRAND_WHITE,
              }}
            >
              {marketData}
            </div>
          </div>
        </div>
      </Sequence>

      {/* ── Bottom Section: Branding & Disclaimer ── */}
      <Sequence from={60}>
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
          <div
            style={{
              fontSize: 16,
              color: BRAND_MUTED,
              textAlign: 'center',
            }}
          >
            Not financial advice
          </div>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
