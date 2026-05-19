// ── Telegram Channel Publisher ──

import { Telegraf } from 'telegraf';
import fs from 'fs';

function getBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN not set');
  return new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
}

export async function postToChannel(params: {
  text: string;
  imagePath?: string;
  videoPath?: string;
  buttons?: { text: string; url: string }[];
}): Promise<{ messageId: number }> {
  const bot = getBot();
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  if (!channelId) throw new Error('TELEGRAM_CHANNEL_ID not set — configure it in .env to post to a channel');

  const replyMarkup = params.buttons ? {
    inline_keyboard: [params.buttons.map(b => ({ text: b.text, url: b.url }))],
  } : undefined;

  if (params.videoPath) {
    const msg = await bot.telegram.sendVideo(channelId, {
      source: fs.createReadStream(params.videoPath),
    }, {
      caption: params.text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    });
    return { messageId: msg.message_id };
  }

  if (params.imagePath) {
    const msg = await bot.telegram.sendPhoto(channelId, {
      source: fs.createReadStream(params.imagePath),
    }, {
      caption: params.text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    });
    return { messageId: msg.message_id };
  }

  const msg = await bot.telegram.sendMessage(channelId, params.text, {
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
    link_preview_options: { is_disabled: false },
  });
  return { messageId: msg.message_id };
}
