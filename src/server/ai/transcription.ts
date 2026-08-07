/**
 * Speech-to-text for WhatsApp voice notes.
 *
 * The Anthropic Messages API cannot transcribe audio, so this uses a separate,
 * OpenAI-compatible `/audio/transcriptions` endpoint (OpenAI Whisper, Groq, or
 * any compatible server). It is entirely optional: when `STT_API_KEY` is unset
 * the caller falls back to asking the customer to write their message instead.
 *
 * Env:
 *   STT_API_KEY   — required to enable transcription
 *   STT_BASE_URL  — default https://api.openai.com/v1
 *   STT_MODEL     — default whisper-1
 */
export function isTranscriptionConfigured(): boolean {
  return Boolean(process.env.STT_API_KEY);
}

export async function transcribeAudio(buffer: Buffer, mimeType: string): Promise<string | null> {
  const apiKey = process.env.STT_API_KEY;
  if (!apiKey) return null;

  const baseUrl = (process.env.STT_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = process.env.STT_MODEL || 'whisper-1';
  const extension = mimeType.includes('mp4')
    ? 'mp4'
    : mimeType.includes('mpeg')
      ? 'mp3'
      : mimeType.includes('wav')
        ? 'wav'
        : 'ogg';

  try {
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(buffer)], { type: mimeType }), `voice.${extension}`);
    form.append('model', model);

    const res = await fetch(`${baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!res.ok) {
      console.error('[stt] transcription failed:', res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { text?: string };
    const text = (data.text ?? '').trim();
    return text.length > 0 ? text : null;
  } catch (err) {
    console.error('[stt] transcription error:', err);
    return null;
  }
}
