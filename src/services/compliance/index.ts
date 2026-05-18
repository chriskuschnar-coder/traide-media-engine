// ── Content Compliance Layer ──
// Reviews all content before posting to ensure regulatory safety.
// Financial content has strict rules — this is the guardrail.

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

// ── Types ──

export interface ComplianceResult {
  approved: boolean;
  issues: string[];
  suggestedRevision?: string;
}

// ── Constants ──

export const DENY_LIST: string[] = [
  'guaranteed returns',
  'risk-free',
  'risk free',
  '100% win rate',
  'make money fast',
  'pump',
  'no risk',
  'easy money',
  'get rich',
  '% return',
  '% returns',
  '% profit',
  '% gains',
  'guaranteed profit',
  'guaranteed income',
  'double your money',
  'triple your money',
  'never lose',
  'can\'t lose',
  'zero risk',
  'free money',
  'sure thing',
  'insider',
  'moonshot guaranteed',
];

export const DISCLAIMER =
  'Not financial advice. Trading involves risk. Past performance does not guarantee future results.';

// ── Deny-list scan ──

function scanDenyList(content: string): string[] {
  const lower = content.toLowerCase();
  return DENY_LIST.filter((phrase) => lower.includes(phrase.toLowerCase()));
}

// ── AI-powered deep review ──

async function aiReview(
  content: string,
  denyHits: string[],
): Promise<{ issues: string[]; suggestedRevision?: string }> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: `You are a financial content compliance reviewer. Your job is to flag content that could violate financial advertising regulations or platform policies.

FLAG if the content:
- Promises or implies guaranteed returns or profits
- Makes specific return percentage claims
- Minimizes the risk of trading/investing
- Could be construed as personalized financial advice
- Uses manipulative urgency tactics ("buy now or miss out")
- References pump-and-dump schemes or market manipulation
- Contains misleading performance claims

ALLOW if the content:
- Discusses trading education generally
- Shows features of a trading tool without performance promises
- Includes appropriate disclaimers
- Uses hedging language ("may", "potential", "past performance")

Respond in JSON: { "issues": ["..."], "suggestedRevision": "..." }
- "issues" is an array of specific compliance problems found (empty if clean)
- "suggestedRevision" is a rewritten version that fixes all issues (omit if no issues)`,
    messages: [
      {
        role: 'user',
        content: `Review this content for financial compliance.

${denyHits.length > 0 ? `DENY-LIST HITS ALREADY FOUND: ${denyHits.join(', ')}\n` : ''}
CONTENT:
${content}`,
      },
    ],
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { issues: ['Failed to parse compliance review — flagging for manual review'] };
  }

  return JSON.parse(jsonMatch[0]);
}

// ── Public API ──

export async function reviewContent(content: string): Promise<ComplianceResult> {
  // Step 1: fast deny-list scan
  const denyHits = scanDenyList(content);

  // Step 2: AI deep review (always runs — catches nuance the deny-list misses)
  const ai = await aiReview(content, denyHits);

  // Merge issues
  const issues: string[] = [
    ...denyHits.map((phrase) => `Deny-list match: "${phrase}"`),
    ...ai.issues,
  ];

  return {
    approved: issues.length === 0,
    issues,
    suggestedRevision: ai.suggestedRevision,
  };
}

export function appendDisclaimer(caption: string): string {
  if (caption.includes(DISCLAIMER)) return caption;
  return `${caption.trimEnd()}\n\n${DISCLAIMER}`;
}
