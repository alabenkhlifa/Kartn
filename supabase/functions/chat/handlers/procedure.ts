import { updateConversation } from '../state.ts';
import { getTemplate, getProcedureDetail } from '../templates.ts';
import { parseProcedure } from '../parser.ts';
import { HandlerContext, HandlerResult } from './types.ts';

export async function handleProcedureInfo(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, conversation, language, classification, supabase } = ctx;

  const procedure = parseProcedure(message);
  if (procedure) {
    const newState = 'showing_procedure_detail';
    await updateConversation(conversation.id, {
      state: newState,
      selected_procedure: procedure
    }, supabase);
    return {
      response: {
        message: getProcedureDetail(procedure, language),
        intent: classification.intent,
        language,
        conversation_id: conversation.id,
        state: newState,
      },
    };
  }

  return {
    response: {
      message: getTemplate('procedure_info', language),
      intent: classification.intent,
      language,
      conversation_id: conversation.id,
      state: conversation.state,
    },
  };
}
