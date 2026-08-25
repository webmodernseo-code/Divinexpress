// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { POST } from './route';

function request(body: unknown) {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/chat', () => {
  let apiKey: string | undefined;

  beforeEach(() => {
    apiKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    if (apiKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = apiKey;
  });

  it.each([
    [{ message: '   ', locale: 'fr' }],
    [{ message: 'x'.repeat(1001), locale: 'fr' }],
    [{ message: 'Hello', locale: 'de' }],
  ])('rejects invalid chat input', async (body) => {
    const response = await POST(request(body));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid request' });
  });

  it('returns a useful localized reply for a valid trimmed question', async () => {
    const response = await POST(request({ message: '  Bonjour, quelle taille choisir ?  ', locale: 'fr' }));
    expect(response.status).toBe(200);
    const body = await response.json() as { reply: string };
    expect(body.reply.length).toBeGreaterThan(10);
    expect(body.reply).toMatch(/taille/i);
  });

  it('rejects malformed JSON without exposing internals', async () => {
    const response = await POST(new Request('http://localhost/api/chat', { method: 'POST', body: '{' }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid request' });
  });
});
