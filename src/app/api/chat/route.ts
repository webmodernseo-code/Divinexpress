import { z } from 'zod';
import { generateAgentReply } from '@/server/ai/agent';
import { ruleBasedReply } from '@/server/ai/rules';

const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  locale: z.enum(['fr', 'en']),
}).strict();

const PREDEFINED_QUESTIONS = {
  fr: ['suivre ma commande', 'faire un retour', 'choisir ma taille', 'quels moyens de paiement ?'],
  en: ['track my order', 'make a return', 'choose my size', 'which payment methods?'],
} as const;

export async function POST(request: Request) {
  try {
    const parsed = chatRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { message, locale } = parsed.data;
    const normalizedMessage = message.toLocaleLowerCase(locale).replace(/\s+/g, ' ').trim();
    if ((PREDEFINED_QUESTIONS[locale] as readonly string[]).includes(normalizedMessage)) {
      return Response.json({
        reply: ruleBasedReply({
          locale,
          name: locale === 'fr' ? 'cher client' : 'there',
          message,
        }),
      });
    }
    const result = await generateAgentReply({
      channel: 'web',
      displayName: locale === 'fr' ? 'Visiteur du site' : 'Website visitor',
      message,
    });
    const reply = result.usedAI
      ? result.text
      : ruleBasedReply({
          locale,
          name: locale === 'fr' ? 'cher client' : 'there',
          message,
        });

    return Response.json({ reply });
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }
}
