// ── Engagement Agent ──
// Monitors and categorizes incoming comments across platforms.
// Auto-replies where safe, flags everything else for human review.
// RULE: never auto-reply to anything that touches financial advice.

import Anthropic from '@anthropic-ai/sdk';
import { DISCLAIMER, appendDisclaimer } from '../../services/compliance/index.js';
import type { Platform } from '../../types/index.js';

const client = new Anthropic();

// ── Types ──

export interface Comment {
  id: string;
  platform: Platform;
  postId: string;
  author: string;
  text: string;
  timestamp: Date;
}

export type CommentCategory =
  | 'faq'
  | 'lead_partnership'
  | 'criticism'
  | 'financial_advice'
  | 'positive'
  | 'generic';

export type Urgency = 'low' | 'medium' | 'high';

export interface CommentClassification {
  commentId: string;
  category: CommentCategory;
  confidence: number;
  reasoning: string;
}

export interface AutoReply {
  commentId: string;
  reply: string;
}

export interface Flag {
  commentId: string;
  reason: string;
  urgency: Urgency;
}

export interface EngagementResult {
  autoReplies: AutoReply[];
  flags: Flag[];
}

// ── Classification ──

async function classifyComments(
  comments: Comment[],
): Promise<CommentClassification[]> {
  const commentsJson = JSON.stringify(
    comments.map((c) => ({
      id: c.id,
      author: c.author,
      text: c.text,
      platform: c.platform,
    })),
    null,
    2,
  );

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: `You classify social media comments for traide.live (an AI trading platform).

CATEGORIES:
- "faq": Common questions about the product, pricing, features, how to sign up, compatibility, etc.
- "lead_partnership": Business inquiries, partnership proposals, influencer collabs, investment offers.
- "criticism": Negative feedback, complaints, accusations, skepticism about the product.
- "financial_advice": ANY comment asking for trading advice, stock picks, what to buy/sell, asking about specific trades, asking for signals, or anything that would require a financial advice response. THIS IS THE MOST IMPORTANT CATEGORY — when in doubt, classify here.
- "positive": Compliments, praise, success stories, hype, excitement.
- "generic": Emojis only, tags, irrelevant spam, single-word comments.

Respond in JSON array:
[{ "commentId": "...", "category": "...", "confidence": 0.0-1.0, "reasoning": "..." }]

CRITICAL: err on the side of "financial_advice" for anything even remotely related to trading decisions, specific assets, or money management.`,
    messages: [
      {
        role: 'user',
        content: `Classify these comments:\n\n${commentsJson}`,
      },
    ],
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    // If parsing fails, flag everything for safety
    return comments.map((c) => ({
      commentId: c.id,
      category: 'financial_advice' as CommentCategory,
      confidence: 0,
      reasoning: 'Classification failed — flagging for manual review',
    }));
  }

  return JSON.parse(jsonMatch[0]);
}

// ── Reply Generation ──

async function generateFAQReply(comment: Comment): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: `You write friendly, helpful replies to FAQ comments about traide.live.
Keep replies concise (1-3 sentences). Be genuine, not corporate.
Always include the disclaimer when the topic is remotely financial.
Never give financial advice. Direct users to traide.live for details.
Speak naturally, like a helpful community manager who trades.`,
    messages: [
      {
        role: 'user',
        content: `Write a reply to this comment:\n\nAuthor: ${comment.author}\nComment: ${comment.text}\nPlatform: ${comment.platform}`,
      },
    ],
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';
  return appendDisclaimer(text);
}

function generatePositiveReply(comment: Comment): string {
  const replies = [
    `Thanks ${comment.author}! Glad you're vibing with it. Check out traide.live for the full experience.`,
    `Appreciate the love ${comment.author}! More content coming daily. traide.live has the full toolkit.`,
    `${comment.author} you already know! If you haven't tried the AI yet, traide.live is where it's at.`,
    `Let's go ${comment.author}! Plenty more where this came from. See you on traide.live.`,
    `Big thanks ${comment.author}! The AI is just getting started. traide.live to see it in action.`,
  ];

  const reply = replies[Math.floor(Math.random() * replies.length)];
  return appendDisclaimer(reply);
}

// ── Main Processing ──

export async function processComments(
  comments: Comment[],
): Promise<EngagementResult> {
  if (comments.length === 0) {
    return { autoReplies: [], flags: [] };
  }

  // Step 1: classify all comments in one batch
  const classifications = await classifyComments(comments);

  const autoReplies: AutoReply[] = [];
  const flags: Flag[] = [];

  // Step 2: process each classification
  for (const classification of classifications) {
    const comment = comments.find((c) => c.id === classification.commentId);
    if (!comment) continue;

    switch (classification.category) {
      case 'faq': {
        const reply = await generateFAQReply(comment);
        autoReplies.push({ commentId: comment.id, reply });
        break;
      }

      case 'positive':
      case 'generic': {
        if (classification.category === 'generic' && comment.text.trim().length < 3) {
          // Skip very short/empty comments (pure emoji, etc.)
          break;
        }
        const reply = generatePositiveReply(comment);
        autoReplies.push({ commentId: comment.id, reply });
        break;
      }

      case 'lead_partnership': {
        flags.push({
          commentId: comment.id,
          reason: `Lead/partnership inquiry from ${comment.author}: "${comment.text.slice(0, 100)}"`,
          urgency: 'medium',
        });
        break;
      }

      case 'criticism': {
        flags.push({
          commentId: comment.id,
          reason: `Criticism from ${comment.author}: "${comment.text.slice(0, 100)}"`,
          urgency: 'medium',
        });
        break;
      }

      case 'financial_advice': {
        // NEVER auto-reply. Always flag for human.
        flags.push({
          commentId: comment.id,
          reason: `Touches financial advice — "${comment.text.slice(0, 100)}" (${classification.reasoning})`,
          urgency: 'high',
        });
        break;
      }

      default: {
        // Unknown category — flag it
        flags.push({
          commentId: comment.id,
          reason: `Unrecognized category "${classification.category}" — flagging for review`,
          urgency: 'low',
        });
        break;
      }
    }
  }

  return { autoReplies, flags };
}
