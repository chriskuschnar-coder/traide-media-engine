// ── MistakeMonday Template ──
// Common trading mistakes with corrections for traide.live

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

export interface MistakeMondayProps {
  mistakeTitle: string;
  description: string;
  correction: string;
  chartImageUrl?: string;
}

const BRAND_DARK = '#0a0a0f';
const BRAND_RED = '#FF3D57';
const BRAND_RED_DIM = '#FF3D5722';
const BRAND_GREEN = '#00E676';
const BRAND_GREEN_DIM = '#00E67622';
const BRAND_CYAN = '#00D4FF';
const BRAND_WHITE = '#f0f0f5';
const BRAND_MUTED = '#8a8a9a';

export const MistakeMonday: React.FC<MistakeMondayProps> = ({
  mistakeTitle,
  description,
  correction,
  chartImageUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Animations ──

  // Header badge
  const badgeScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 100 },
  });

  // Mistake title
  const titleOpacity = interpolate(frame, [15, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleSlide = interpolate(frame, [15, 40], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Mistake section (red)
  const mistakeOpacity = interpolate(frame, [40, 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const mistakeSlideX = interpolate(frame, [40, 70], [-60, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Divider
  const dividerProgress = spring({
    frame: Math.max(0, frame - 70),
    fps,
    config: { damping: 20, stiffness: 60 },
  });

  // Correction section (green)
  const correctionOpacity = interpolate(frame, [80, 110], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const correctionSlideX = interpolate(frame, [80, 110], [60, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Chart
  const chartOpacity = interpolate(frame, [100, 130], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Branding
  const brandOpacity = interpolate(frame, [120, 145], [0, 1], {
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
      {/* ── Badge ── */}
      <Sequence from={0}>
        <div
          style={{
            position: 'absolute',
            top: 140,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            transform: `scale(${badgeScale})`,
          }}
        >
          <div
            style={{
              backgroundColor: BRAND_RED_DIM,
              border: `2px solid ${BRAND_RED}`,
              borderRadius: 60,
              padding: '16px 48px',
              fontSize: 22,
              fontWeight: 700,
              color: BRAND_RED,
              textTransform: 'uppercase',
              letterSpacing: 4,
            }}
          >
            Mistake Monday
          </div>
        </div>
      </Sequence>

      {/* ── Mistake Title ── */}
      <Sequence from={15}>
        <div
          style={{
            position: 'absolute',
            top: 280,
            left: 60,
            right: 60,
            textAlign: 'center',
            opacity: titleOpacity,
            transform: `translateY(${titleSlide}px)`,
          }}
        >
          <div
            style={{
              fontSize: 58,
              fontWeight: 900,
              color: BRAND_WHITE,
              lineHeight: 1.2,
              textWrap: 'balance',
            }}
          >
            {mistakeTitle}
          </div>
        </div>
      </Sequence>

      {/* ── Split Screen: Mistake (Red) ── */}
      <Sequence from={40}>
        <div
          style={{
            position: 'absolute',
            top: 480,
            left: 60,
            right: 60,
            opacity: mistakeOpacity,
            transform: `translateX(${mistakeSlideX}px)`,
          }}
        >
          <div
            style={{
              backgroundColor: BRAND_RED_DIM,
              borderRadius: 20,
              padding: 40,
              borderLeft: `4px solid ${BRAND_RED}`,
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: BRAND_RED,
                textTransform: 'uppercase',
                letterSpacing: 3,
                marginBottom: 16,
              }}
            >
              The Mistake
            </div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 500,
                color: BRAND_WHITE,
                lineHeight: 1.5,
              }}
            >
              {description}
            </div>
          </div>
        </div>
      </Sequence>

      {/* ── Divider ── */}
      <Sequence from={70}>
        <div
          style={{
            position: 'absolute',
            top: 770,
            left: 60,
            right: 60,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: `${dividerProgress * 100}%`,
              height: 2,
              background: `linear-gradient(90deg, ${BRAND_RED}, ${BRAND_GREEN})`,
              opacity: 0.5,
            }}
          />
        </div>
      </Sequence>

      {/* ── Split Screen: Correction (Green) ── */}
      <Sequence from={80}>
        <div
          style={{
            position: 'absolute',
            top: 800,
            left: 60,
            right: 60,
            opacity: correctionOpacity,
            transform: `translateX(${correctionSlideX}px)`,
          }}
        >
          <div
            style={{
              backgroundColor: BRAND_GREEN_DIM,
              borderRadius: 20,
              padding: 40,
              borderLeft: `4px solid ${BRAND_GREEN}`,
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: BRAND_GREEN,
                textTransform: 'uppercase',
                letterSpacing: 3,
                marginBottom: 16,
              }}
            >
              The Fix
            </div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 500,
                color: BRAND_WHITE,
                lineHeight: 1.5,
              }}
            >
              {correction}
            </div>
          </div>
        </div>
      </Sequence>

      {/* ── Chart (optional) ── */}
      {chartImageUrl && (
        <Sequence from={100}>
          <div
            style={{
              position: 'absolute',
              top: 1100,
              left: 60,
              right: 60,
              height: 400,
              borderRadius: 16,
              overflow: 'hidden',
              opacity: chartOpacity,
              border: `1px solid #ffffff11`,
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
        </Sequence>
      )}

      {/* ── Bottom Branding ── */}
      <Sequence from={120}>
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
