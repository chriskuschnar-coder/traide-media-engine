// ── Environment Setup Checker ──
// Run `npm run setup` to see what's configured and what's missing

import 'dotenv/config';

interface EnvCheck {
  name: string;
  key: string;
  phase: 'week1' | 'week2' | 'month2' | 'optional';
  status: 'ok' | 'missing';
  howToGet: string;
  cost: string;
}

const checks: EnvCheck[] = [
  // ── WEEK 1: Get the bot running ──
  { name: 'Anthropic API Key', key: 'ANTHROPIC_API_KEY', phase: 'week1', status: 'missing',
    howToGet: 'console.anthropic.com → API Keys → Create Key', cost: '~$5-20/mo usage' },
  { name: 'Telegram Bot Token', key: 'TELEGRAM_BOT_TOKEN', phase: 'week1', status: 'missing',
    howToGet: 'Telegram → @BotFather → /newbot → copy token', cost: 'FREE' },
  { name: 'Telegram Chat ID', key: 'TELEGRAM_CHAT_ID', phase: 'week1', status: 'missing',
    howToGet: 'Telegram → @userinfobot → sends your ID', cost: 'FREE' },
  { name: 'Redis', key: 'REDIS_URL', phase: 'week1', status: 'missing',
    howToGet: 'brew install redis && redis-server, OR upstash.com free tier', cost: 'FREE locally' },
  { name: 'Ayrshare API Key', key: 'AYRSHARE_API_KEY', phase: 'week1', status: 'missing',
    howToGet: 'ayrshare.com → Sign up → Premium plan → API Key', cost: '$69/mo' },
  { name: 'Enabled Platforms', key: 'ENABLED_PLATFORMS', phase: 'week1', status: 'missing',
    howToGet: 'Set to "youtube" to start. Add platforms over time.', cost: 'N/A' },

  // ── WEEK 1: Video generation ──
  { name: 'HeyGen API Key', key: 'HEYGEN_API_KEY', phase: 'week1', status: 'missing',
    howToGet: 'heygen.com → Creator plan → Settings → API', cost: '$29/mo' },
  { name: 'HeyGen Avatar ID', key: 'HEYGEN_AVATAR_ID', phase: 'week1', status: 'missing',
    howToGet: 'heygen.com → Avatars → pick one → copy ID', cost: 'included' },
  { name: 'ElevenLabs API Key', key: 'ELEVENLABS_API_KEY', phase: 'week1', status: 'missing',
    howToGet: 'elevenlabs.io → Profile → API Key', cost: 'FREE tier (10k chars/mo)' },
  { name: 'Submagic API Key', key: 'SUBMAGIC_API_KEY', phase: 'week1', status: 'missing',
    howToGet: 'submagic.co → Subscribe → API access', cost: '$16/mo' },
  { name: 'Replicate Token', key: 'REPLICATE_API_TOKEN', phase: 'week1', status: 'missing',
    howToGet: 'replicate.com → Account → API Tokens', cost: '~$0.01/image' },

  // ── WEEK 1: YouTube (native, not through Ayrshare) ──
  { name: 'YouTube Client ID', key: 'YOUTUBE_CLIENT_ID', phase: 'week1', status: 'missing',
    howToGet: 'console.cloud.google.com → New Project → YouTube Data API v3 → Credentials → OAuth Client', cost: 'FREE' },
  { name: 'YouTube Client Secret', key: 'YOUTUBE_CLIENT_SECRET', phase: 'week1', status: 'missing',
    howToGet: 'Same Google Cloud project as above', cost: 'FREE' },
  { name: 'YouTube Refresh Token', key: 'YOUTUBE_REFRESH_TOKEN', phase: 'week1', status: 'missing',
    howToGet: 'OAuth2 consent flow (one-time browser auth)', cost: 'FREE' },

  // ── MONTH 2: Analytics & storage ──
  { name: 'Supabase URL', key: 'SUPABASE_URL', phase: 'month2', status: 'missing',
    howToGet: 'supabase.com → New Project → Settings → API → URL', cost: 'FREE tier' },
  { name: 'Supabase Anon Key', key: 'SUPABASE_ANON_KEY', phase: 'month2', status: 'missing',
    howToGet: 'Same Supabase project → Settings → API → anon key', cost: 'FREE tier' },

  // ── OPTIONAL ──
  { name: 'Telegram Channel ID', key: 'TELEGRAM_CHANNEL_ID', phase: 'optional', status: 'missing',
    howToGet: 'Create a public channel, add bot as admin, forward msg to @userinfobot', cost: 'FREE' },
];

console.log('\n🔍 TRAIDE MEDIA ENGINE — Setup Check\n');

const phases = ['week1', 'week2', 'month2', 'optional'] as const;
const phaseLabels: Record<string, string> = {
  week1: '🔴 WEEK 1 — Must have to launch',
  week2: '🟡 WEEK 2 — Strategic inputs',
  month2: '🟢 MONTH 2 — Analytics layer',
  optional: '⚪ OPTIONAL',
};

let totalCost = 0;
const costMap: Record<string, number> = {
  'Ayrshare API Key': 69,
  'HeyGen API Key': 29,
  'Submagic API Key': 16,
  'Anthropic API Key': 15,
};

for (const phase of phases) {
  const phaseChecks = checks.filter(c => c.phase === phase);
  if (phaseChecks.length === 0) continue;

  console.log(`\n${phaseLabels[phase]}`);
  console.log('─'.repeat(60));

  for (const check of phaseChecks) {
    check.status = process.env[check.key] ? 'ok' : 'missing';
    const icon = check.status === 'ok' ? '✅' : '⬜';

    console.log(`${icon} ${check.name.padEnd(25)} ${check.cost.padEnd(20)} ${check.status === 'ok' ? '✓ configured' : ''}`);
    if (check.status === 'missing') {
      console.log(`   └─ ${check.howToGet}`);
    }
  }
}

const configured = checks.filter(c => c.status === 'ok').length;
const week1Missing = checks.filter(c => c.phase === 'week1' && c.status === 'missing').length;

console.log('\n' + '═'.repeat(60));
console.log(`\n✅ Configured: ${configured}/${checks.length}`);
console.log(`🔴 Week 1 missing: ${week1Missing}`);

console.log(`\n💰 Estimated monthly cost: ~$130-150/mo`);
console.log('   Ayrshare $69 + HeyGen $29 + Submagic $16 + Claude ~$15 + Replicate ~$5');

if (week1Missing > 0) {
  console.log('\n⚠️  Copy .env.example to .env and fill in Week 1 keys to launch.\n');
} else {
  console.log('\n🚀 Week 1 ready! Run `npm start` to launch the full engine.\n');
}
