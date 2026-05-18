// ── Environment Setup Checker ──
// Run this to see what's configured and what's missing

import 'dotenv/config';

interface EnvCheck {
  name: string;
  key: string;
  required: boolean;
  status: 'ok' | 'missing';
  note?: string;
}

const checks: EnvCheck[] = [
  // Core AI
  { name: 'Claude API', key: 'ANTHROPIC_API_KEY', required: true, status: 'missing', note: 'Content brain - generates all scripts, captions, plans' },
  { name: 'Replicate', key: 'REPLICATE_API_TOKEN', required: true, status: 'missing', note: 'Image & video generation (Flux, video models)' },
  { name: 'ElevenLabs', key: 'ELEVENLABS_API_KEY', required: false, status: 'missing', note: 'AI voiceovers for videos' },
  { name: 'OpenAI', key: 'OPENAI_API_KEY', required: false, status: 'missing', note: 'Backup TTS / DALL-E' },

  // Telegram
  { name: 'Telegram Bot', key: 'TELEGRAM_BOT_TOKEN', required: true, status: 'missing', note: 'Your command center bot' },
  { name: 'Telegram Chat ID', key: 'TELEGRAM_CHAT_ID', required: true, status: 'missing', note: 'Your personal chat ID for auth' },
  { name: 'Telegram Channel', key: 'TELEGRAM_CHANNEL_ID', required: false, status: 'missing', note: 'Public channel for posting' },

  // YouTube
  { name: 'YouTube Client ID', key: 'YOUTUBE_CLIENT_ID', required: false, status: 'missing', note: 'Google Cloud Console → YouTube Data API v3' },
  { name: 'YouTube Client Secret', key: 'YOUTUBE_CLIENT_SECRET', required: false, status: 'missing', note: 'Same Google Cloud project' },
  { name: 'YouTube Refresh Token', key: 'YOUTUBE_REFRESH_TOKEN', required: false, status: 'missing', note: 'OAuth2 flow needed' },

  // X / Twitter
  { name: 'X API Key', key: 'X_API_KEY', required: false, status: 'missing', note: 'developer.x.com → Free or Basic tier' },
  { name: 'X API Secret', key: 'X_API_SECRET', required: false, status: 'missing' },
  { name: 'X Access Token', key: 'X_ACCESS_TOKEN', required: false, status: 'missing' },
  { name: 'X Access Secret', key: 'X_ACCESS_SECRET', required: false, status: 'missing' },

  // Instagram
  { name: 'Instagram Token', key: 'INSTAGRAM_ACCESS_TOKEN', required: false, status: 'missing', note: 'Meta Business Suite → Graph API' },
  { name: 'Instagram Account ID', key: 'INSTAGRAM_BUSINESS_ACCOUNT_ID', required: false, status: 'missing', note: 'Must be a Business/Creator account' },

  // Facebook
  { name: 'Facebook Page Token', key: 'FACEBOOK_PAGE_ACCESS_TOKEN', required: false, status: 'missing', note: 'Meta Business Suite' },
  { name: 'Facebook Page ID', key: 'FACEBOOK_PAGE_ID', required: false, status: 'missing' },

  // TikTok
  { name: 'TikTok Token', key: 'TIKTOK_ACCESS_TOKEN', required: false, status: 'missing', note: 'developers.tiktok.com → Content Posting API' },
  { name: 'TikTok Open ID', key: 'TIKTOK_OPEN_ID', required: false, status: 'missing' },

  // Infrastructure
  { name: 'Redis', key: 'REDIS_URL', required: true, status: 'missing', note: 'Job queue backend' },
];

console.log('\n🔍 TRAIDE MEDIA ENGINE — Environment Check\n');
console.log('='.repeat(60));

let requiredMissing = 0;
let optionalMissing = 0;

for (const check of checks) {
  check.status = process.env[check.key] ? 'ok' : 'missing';
  const icon = check.status === 'ok' ? '✅' : (check.required ? '❌' : '⚪');

  if (check.status === 'missing') {
    if (check.required) requiredMissing++;
    else optionalMissing++;
  }

  console.log(`${icon} ${check.name.padEnd(25)} ${check.status === 'ok' ? 'configured' : 'MISSING'}`);
  if (check.note && check.status === 'missing') {
    console.log(`   └─ ${check.note}`);
  }
}

console.log('\n' + '='.repeat(60));
console.log(`\n✅ Configured: ${checks.filter(c => c.status === 'ok').length}`);
console.log(`❌ Required missing: ${requiredMissing}`);
console.log(`⚪ Optional missing: ${optionalMissing}`);

if (requiredMissing > 0) {
  console.log('\n⚠️  Copy .env.example to .env and fill in required keys to get started.\n');
} else {
  console.log('\n🚀 All required services configured! Run `npm run bot` to start.\n');
}
