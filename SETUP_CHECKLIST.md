# Traide Media Engine — Complete Setup Checklist

## Monthly Cost: ~$130-150/mo
This is the floor for a system that produces real, watchable content and posts autonomously.

---

## WEEK 1 — Get the engine running

### 1. Anthropic API Key (Claude — the brain)
- **Go to:** https://console.anthropic.com
- **Do:** Sign up → API Keys → Create Key
- **Copy:** `sk-ant-...` → paste as `ANTHROPIC_API_KEY` in `.env`
- **Cost:** ~$5-20/mo based on usage
- **You probably already have this**

### 2. Telegram Bot Token (your command center)
- **Go to:** Telegram app → search `@BotFather`
- **Do:** Send `/newbot` → name it "Traide Engine" → pick a username like `traide_engine_bot`
- **Copy:** The token BotFather gives you → `TELEGRAM_BOT_TOKEN`
- **Cost:** FREE

### 3. Your Telegram Chat ID
- **Go to:** Telegram app → search `@userinfobot`
- **Do:** Send any message → it replies with your user ID
- **Copy:** The number → `TELEGRAM_CHAT_ID`
- **Cost:** FREE

### 4. Redis (job queue backend)
- **Option A (local):** `brew install redis` then `redis-server`
- **Option B (cloud):** https://upstash.com → Free tier → copy Redis URL
- **Set:** `REDIS_URL=redis://localhost:6379` (or Upstash URL)
- **Cost:** FREE

### 5. Ayrshare (posts to ALL platforms with one API)
- **Go to:** https://ayrshare.com
- **Do:** Sign up → Premium plan ($69/mo) → Connect your social accounts (YouTube, X, IG, TikTok, FB)
- **Copy:** API Key → `AYRSHARE_API_KEY`
- **Cost:** $69/mo
- **This replaces needing 5 separate API setups**
- **During setup, connect these accounts:**
  - [ ] YouTube channel
  - [ ] X (Twitter) account
  - [ ] Instagram Business account
  - [ ] TikTok account
  - [ ] Facebook Page

### 6. HeyGen (AI avatar — your channel host)
- **Go to:** https://heygen.com
- **Do:** Sign up → Creator plan ($29/mo) → Settings → API → Generate Key
- **Copy:** API Key → `HEYGEN_API_KEY`
- **Then:** Browse Avatars → pick your channel's "host" → copy Avatar ID → `HEYGEN_AVATAR_ID`
- **Cost:** $29/mo
- **Why:** Faceless channels get 2-3x fewer views than faced ones. Consistent AI avatar = consistent brand.

### 7. ElevenLabs (AI voiceovers)
- **Go to:** https://elevenlabs.io
- **Do:** Sign up (free tier = 10,000 chars/mo) → Profile → API Key
- **Copy:** API Key → `ELEVENLABS_API_KEY`
- **Cost:** FREE to start, $5/mo for more

### 8. Submagic (auto-caption burning)
- **Go to:** https://submagic.co
- **Do:** Sign up → pick plan → get API access
- **Copy:** API Key → `SUBMAGIC_API_KEY`
- **Cost:** $16/mo
- **Why:** 85% of social video is watched muted. No captions = no views.

### 9. Replicate (AI image generation)
- **Go to:** https://replicate.com
- **Do:** Sign up → Account → API Tokens → Create
- **Copy:** Token → `REPLICATE_API_TOKEN`
- **Cost:** ~$0.01 per image, ~$5/mo at volume

### 10. YouTube (native integration for better control)
- **Go to:** https://console.cloud.google.com
- **Do:**
  1. Create new project "Traide Media"
  2. Enable "YouTube Data API v3"
  3. Enable "YouTube Analytics API"
  4. Credentials → Create OAuth Client ID → Web Application
  5. Add redirect URI: `http://localhost:3000/callback`
  6. Copy Client ID → `YOUTUBE_CLIENT_ID`
  7. Copy Client Secret → `YOUTUBE_CLIENT_SECRET`
  8. Run the OAuth flow once to get refresh token → `YOUTUBE_REFRESH_TOKEN`
