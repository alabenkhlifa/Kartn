import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Conversation, Language, ClassificationResult, ChatResponse } from '../types.ts';

export interface HandlerContext {
  message: string;
  conversation: Conversation;
  language: Language;
  classification: ClassificationResult;
  supabase: SupabaseClient;
  groqApiKey: string;
  huggingfaceKey: string;
  messageHistory: Array<{ role: string; content: string }>;
}

export interface HandlerResult {
  response: ChatResponse;
}

export type StateHandler = (ctx: HandlerContext) => Promise<HandlerResult>;
