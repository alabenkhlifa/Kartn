'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, Language } from '@/types';
import { sendMessage, generateMessageId } from '@/lib/api';
import { useLocalStorage } from './useLocalStorage';
import { CONVERSATION_ID_KEY, LANGUAGE_KEY, UILanguage } from '@/lib/constants';

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  conversationId: string | null;
  sendUserMessage: (content: string, language?: UILanguage) => Promise<void>;
  clearConversation: () => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId, clearConversationId] = useLocalStorage<string | null>(
    CONVERSATION_ID_KEY,
    null
  );

  const abortControllerRef = useRef<AbortController | null>(null);

  // Clear stale conversation ID when WelcomeScreen is shown (messages empty)
  // Always clear conversation ID when messages are empty to ensure fresh start
  useEffect(() => {
    if (messages.length === 0) {
      clearConversationId();
    }
  }, [messages.length, clearConversationId]);

  const sendUserMessage = useCallback(
    async (content: string, language?: UILanguage) => {
      if (!content.trim() || isLoading) return;

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Add user message immediately
      const userMessage: Message = {
        id: generateMessageId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        // Get language from localStorage if not provided
        const effectiveLanguage = language ||
          (typeof window !== 'undefined' ? localStorage.getItem(LANGUAGE_KEY) as Language : null) ||
          undefined;

        const response = await sendMessage({
          message: content.trim(),
          conversation_id: conversationId || undefined,
          language: effectiveLanguage,
        });

        // Save conversation ID
        if (response.conversation_id) {
          setConversationId(response.conversation_id);
        }

        // Add assistant response
        const assistantMessage: Message = {
          id: generateMessageId(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
          cars: response.cars,
          calculation: response.calculation,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // Ignore abort errors
        }
        const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
        setError(errorMessage);
        console.error('Chat error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, isLoading, setConversationId]
  );

  const clearConversation = useCallback(() => {
    setMessages([]);
    clearConversationId();
    setError(null);
  }, [clearConversationId]);

  return {
    messages,
    isLoading,
    error,
    conversationId,
    sendUserMessage,
    clearConversation,
  };
}
