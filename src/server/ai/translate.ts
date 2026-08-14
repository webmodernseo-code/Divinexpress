import Anthropic from '@anthropic-ai/sdk';

function aiEnabled(): boolean {
  return process.env.AI_AGENT_ENABLED !== 'false' && Boolean(process.env.ANTHROPIC_API_KEY);
}

function defaultModel(): string {
  return process.env.AI_AGENT_MODEL || 'claude-opus-5';
}

const TARGET_LANGUAGE = { fr: 'French', en: 'English' } as const;

/**
 * Translates a product description into the other storefront locale. Falls back to
 * returning the source text unchanged if the AI agent is disabled or the call fails —
 * product creation must never be blocked by a translation outage.
 */
export async function translateProductText(text: string, targetLocale: 'fr' | 'en'): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed || !aiEnabled()) return trimmed;

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: defaultModel(),
      max_tokens: 1024,
      thinking: { type: 'disabled' },
      output_config: { effort: 'low' },
      system:
        `Translate the product description the user sends into ${TARGET_LANGUAGE[targetLocale]}. ` +
        'Output ONLY the translated text, in the same tone (marketing product copy), ' +
        'no preamble, no quotes, no explanation. Preserve line breaks.',
      messages: [{ role: 'user', content: trimmed }],
    });

    if (response.stop_reason === 'refusal') return trimmed;

    const translated = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();

    return translated || trimmed;
  } catch (err) {
    console.error('[translate] Claude call failed, using source text:', err);
    return trimmed;
  }
}
