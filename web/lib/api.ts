import { ChatRequest, ChatResponse } from '@/types';
import { CHAT_ENDPOINT, RECOMMEND_ENDPOINT, SUPABASE_URL } from './constants';

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

export interface RecommendFilters {
  fuel_type?: string;
  body_type?: string;
  condition?: string;
  budget_tnd?: number;
  fcr_tre_only?: boolean;
  fcr_famille_only?: boolean;
  is_voiture_populaire?: boolean;
  country?: string;
}

export interface RecommendRequest {
  filters: RecommendFilters;
  limit?: number;
  offset?: number;
}

export interface RecommendResponse {
  cars: ChatResponse['cars'];
  total: number;
  offset: number;
  limit: number;
}

export async function fetchRecommendations(request: RecommendRequest): Promise<RecommendResponse> {
  const response = await fetch(RECOMMEND_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Recommend API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export async function sendFeedback(messageId: string, rating: -1 | 1, reason?: string): Promise<void> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message_id: messageId,
      rating,
      reason,
    }),
  });

  if (!response.ok) {
    throw new Error(`Feedback API error: ${response.status}`);
  }
}

const FAVORITES_ENDPOINT = `${SUPABASE_URL}/functions/v1/favorites`;

export async function addFavorite(conversationId: string, carId: string): Promise<void> {
  const response = await fetch(FAVORITES_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation_id: conversationId, car_id: carId }),
  });
  if (!response.ok) throw new Error(`Favorites API error: ${response.status}`);
}

export async function removeFavorite(conversationId: string, carId: string): Promise<void> {
  const response = await fetch(FAVORITES_ENDPOINT, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation_id: conversationId, car_id: carId }),
  });
  if (!response.ok) throw new Error(`Favorites API error: ${response.status}`);
}

export async function getFavorites(conversationId: string): Promise<{ favorites: Array<{ id: string; car_id: string; cars: unknown }> }> {
  const response = await fetch(`${FAVORITES_ENDPOINT}?conversation_id=${conversationId}`);
  if (!response.ok) throw new Error(`Favorites API error: ${response.status}`);
  return response.json();
}
