import { updateConversation } from '../state.ts';
import { getTemplate } from '../templates.ts';
import { generateResponse } from '../generator.ts';
import { retrieve } from '../retrieval.ts';
import { Language } from '../types.ts';
import { HandlerContext, HandlerResult } from './types.ts';

export async function handleCarComparisonInput(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, conversation, language, classification, supabase, groqApiKey, huggingfaceKey } = ctx;

  // User has entered comparison query - use LLM to generate comparison
  const query = message.trim();
  if (query.length > 3) {
    const newState = 'showing_comparison';
    await updateConversation(conversation.id, {
      state: newState,
      comparison_query: query
    }, supabase);

    // Use LLM to generate comparison
    const comparisonPrompt = `Compare ces voitures pour un acheteur tunisien: "${query}".
Génère un tableau markdown comparatif incluant:
- Prix estimé en Europe et en Tunisie
- Consommation de carburant
- Fiabilité
- Disponibilité des pièces en Tunisie
- Coût d'entretien
- Points forts et points faibles
Réponds en ${language === 'french' ? 'français' : language === 'arabic' ? 'arabe' : 'tunisien'}.`;

    const comparisonContext = await retrieve(
      query,
      'general_info',
      {},
      supabase,
      huggingfaceKey
    );

    const { message: comparisonResult } = await generateResponse(
      comparisonPrompt,
      { ...classification, intent: 'general_info' },
      comparisonContext,
      groqApiKey,
      undefined,
      supabase
    );

    // Add transition question
    const transitionQuestion: Record<Language, string> = {
      french: `\n\nVoulez-vous chercher une de ces voitures?
1. Oui
2. Non, retour au menu`,
      arabic: `\n\nتحب تلقى وحدة من هالكراهب؟
1. نعم
2. لا، رجوع للقائمة`,
      derja: `\n\nتحب تلقى وحدة من هالكراهب؟
1. إيه
2. لا، نرجع للقائمة`,
    };

    return {
      response: {
        message: comparisonResult + transitionQuestion[language],
        intent: classification.intent,
        language,
        conversation_id: conversation.id,
        state: newState,
      },
    };
  }

  return {
    response: {
      message: getTemplate('car_comparison_input', language),
      intent: classification.intent,
      language,
      conversation_id: conversation.id,
      state: conversation.state,
    },
  };
}
