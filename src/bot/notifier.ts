import { Telegraf } from 'telegraf';

let bot: Telegraf | null = null;
let operatorChatId: string = '';

export function initNotifier(telegrafBot: Telegraf, chatId: string) {
  bot = telegrafBot;
  operatorChatId = chatId;
}

export async function notify(message: string): Promise<void> {
  if (!bot || !operatorChatId) return;
  try {
    await bot.telegram.sendMessage(operatorChatId, message, { parse_mode: 'HTML' });
  } catch (err) {
    console.error('Notification failed:', err);
  }
}

export async function notifyAssetsReady(draftId: string, type: string): Promise<void> {
  await notify(`Preview ready for ${draftId} (${type}). Publish, schedule, or revise?`);
}

export async function notifyViewMilestone(title: string, platform: string, views: number): Promise<void> {
  const emoji = views >= 100000 ? '\u{1F525}\u{1F525}' : views >= 10000 ? '\u{1F525}' : '\u{1F4C8}';
  await notify(`${emoji} "${title}" hit ${views.toLocaleString()} views on ${platform}.`);
}

export async function notifyComplianceFlag(draftId: string, issues: string[]): Promise<void> {
  await notify(`\u26A0\uFE0F Draft ${draftId} blocked:\n${issues.map(i => `\u2022 ${i}`).join('\n')}\n\nRevise or scrap?`);
}

export async function notifyCommentForReview(postTitle: string, comment: string): Promise<void> {
  await notify(`\u{1F4AC} Comment on "${postTitle}":\n"${comment.slice(0, 200)}"\n\nReply manually or let AI handle?`);
}

export async function notifyScheduledSoon(draftId: string, title: string, minutesUntil: number): Promise<void> {
  await notify(`Posting ${draftId} ("${title}") in ${minutesUntil} min unless you say hold.`);
}

export async function notifyWeeklyDigest(digest: string): Promise<void> {
  await notify(`\u{1F4CA} Weekly Digest\n\n${digest}`);
}
