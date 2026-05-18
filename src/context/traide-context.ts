// ── Traide.live Product Context ──
// This is the brain's knowledge base about the product.
// Keep this updated as the product evolves.

import type { TraideContext } from '../types/index.js';

export const TRAIDE_CONTEXT: TraideContext = {
  features: [
    'Real-time AI trading signals and analysis',
    'Advanced charting with TradingView integration',
    'ICT/Smart Money Concepts indicators (Fair Value Gaps, Order Blocks)',
    'Helios Strategy with automated signals',
    'Algorithm marketplace - browse, toggle, and deploy strategies',
    'Multi-asset: Forex, Stocks, Crypto, Options, Bonds',
    'AI chat assistant with live market data access',
    'Heikin Ashi, Area, Bars, Hollow, Baseline chart types',
    'Mobile-optimized PWA',
    'AI mentor/coaching system with personalized guidance',
  ],

  recentUpdates: [
    'Algos modal with categorized strategies sidebar',
    'Pro/ICT indicators: Fair Value Gap and Order Blocks with toggles',
    'Glassmorphic transparent UI design',
    'Chart type selector with 6 chart types',
    'Symbol search with Forex, Bonds, Options, Funds tabs',
  ],

  metrics: {
    tagline: 'AI-Powered Trading Intelligence',
    website: 'https://traide.live',
    category: 'FinTech / AI Trading Platform',
  },

  targetAudience: [
    'Retail traders (forex, crypto, stocks)',
    'Beginner traders looking for AI guidance',
    'ICT/Smart Money concept traders',
    'Algo trading enthusiasts',
    'Day traders and swing traders',
    'People tired of losing money trading without an edge',
    'Tech-savvy investors wanting AI-powered tools',
  ],

  competitors: [
    'TradingView',
    'TrendSpider',
    'Trade Ideas',
    'Tickeron',
    'Signal Stack',
  ],

  uniqueSellingPoints: [
    'AI mentor that learns YOUR trading style',
    'All-in-one: charts + signals + algos + AI coaching',
    'ICT/Smart Money indicators built-in (not just basic TA)',
    'Algorithm marketplace - one-click strategy deployment',
    'Affordable alternative to expensive signal services',
    'Real-time AI analysis, not delayed or generic',
  ],

  brandVoice: `Confident but not arrogant. We speak like a trader who's been in the trenches
and finally built the tool they always wanted. Direct, no BS, results-focused.
We use trading slang naturally. We're the friend who actually knows what they're doing
and wants to help you level up. Never salesy or pushy - the product speaks for itself.`,
};

export const CONTENT_ANGLES = [
  // Pain points
  'Tired of staring at charts for hours with no edge?',
  'Stop paying $200/month for signals that don\'t work',
  'Your broker wants you to lose. We built the AI that fights back.',
  'Most traders lose because they trade on emotion. AI doesn\'t.',

  // Feature showcases
  'Watch our AI spot a Fair Value Gap in real-time',
  'How Helios Strategy caught this 150-pip move',
  'One-click algo deployment: from browsing to live in 10 seconds',
  'The AI mentor that remembers every trade you\'ve made',

  // Social proof / FOMO
  'Traders are switching to AI-powered analysis. Are you?',
  'What if you had an AI watching every market 24/7?',
  'The trading platform Wall Street doesn\'t want you to have',

  // Educational
  'What are Fair Value Gaps and why smart money uses them',
  'ICT Order Blocks explained in 60 seconds',
  'Why 90% of traders fail (and how AI changes that)',
  'The difference between retail and institutional trading',
];
