// ── Telegram Channel Publisher ──

import { Telegraf } from 'telegraf';
import fs from 'fs';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

export async function postToChannel(params: {
  text: string;
  imagePath?: string;
  videoPath?: string;
  buttons?: { text: string; url: string }[];
}): Promise<{ messageId: number }> {
  const channelId = process.env.TELEGRAM_CHANNEL_ID!;

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
