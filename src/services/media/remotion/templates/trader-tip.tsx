// ── TraderTip Template ──
// Clean, minimal trading tips for traide.live

import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  AbsoluteFill,
} from 'remotion';

export interface TraderTipProps {
  tipNumber: number;
  tip: string;
  explanation: string;
}

const BRAND_DARK = '#0a0a0f';
const BRAND_CYAN = '#00D4FF';
const BRAND_CYAN_DIM = '#00D4FF22';
const BRAND_WHITE = '#f0f0f5';
const BRAND_MUTED = '#8a8a9a';

export const TraderTip: React.FC<TraderTipProps> = ({
  tipNumber,
  tip,
  explanation,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Animations ──

  // Tip number badge: scale pop
  const numberScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 120 },
  });

  // "Trader Tip" label
  const labelOpacity = interpolate(frame, [8, 25], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Horizontal rule: width reveal
  const ruleWidth = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 20, stiffness: 60 },
  });

  // Tip text: fade + slide up
  const tipOpacity = interpolate(frame, [25, 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const tipSlide = interpolate(frame, [25, 55], [50, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Explanation: fade in after tip
  const explainOpacity = interpolate(frame, [55, 85], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const explainSlide = interpolate(frame, [55, 85], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Branding
  const brandOpacity = interpolate(frame, [80, 100], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND_DARK,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* ── Central Content ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 80px',
        }}
      >
        {/* Tip number circle */}
        <Sequence from={0}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              marginBottom: 40,
              transform: `scale(${numberScale})`,
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: BRAND_CYAN_DIM,
                border: `2px solid ${BRAND_CYAN}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 36,
                fontWeight: 800,
                color: BRAND_CYAN,
              }}
            >
              {tipNumber}
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: BRAND_CYAN,
                textTransform: 'uppercase',
                letterSpacing: 6,
                opacity: labelOpacity,
              }}
            >
              Trader Tip
            </div>
          </div>
        </Sequence>

        {/* Horizontal rule */}
        <Sequence from={15}>
          <div
            style={{
              height: 2,
              backgroundColor: BRAND_CYAN,
              width: `${ruleWidth * 100}%`,
              marginBottom: 60,
              opacity: 0.4,
            }}
          />
        </Sequence>

        {/* Main tip text */}
        <Sequence from={25}>
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: BRAND_WHITE,
              lineHeight: 1.25,
              marginBottom: 48,
              opacity: tipOpacity,
              transform: `translateY(${tipSlide}px)`,
              textWrap: 'balance',
            }}
          >
            {tip}
          </div>
        </Sequence>

        {/* Explanation */}
        <Sequence from={55}>
          <div
            style={{
              fontSize: 30,
              fontWeight: 400,
              color: BRAND_MUTED,
              lineHeight: 1.5,
              opacity: explainOpacity,
              transform: `translateY(${explainSlide}px)`,
              textWrap: 'balance',
            }}
          >
            {explanation}
          </div>
        </Sequence>
      </div>

      {/* ── Bottom Branding ── */}
      <Sequence from={80}>
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
