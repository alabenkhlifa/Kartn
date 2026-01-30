import { ChatRequest, ChatResponse } from '@/types';
import { CHAT_ENDPOINT } from './constants';

export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(CHAT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Chat API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
