// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateAgentReply } from './agent';
import { detectLocale, ruleBasedReply, voiceUnclearMessage } from './rules';

describe('rule-based engine', () => {
  it('detects french vs english', () => {
    expect(detectLocale('Bonjour, je voudrais suivre ma commande')).toBe('fr');
    expect(detectLocale('Hello, where is my order?')).toBe('en');
  });

  it('answers tracking questions with the order number when known', () => {
    const reply = ruleBasedReply({
      locale: 'fr',
      name: 'Jean Dupont',
      order: { number: 'RG-1042', status: 'shipped', carrier: 'Colissimo', trackingNumber: 'XY123' },
      message: 'où est ma commande ?',
    });
    expect(reply).toContain('RG-1042');
    expect(reply).toContain('XY123');
  });

  it('voice fallback is bilingual', () => {
    const msg = voiceUnclearMessage();
    expect(msg.toLowerCase()).toContain('note vocale');
    expect(msg.toLowerCase()).toContain('voice note');
  });
});

describe('generateAgentReply fallback (no API key)', () => {
  let savedKey: string | undefined;
  beforeEach(() => {
    savedKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });
  afterEach(() => {
    if (savedKey !== undefined) process.env.ANTHROPIC_API_KEY = savedKey;
  });

  it('falls back to the rule engine and never throws', async () => {
    const result = await generateAgentReply({
      channel: 'whatsapp',
      displayName: 'Client WhatsApp',
      message: 'Bonjour, quelle taille pour le sweat ?',
    });
    expect(result.usedAI).toBe(false);
    expect(result.text.length).toBeGreaterThan(0);
  });
});
