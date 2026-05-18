// ── Content Series Definitions ──
// The 6 recurring content series for traide.live social channels.
// Each series has its own cadence, style, and hook library.

import type { Platform, ContentStyle } from '../types/index.js';

// ── Types ──

export interface Series {
  name: string;
  slug: string;
  description: string;
  cadence: string;              // cron expression
  cadenceHuman: string;         // human-readable schedule
  durationSeconds: number;
  platforms: Platform[];
  hookLibrary: string[];
  sampleScripts: string[];
  approvalRequired: boolean;
  style: ContentStyle;
}

// ── Series Definitions ──

export const SERIES: Record<string, Series> = {
  traideTalk: {
    name: 'TraideTalk',
    slug: 'traide-talk',
    description:
      'Daily market open take — what the AI is watching, key levels, and the setup of the day. Quick, confident, gets traders locked in before the bell.',
    cadence: '30 9 * * 1-5',     // 9:30 AM EST, weekdays
    cadenceHuman: 'Daily at 9:30 AM EST (weekdays)',
    durationSeconds: 45,
    platforms: ['youtube'],
    hookLibrary: [
      'Markets are gapping up and the AI already spotted the trap.',
      'Three tickers on the AI radar this morning — and one is about to move.',
      'The overnight session just printed a textbook Fair Value Gap.',
      'Everyone is bullish today. Here\'s what the AI sees that they don\'t.',
      'Pre-market just flipped — here\'s the only level that matters.',
    ],
    sampleScripts: [
      `[Hook] Markets are gapping up and the AI already spotted the trap.
[Body] ES futures showing strength but the order block at 4520 hasn't been mitigated. The AI flagged this as a liquidity sweep zone overnight. If we tap that level and reject, I'm looking short into the gap fill. Traide's Helios Strategy already has the alert set.
[CTA] Link in bio to see the live setup on traide.live.`,
      `[Hook] Pre-market just flipped — here's the only level that matters.
[Body] We were bullish overnight but the London session swept the highs and left a bearish FVG on the 15-minute. The AI caught it at 3 AM so you didn't have to. Key level: 4485. Hold above, we ride. Break below, it's sell city.
[CTA] The AI is tracking this in real time — check traide.live.`,
    ],
    approvalRequired: false,
    style: {
      tone: 'professional',
      visual: 'dark_trading',
      music: 'ambient',
      duration: 45,
    },
  },

  winsOfTheDay: {
    name: 'WinsOfTheDay',
    slug: 'wins-of-the-day',
    description:
      'Anonymized winning trades from the AI — showcasing real setups the algorithms caught. Builds credibility without making promises.',
    cadence: '0 17 * * 1-5',     // 5:00 PM EST, weekdays
    cadenceHuman: 'Daily at 5:00 PM EST (weekdays)',
    durationSeconds: 30,
    platforms: ['youtube'],
    hookLibrary: [
      'The AI caught a 3R winner while you were in a meeting.',
      'This setup printed at 10:47 AM — the algorithm was already in.',
      'One of today\'s algos just closed green. Here\'s the breakdown.',
      'Fair Value Gap + Order Block confluence — the AI doesn\'t miss these.',
      'Three wins today, all from the same strategy. Here\'s what it saw.',
    ],
    sampleScripts: [
      `[Hook] The AI caught a 3R winner while you were in a meeting.
[Body] At 10:47 AM, EUR/USD printed a bullish order block on the 5-minute with FVG confluence. The Helios algo entered long at 1.0845, stop at 1.0832, target at 1.0884. That's a clean 3R. No emotion, just execution.
[CTA] Browse the algo that caught this at traide.live.`,
      `[Hook] Three wins today, all from the same strategy. Here's what it saw.
[Body] The mean reversion algo fired on SPY, QQQ, and AAPL today. All three hit a standard deviation band, confirmed with volume divergence, and reversed. Combined: +4.2R on the day. The algo runs 24/7 so you don't have to watch every candle.
[CTA] Deploy this algo yourself at traide.live.`,
    ],
    approvalRequired: false,
    style: {
      tone: 'hype',
      visual: 'data_heavy',
      music: 'energetic',
      duration: 30,
    },
  },

  traderTips: {
    name: 'TraderTips',
    slug: 'trader-tips',
    description:
      'One trading principle per video — quick, digestible education. Positions traide as a trusted learning resource.',
    cadence: '0 12 * * 1,3,5',   // Noon EST, Mon/Wed/Fri
    cadenceHuman: '3x/week (Mon, Wed, Fri) at 12:00 PM EST',
    durationSeconds: 20,
    platforms: ['youtube'],
    hookLibrary: [
      'The #1 reason traders blow accounts — and it\'s not what you think.',
      'Stop loss tip that saved me $10K last year.',
      'The 2% rule: boring, but it keeps you alive.',
      'Why your win rate doesn\'t matter as much as this.',
      'One journal habit that separates pros from amateurs.',
    ],
    sampleScripts: [
      `[Hook] The #1 reason traders blow accounts — and it's not what you think.
[Body] It's not bad entries. It's position sizing. If you're risking more than 2% per trade, one bad streak wipes you out. The math is brutal. The AI on traide.live auto-calculates position size for every signal so you never have to guess.
[CTA] Let the AI handle your risk — traide.live.`,
      `[Hook] Why your win rate doesn't matter as much as this.
[Body] You can win 40% of the time and still be profitable — if your average win is 2x your average loss. That's R-multiple. Focus on R, not win rate. Traide's dashboard tracks your R-multiple across every strategy in real time.
[CTA] See your real edge at traide.live.`,
    ],
    approvalRequired: false,
    style: {
      tone: 'educational',
      visual: 'clean_minimal',
      music: 'ambient',
      duration: 20,
    },
  },

  mistakeMonday: {
    name: 'MistakeMonday',
    slug: 'mistake-monday',
    description:
      'Common trading errors with real chart breakdowns — what went wrong and how to avoid it. Authentic, relatable, educational.',
    cadence: '0 10 * * 1',       // 10:00 AM EST, Mondays
    cadenceHuman: 'Weekly on Monday at 10:00 AM EST',
    durationSeconds: 45,
    platforms: ['youtube'],
    hookLibrary: [
      'I revenge traded on Friday and the chart punished me. Here\'s the tape.',
      'This is what FOMO looks like on a chart — don\'t be this trader.',
      'Moving your stop loss "just a little" — a horror story.',
      'Trading the news without a plan? Here\'s what happens.',
      'The worst trade of the week — and the lesson it teaches.',
    ],
    sampleScripts: [
      `[Hook] Moving your stop loss "just a little" — a horror story.
[Body] Classic mistake. You enter short on GBP/USD at resistance. Price moves against you. Instead of taking the L, you widen the stop. Then again. What was a 1R loss becomes a 4R disaster. The chart doesn't care about your feelings. Traide's AI enforces your plan — once the stop is set, it's set.
[CTA] Trade with discipline at traide.live.`,
      `[Hook] This is what FOMO looks like on a chart — don't be this trader.
[Body] Bitcoin pumps 5% overnight. You wake up, see green candles, and buy at the top. Within an hour it retraces the entire move. FOMO entry, no setup, no edge. The AI on traide only alerts you when there's a real setup — not just momentum.
[CTA] Stop chasing candles — traide.live.`,
    ],
    approvalRequired: true,
    style: {
      tone: 'casual',
      visual: 'dark_trading',
      music: 'dramatic',
      duration: 45,
    },
  },

  behindTheAI: {
    name: 'BehindTheAI',
    slug: 'behind-the-ai',
    description:
      'How a specific feature works under the hood — demystifies the AI and builds trust. Shows traide is the real deal, not a black box.',
    cadence: '0 14 * * 2,4',     // 2:00 PM EST, Tue/Thu
    cadenceHuman: '2x/week (Tue, Thu) at 2:00 PM EST',
    durationSeconds: 60,
    platforms: ['youtube'],
    hookLibrary: [
      'How our AI reads a Fair Value Gap — step by step.',
      'The model behind Helios Strategy — explained in 60 seconds.',
      'How the AI mentor learns YOUR trading style.',
      'Order block detection: here\'s exactly what the algorithm looks for.',
      'Why our AI uses multiple timeframes — and why yours should too.',
    ],
    sampleScripts: [
      `[Hook] How our AI reads a Fair Value Gap — step by step.
[Body] A Fair Value Gap is a three-candle pattern where the wicks of candle 1 and candle 3 don't overlap. That gap represents an imbalance — institutional money moved fast and left inefficiency behind. Our AI scans every timeframe on every asset for these in real time. When one forms near a key level, you get an alert.
[CTA] See FVGs highlighted live at traide.live.`,
      `[Hook] How the AI mentor learns YOUR trading style.
[Body] Every trade you make on traide feeds into your personal profile. The AI tracks your win rate by session, by asset, by setup type. Over time it learns your edge — and your leaks. It'll tell you "you perform best during London session on EUR/USD using FVG setups" or "stop trading NFP, your win rate drops 30%."
[CTA] Get your personal AI mentor at traide.live.`,
    ],
    approvalRequired: false,
    style: {
      tone: 'educational',
      visual: 'neon_tech',
      music: 'ambient',
      duration: 60,
    },
  },

  setupWatch: {
    name: 'SetupWatch',
    slug: 'setup-watch',
    description:
      'Call a setup live, then post the outcome. Maximum credibility — put the AI\'s analysis on the record and show the result.',
    cadence: '0 9 * * 2,5',      // 9:00 AM EST, Tue/Fri
    cadenceHuman: '2x/week (Tue, Fri) at 9:00 AM EST',
    durationSeconds: 30,
    platforms: ['youtube'],
    hookLibrary: [
      'The AI just flagged this setup — let\'s see if it plays out.',
      'Calling it now: this level breaks today. Here\'s why.',
      'Setup watch: EUR/USD sitting on a 4H order block. AI says long.',
      'The algorithm is bearish on this ticker — posting receipts.',
      'Live setup: FVG + OB confluence on SPY. Let\'s track it.',
    ],
    sampleScripts: [
      `[Hook] The AI just flagged this setup — let's see if it plays out.
[Body] EUR/USD 1H chart. We've got a bearish FVG from yesterday's London session that hasn't been filled. Price is pushing up into it right now. The AI says short if we get a rejection candle inside the gap. Stop above the gap, target at the swing low. I'll post the result tonight.
[CTA] Follow for the outcome — and see the setup live at traide.live.`,
      `[Hook] Calling it now: this level breaks today. Here's why.
[Body] SPY has tested 452.50 three times this week. Each time, lower highs into the level. The AI's volume analysis shows sellers are getting exhausted. Helios Strategy flipped bullish overnight. If we break above 452.50 with volume, target is 455. Posting this at 9 AM — let's see where we close.
[CTA] The AI called it first — traide.live.`,
    ],
    approvalRequired: true,
    style: {
      tone: 'urgency',
      visual: 'data_heavy',
      music: 'dramatic',
      duration: 30,
    },
  },
};

// ── Helpers ──

export function getSeriesBySlug(slug: string): Series | undefined {
  return Object.values(SERIES).find((s) => s.slug === slug);
}

export function getSeriesRequiringApproval(): Series[] {
  return Object.values(SERIES).filter((s) => s.approvalRequired);
}

export function getAllSeries(): Series[] {
  return Object.values(SERIES);
}

export function getRandomHook(series: Series): string {
  return series.hookLibrary[Math.floor(Math.random() * series.hookLibrary.length)];
}
