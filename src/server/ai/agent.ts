import Anthropic from '@anthropic-ai/sdk';
import { detectLocale, ruleBasedReply, type RuleOrderContext } from './rules';

export interface AgentCustomer {
  firstName: string;
  lastName: string;
  email: string | null;
}

export interface AgentHistoryItem {
  role: 'customer' | 'assistant';
  text: string;
}

export interface AgentInput {
  channel: 'whatsapp' | 'email' | 'web';
  displayName: string;
  customer?: AgentCustomer | null;
  order?: RuleOrderContext | null;
  history?: AgentHistoryItem[];
  message: string;
  /** True when `message` is the transcript of a voice note. */
  isVoiceNote?: boolean;
}

export interface AgentResult {
  text: string;
  /** True when the reply came from Claude, false when it came from the rule-based fallback. */
  usedAI: boolean;
}

function defaultModel(): string {
  return process.env.AI_AGENT_MODEL || 'claude-opus-5';
}

function aiEnabled(): boolean {
  return process.env.AI_AGENT_ENABLED !== 'false' && Boolean(process.env.ANTHROPIC_API_KEY);
}

function buildSystemPrompt(input: AgentInput): string {
  const name = input.customer
    ? `${input.customer.firstName} ${input.customer.lastName}`.trim()
    : input.displayName;

  const orderContext = input.order
    ? `Dernière commande du client : numéro ${input.order.number}, statut « ${input.order.status} »` +
      (input.order.carrier ? `, transporteur ${input.order.carrier}` : '') +
      (input.order.trackingNumber ? `, suivi ${input.order.trackingNumber}` : '') +
      '.'
    : "Aucune commande récente n'est associée à ce client dans notre base.";

  const customerContext = input.customer
    ? `Client identifié : ${name}${input.customer.email ? ` (${input.customer.email})` : ''}.`
    : `Client non identifié. Nom affiché : ${input.displayName}.`;

  return [
    "Tu es l'assistant commercial IA de DivinExpress, une marque de streetwear premium (sweats, pièces à coupe droite premium ; pièce phare : le sweat YAHWEH).",
    'Tu discutes avec des clients sur WhatsApp et via le formulaire de contact du site. Ton rôle : conseiller, rassurer, orienter vers l\'achat, et aider sur les commandes.',
    '',
    'RÈGLES DE LANGUE (impératives) :',
    "- Détecte la langue du client à chaque message. S'il écrit en français, réponds UNIQUEMENT en français. S'il écrit en anglais, réponds UNIQUEMENT en anglais.",
    "- Si le client écrit dans une AUTRE langue que le français ou l'anglais, réponds poliment en anglais en lui demandant d'écrire en anglais pour que tu puisses l'aider au mieux.",
    "- Comprends les fautes de frappe, les abréviations et le langage SMS tant que l'intention reste claire (ex. « bjr je moi va bien et vus » signifie « bonjour, je vais bien et vous »). Ne corrige pas le client, réponds simplement au sens.",
    '',
    'CE QUE TU PEUX FAIRE (lecture seule) :',
    "- Renseigner sur le suivi/statut d'une commande, les tailles, les produits, la livraison, les délais, la politique de retour (retours sous 14 jours) et de remboursement.",
    '- Orienter vers l\'achat et recueillir les coordonnées (e-mail, numéro de commande) si utile.',
    '',
    'CE QUE TU NE DOIS JAMAIS FAIRE :',
    "- Ne jamais inventer d'informations de commande, de numéro de suivi, de prix ou de stock. Utilise uniquement le contexte fourni ci-dessous.",
    "- Ne jamais promettre une action que tu ne peux pas exécuter (tu ne peux pas modifier, annuler ou rembourser une commande toi-même).",
    "- Pour les litiges, réclamations sensibles, demandes de remboursement contestées ou tout cas complexe : indique au client qu'un conseiller humain de l'équipe DivinExpress va prendre le relais.",
    "- Ne fais jamais apparaître de balises internes ou système (par ex. <thinking>) dans ta réponse.",
    '',
    'NOTES VOCALES : si le message provient d\'une note vocale et que le contenu semble incompréhensible, tronqué ou incertain, demande poliment (dans la langue du client) de réécrire le message ou de renvoyer une note vocale plus claire.',
    '',
    'STYLE : réponses courtes, chaleureuses et professionnelles, adaptées à WhatsApp. Pas de titres Markdown, pas de listes à puces sauf nécessité. Signe implicitement en tant que DivinExpress.',
    '',
    '--- CONTEXTE CLIENT ---',
    customerContext,
    orderContext,
  ].join('\n');
}

export async function generateAgentReply(input: AgentInput): Promise<AgentResult> {
  const locale = detectLocale(input.message);
  const fallbackName = input.customer
    ? `${input.customer.firstName} ${input.customer.lastName}`.trim()
    : input.displayName;

  if (!aiEnabled()) {
    return {
      text: ruleBasedReply({ locale, name: fallbackName, order: input.order, message: input.message }),
      usedAI: false,
    };
  }

  try {
    const client = new Anthropic();
    const history = (input.history ?? []).slice(-12).map((item) => ({
      role: item.role === 'customer' ? ('user' as const) : ('assistant' as const),
      content: item.text,
    }));

    const currentMessage = input.isVoiceNote
      ? `[Note vocale transcrite] ${input.message}`
      : input.message;

    const response = await client.messages.create({
      model: defaultModel(),
      max_tokens: 1024,
      thinking: { type: 'disabled' },
      output_config: { effort: 'low' },
      system: buildSystemPrompt(input),
      messages: [...history, { role: 'user', content: currentMessage }],
    });

    if (response.stop_reason === 'refusal') {
      return {
        text: ruleBasedReply({ locale, name: fallbackName, order: input.order, message: input.message }),
        usedAI: false,
      };
    }

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();

    if (!text) {
      return {
        text: ruleBasedReply({ locale, name: fallbackName, order: input.order, message: input.message }),
        usedAI: false,
      };
    }

    return { text, usedAI: true };
  } catch (err) {
    console.error('[ai-agent] Claude call failed, using fallback:', err);
    return {
      text: ruleBasedReply({ locale, name: fallbackName, order: input.order, message: input.message }),
      usedAI: false,
    };
  }
}
