// ── X (Twitter) Publisher ──

import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs';

function getClient() {
  if (!process.env.X_API_KEY) throw new Error('X_API_KEY not set — configure X/Twitter credentials in .env');
  return new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET!,
    accessToken: process.env.X_ACCESS_TOKEN!,
    accessSecret: process.env.X_ACCESS_SECRET!,
  });
}

export async function postTweet(params: {
  text: string;
  mediaPath?: string;
}): Promise<{ id: string; url: string }> {
  const client = getClient();
  let mediaId: string | undefined;

  if (params.mediaPath) {
    mediaId = await client.v1.uploadMedia(params.mediaPath);
  }

  const tweet = await client.v2.tweet({
    text: params.text,
    ...(mediaId && { media: { media_ids: [mediaId] } }),
  });

  return {
    id: tweet.data.id,
    url: `https://x.com/i/status/${tweet.data.id}`,
  };
}

export async function postThread(params: {
  tweets: string[];
  mediaPath?: string;  // Attach to first tweet
}): Promise<{ ids: string[]; url: string }> {
  const client = getClient();
  const ids: string[] = [];
  let lastTweetId: string | undefined;

  for (let i = 0; i < params.tweets.length; i++) {
    let mediaId: string | undefined;
    if (i === 0 && params.mediaPath) {
      mediaId = await client.v1.uploadMedia(params.mediaPath);
    }

    const tweet = await client.v2.tweet({
      text: params.tweets[i],
      ...(lastTweetId && { reply: { in_reply_to_tweet_id: lastTweetId } }),
      ...(mediaId && { media: { media_ids: [mediaId] } }),
    });

    ids.push(tweet.data.id);
    lastTweetId = tweet.data.id;
  }

  return {
    ids,
    url: `https://x.com/i/status/${ids[0]}`,
  };
}
