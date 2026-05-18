# Traide Media Engine

AI-powered content creation & distribution engine for [traide.live](https://traide.live).

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    YOU (Telegram Bot)                      │
│  "create a video about our AI indicators"                 │
│  "post this to all platforms"                             │
│  "make a 7-day content plan"                              │
└──────────────────┬───────────────────────────────────────┘
                   │
         ┌─────────▼──────────┐
         │   Claude AI Brain   │  ← Interprets commands, writes scripts,
         │  (Command Parser)   │    generates content plans, adapts per platform
         └─────────┬──────────┘
                   │
         ┌─────────▼──────────┐
         │   Content Creator   │  ← Orchestrates creation pipeline
         │      Agent          │
         └─────────┬──────────┘
                   │
        ┌──────────┼──────────────┐
        │          │              │
   ┌────▼───┐ ┌───▼────┐  ┌─────▼─────┐
   │ Flux   │ │Eleven  │  │ Replicate │
   │(images)│ │Labs    │  │ (video)   │
   └────┬───┘ │(voice) │  └─────┬─────┘
        │     └───┬────┘        │
        └─────────┼─────────────┘
                  │
         ┌────────▼──────────┐
         │   Bull Job Queue   │  ← Redis-backed async processing
         └────────┬──────────┘
                  │
         ┌────────▼──────────┐
         │   Distributor      │  ← Posts to all platforms
         │      Agent         │
         └────────┬──────────┘
                  │
    ┌─────┬──────┼──────┬──────┬──────┐
    │     │      │      │      │      │
   YT   TikTok  IG     X     FB   Telegram
```

## Quick Start

```bash
cp .env.example .env     # Fill in your API keys
npm install
npm run setup            # Check which services are configured
npm run bot              # Start Telegram command center
```

In a separate terminal:
```bash
npm run worker:video     # Content creation worker
npm run worker:post      # Distribution worker
```

## Telegram Commands

| Command | What it does |
|---------|-------------|
| `/video <topic>` | Create a short video for all platforms |
| `/post <message>` | Post text to X, Facebook, Telegram |
| `/thread <topic>` | Create an X thread |
| `/plan <days>` | Generate a multi-day content plan |
| `/status` | Check queue status |
| Or just type naturally | "make a video about our AI trading signals and post everywhere" |

## What You Need (API Keys)

### Required (minimum viable)
1. **Anthropic API Key** — The brain. [console.anthropic.com](https://console.anthropic.com)
2. **Telegram Bot Token** — Your command center. Message @BotFather on Telegram
3. **Redis** — Job queue. `brew install redis` locally or use Railway/Upstash

### Content Creation
4. **Replicate** — AI image/video generation. [replicate.com](https://replicate.com)
5. **ElevenLabs** — AI voiceovers. [elevenlabs.io](https://elevenlabs.io)

### Distribution (add as you go)
6. **X/Twitter** — [developer.x.com](https://developer.x.com) (Free tier works)
7. **YouTube** — Google Cloud Console → YouTube Data API v3
8. **Instagram** — Meta Business Suite → Graph API (needs Business account)
9. **Facebook** — Meta Business Suite → Page tokens
10. **TikTok** — [developers.tiktok.com](https://developers.tiktok.com) → Content Posting API
