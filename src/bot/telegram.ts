// ── Telegram Bot - Command Center ──
// This is YOUR control panel. Send commands to create & distribute content.

import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';
import { nanoid } from 'nanoid';
import { interpretCommand, generateContentScript, generateContentPlan } from '../services/ai/claude.js';
import { addContentJob, getQueueStats } from '../services/queue/index.js';
import type { ContentRequest, ContentStyle, Platform } from '../types/index.js';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const ALLOWED_CHAT = process.env.TELEGRAM_CHAT_ID!;

// Only respond to your chat
function isAuthorized(chatId: number | string): boolean {
  return String(chatId) === ALLOWED_CHAT;
}

// ── Commands ──

bot.command('start', (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  ctx.reply(`🎬 Traide Media Engine Online

Commands:
/create <description> — Create content
/video <topic> — Create a short video for all platforms
/post <message> — Post text to all platforms
/thread <topic> — Create an X thread
/plan <days> — Generate a content plan
/status — Check queue status
/approve — Approve pending content
/schedule <time> <description> — Schedule content

Or just describe what you want in plain English and I'll figure it out.`);
});

bot.command('status', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  const stats = await getQueueStats();
  ctx.reply(`📊 Queue Status:
Content: ${stats.content.waiting} waiting, ${stats.content.active} active
Distribution: ${stats.distribution.waiting} waiting, ${stats.distribution.active} active`);
});

bot.command('video', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  const topic = ctx.message.text.replace('/video ', '').trim();
  if (!topic) return ctx.reply('Usage: /video <topic>');

  ctx.reply('🎬 Creating short video for all platforms...');

  const script = await generateContentScript({
    type: 'short_video',
    topic,
    platform: 'tiktok', // Generate for vertical-first
    style: { tone: 'hype', visual: 'dark_trading', music: 'energetic', duration: 30 },
  });

  const request: ContentRequest = {
    id: nanoid(),
    type: 'short_video',
    platforms: ['youtube', 'tiktok', 'instagram', 'facebook', 'x', 'telegram'],
    prompt: topic,
    status: 'queued',
    createdAt: new Date(),
    style: { tone: 'hype', visual: 'dark_trading', music: 'energetic', duration: 30 },
  };

  await addContentJob(request);

  ctx.reply(`✅ Video queued!

📝 Script:
Hook: "${script.hook}"
Caption: "${script.caption}"
CTA: "${script.cta}"
Hashtags: ${script.hashtags.join(' ')}

📤 Will post to: YouTube Shorts, TikTok, IG Reels, FB Reels, X, Telegram

Use /approve to review before posting.`);
});

bot.command('post', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  const message = ctx.message.text.replace('/post ', '').trim();
  if (!message) return ctx.reply('Usage: /post <message>');

  const request: ContentRequest = {
    id: nanoid(),
    type: 'text_post',
    platforms: ['x', 'facebook', 'telegram'],
    prompt: message,
    status: 'queued',
    createdAt: new Date(),
  };

  await addContentJob(request);
  ctx.reply(`✅ Text post queued for X, Facebook, Telegram\n\n"${message}"`);
});

bot.command('thread', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  const topic = ctx.message.text.replace('/thread ', '').trim();
  if (!topic) return ctx.reply('Usage: /thread <topic>');

  ctx.reply('🧵 Generating X thread...');

  const script = await generateContentScript({
    type: 'thread',
    topic,
    platform: 'x',
    style: { tone: 'educational', visual: 'clean_minimal', music: 'none' },
  });

  ctx.reply(`🧵 Thread Draft:\n\n${script.script}\n\nSend /approve to post.`);
});

bot.command('plan', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  const days = parseInt(ctx.message.text.replace('/plan ', '')) || 7;

  ctx.reply(`📅 Generating ${days}-day content plan...`);

  const plan = await generateContentPlan({ days, postsPerDay: 3 });

  let planText = `📅 ${days}-Day Content Plan:\n\n`;
  for (const item of plan.slice(0, 15)) {
    planText += `Day ${item.day} @ ${item.time} — ${item.type}\n`;
    planText += `  📌 ${item.topic}\n`;
    planText += `  🎣 "${item.hook}"\n`;
    planText += `  📤 ${item.platforms.join(', ')}\n\n`;
  }

  if (plan.length > 15) {
    planText += `...and ${plan.length - 15} more posts.\n`;
  }

  planText += `\nSend /execute_plan to schedule all posts.`;
  ctx.reply(planText);
});

// ── Natural Language Handler ──
bot.on('text', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;

  const message = ctx.message.text;
  ctx.reply('🤖 Processing your request...');

  const parsed = await interpretCommand(message);

  switch (parsed.action) {
    case 'create_content': {
      const allPlatforms: Platform[] = ['youtube', 'x', 'instagram', 'tiktok', 'facebook', 'telegram'];
      const request: ContentRequest = {
        id: nanoid(),
        type: parsed.contentType || 'short_video',
        platforms: parsed.platforms || allPlatforms,
        prompt: parsed.topic || message,
        status: 'queued',
        createdAt: new Date(),
        style: {
          tone: parsed.style?.tone || 'hype',
          visual: parsed.style?.visual || 'dark_trading',
          music: parsed.style?.music || 'energetic',
          duration: parsed.style?.duration || 30,
        } as ContentStyle,
      };

      await addContentJob(request);
      ctx.reply(`✅ Content creation queued!\nType: ${request.type}\nPlatforms: ${request.platforms.join(', ')}\nTopic: ${request.prompt}`);
      break;
    }

    case 'create_plan': {
      ctx.reply('📅 Use /plan <number_of_days> to generate a content plan');
      break;
    }

    case 'status': {
      const stats = await getQueueStats();
      ctx.reply(`📊 Content: ${stats.content.waiting} queued | Distribution: ${stats.distribution.waiting} queued`);
      break;
    }

    default:
      ctx.reply(`I understood: "${message}"\n\nBut I'm not sure what action to take. Try:\n/video <topic>\n/post <message>\n/thread <topic>\n/plan <days>\n\nOr describe more specifically what content you want created.`);
  }
});

// ── Photo/Video Handler (forward content to post) ──
bot.on('photo', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  const caption = ctx.message.caption || '';
  ctx.reply(`📸 Got image! Caption: "${caption}"\nI'll queue this for posting. Which platforms? Reply with: all, x, ig, tiktok, fb, telegram`);
});

bot.on('video', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  const caption = ctx.message.caption || '';
  ctx.reply(`🎥 Got video! Caption: "${caption}"\nI'll queue this for posting. Which platforms? Reply with: all, x, ig, tiktok, fb, yt, telegram`);
});

// ── Launch ──
bot.launch().then(() => {
  console.log('🚀 Traide Media Engine bot is running');
  console.log('Send /start to your bot to see available commands');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