- **Cost:** FREE

### 11. Set initial platform
- **Set:** `ENABLED_PLATFORMS=youtube`
- **Why:** Start with YouTube Shorts only. One platform, nail it, then expand.

---

## WEEK 2 — Strategic inputs (not API keys, YOUR decisions)

### 12. AI Host Identity
- **Decide:** Name, voice, visual look for your AI avatar on HeyGen
- **Why:** Consistency across all videos builds brand recognition
- **Pick:** A HeyGen avatar that matches your brand vibe (professional but approachable)

### 13. Competitor Reference Videos
- **Find:** 10 trading content videos you genuinely admire
- **Examples to look at:**
  - ICT mentorship clips on YouTube
  - Topstep-style trading recap videos
  - Any trading TikTok/Short with 100K+ views
- **Save:** URLs in a text file — we'll feed these into the content brain

### 14. Compliance Disclaimer
- **Draft:** Your exact "Not financial advice" disclaimer
- **Default we have:** "Not financial advice. Trading involves risk. Past performance does not guarantee future results."
- **Consider:** Having a lawyer review this if traide.live handles real money

---

## MONTH 2 — Analytics layer

### 15. Supabase (analytics storage)
- **Go to:** https://supabase.com
- **Do:** New Project → Settings → API
- **Copy:** URL → `SUPABASE_URL`, anon key → `SUPABASE_ANON_KEY`
- **Cost:** FREE tier

---

## MONTH 2+ — Expand platforms

### 16. Expand ENABLED_PLATFORMS
- **Week 5:** `ENABLED_PLATFORMS=youtube,x`
- **Week 9:** `ENABLED_PLATFORMS=youtube,x,tiktok,instagram`
- **Week 12:** `ENABLED_PLATFORMS=youtube,x,tiktok,instagram,facebook,telegram`

---

## Social Accounts You Need (connect through Ayrshare)

- [ ] **YouTube Channel** — create if you don't have one
- [ ] **X (Twitter) Account** — @traide_live or similar
- [ ] **Instagram Business Account** — must be Business/Creator (not Personal)
- [ ] **TikTok Account** — @traidelive or similar
- [ ] **Facebook Page** — "Traide" page (not personal profile)
- [ ] **Telegram Channel** — @traidelive public channel

---

## Deployment (so it runs without your laptop)

### Option A: Railway ($5-10/mo)
```bash
# Install Railway CLI
npm i -g @railway/cli
railway login
railway init
railway up
```

### Option B: Hetzner VPS ($10/mo)
```bash
# SSH into your VPS
ssh root@your-vps
git clone https://github.com/chriskuschnar-coder/traide-media-engine
cd traide-media-engine
cp .env.example .env  # fill in keys
npm install
npm start             # runs bot + scheduler + workers
```

### Option C: Render.com (free tier for bot, paid for workers)

---

## Total Monthly Budget

| Service | Cost |
|---------|------|
| Ayrshare Premium | $69/mo |
| HeyGen Creator | $29/mo |
| Submagic | $16/mo |
| Claude API usage | ~$15/mo |
| Replicate (images) | ~$5/mo |
| ElevenLabs | FREE-$5/mo |
| VPS (Railway/Hetzner) | $5-10/mo |
| **TOTAL** | **~$140-150/mo** |

YouTube, X, Instagram, TikTok, Facebook APIs = all FREE through Ayrshare.

---

## Quick Start Once You Have Keys

```bash
cd ~/Downloads/traide-media-engine
cp .env.example .env
# Fill in all your keys in .env

npm install
npm run setup          # Verify everything's configured

# Terminal 1: Start the bot
npm run bot

# Terminal 2: Start workers + scheduler
npm run scheduler &
npm run worker:video &
npm run worker:post &
npm run worker:analytics &

# Or all at once:
npm start
```

Then open Telegram → your bot → `/start` → `/video How AI spots Fair Value Gaps in real-time`

The engine takes it from there.
