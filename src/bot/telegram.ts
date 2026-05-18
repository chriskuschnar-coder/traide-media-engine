// ── Telegram Bot — Conversational Command Center ──
// No slash commands needed. Talk naturally. Claude routes everything.

import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { routeMessage } from './router.js';
import { executeAction } from './executor.js';
import { getContext, addMessage, clearContext, hasContext } from './context.js';
import { initNotifier } from './notifier.js';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const ALLOWED_CHAT = process.env.TELEGRAM_CHAT_ID!;

function isAuthorized(chatId: number | string): boolean {
  return String(chatId) === ALLOWED_CHAT;
}

// ── Onboarding (first message only) ──
bot.command('start', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  await ctx.reply(
    `I'm your content operator for traide.live. Talk normally — "make a video about X" or "how's reach this week." I handle the rest and only ping when something needs you.\n\nSay "status" to check the engine, or just tell me what to create.`
  );
});

// ── Slash commands as thin aliases — all route through the same engine ──
const slashAliases: Record<string, string> = {
  video: 'make a short video about',
  post: 'post about',
  thread: 'write a thread about',
  plan: 'plan a week of content',
  status: 'status',
  backlog: 'what\'s queued',
  pause: 'pause everything',
  resume: 'resume posting',
  digest: 'weekly digest',
  idea: 'content idea:',
  reset: '',
};

for (const [cmd, prefix] of Object.entries(slashAliases)) {
  bot.command(cmd, async (ctx) => {
    if (!isAuthorized(ctx.chat.id)) return;

    if (cmd === 'reset') {
      await clearContext(ctx.chat.id);
      return ctx.reply('Context cleared.');
    }

    const args = ctx.message.text.replace(`/${cmd}`, '').trim();
    const synthetic = args ? `${prefix} ${args}` : prefix;
    await handleMessage(ctx, synthetic);
  });
}

// ── Primary handler: every text message ──
bot.on('text', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  // Skip if it's a slash command (already handled above)
  if (ctx.message.text.startsWith('/')) return;
  await handleMessage(ctx, ctx.message.text);
});

// ── Photo/video forwarding ──
bot.on('photo', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  const caption = ctx.message.caption || 'this image';
  await handleMessage(ctx, `post ${caption} to all platforms`);
});

bot.on('video', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) return;
  const caption = ctx.message.caption || 'this video';
  await handleMessage(ctx, `post ${caption} to all platforms`);
});

// ── Core message handler ──
async function handleMessage(ctx: any, message: string) {
  const chatId = String(ctx.chat.id);

  try {
    // Get conversation context
    const context = await getContext(chatId);

    // Store user message
    await addMessage(chatId, {
      role: 'user',
      text: message,
      draftIds: [],
      timestamp: Date.now(),
    });

    // Route through Claude
    const routed = await routeMessage(message, context);

    // Execute actions
    const allDraftIds: string[] = [];
    const actionReplies: string[] = [];

    if (routed.actions.length > 0) {
      for (const action of routed.actions) {
        const result = await executeAction(action, context, chatId);
        if (result.reply) actionReplies.push(result.reply);
        allDraftIds.push(...result.draftIds);
      }
    }

    // Build final reply
    let finalReply = '';

    if (actionReplies.length > 0) {
      finalReply = actionReplies.join('\n\n');
    } else if (routed.reply) {
      finalReply = routed.reply;
    }

    if (!finalReply) {
      finalReply = routed.reply || 'Done.';
    }

    // Send reply (split if too long for Telegram's 4096 char limit)
    const chunks = splitMessage(finalReply, 4000);
    for (const chunk of chunks) {
      await ctx.reply(chunk);
    }

    // Store bot response in context
    await addMessage(chatId, {
      role: 'bot',
      text: finalReply.slice(0, 500),
      draftIds: allDraftIds,
      timestamp: Date.now(),
    });

    // Log routing decision
    console.log(`[router] "${message.slice(0, 60)}" → ${routed.actions.map(a => a.action).join(', ') || 'chat'}`);

  } catch (err) {
    console.error('[bot] Error:', err);
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    await ctx.reply(`Something broke: ${errMsg.slice(0, 200)}`);
  }
}

function splitMessage(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    // Find last newline within limit
    let splitAt = remaining.lastIndexOf('\n', maxLen);
    if (splitAt < maxLen / 2) splitAt = maxLen;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }
  return chunks;
}

// ── Launch ──
initNotifier(bot, ALLOWED_CHAT);

bot.launch().then(() => {
  console.log('Traide Media Engine online. Conversational mode.');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
