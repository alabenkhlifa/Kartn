import { updateConversation } from '../state.ts';
import { getTemplate, getEVTopicDetail } from '../templates.ts';
import { parseEVTopic } from '../parser.ts';
import { HandlerContext, HandlerResult } from './types.ts';

export async function handleEvTopicSelection(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, conversation, language, classification, supabase } = ctx;

  const evTopic = parseEVTopic(message);
  if (evTopic) {
    const newState = 'showing_ev_info';
    await updateConversation(conversation.id, {
      state: newState,
      selected_ev_topic: evTopic
    }, supabase);
    return {
      response: {
        message: getEVTopicDetail(evTopic, language),
        intent: classification.intent,
        language,
        conversation_id: conversation.id,
        state: newState,
      },
    };
  }

  return {
    response: {
      message: getTemplate('ev_topic_selection', language),
      intent: classification.intent,
      language,
      conversation_id: conversation.id,
      state: conversation.state,
    },
  };
}
