'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, Language } from '@/types';
import { generateMessageId } from '@/lib/api';
import { useLocalStorage } from './useLocalStorage';
import { CONVERSATION_ID_KEY, LANGUAGE_KEY, UILanguage, CHAT_ENDPOINT } from '@/lib/constants';

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  conversationId: string | null;
  sendUserMessage: (content: string, language?: UILanguage, apiContent?: string) => Promise<void>;
  clearConversation: () => void;
  retryMessage: (messageId: string) => Promise<void>;
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

  const MESSAGES_KEY = 'kartn_messages';

  // Persist messages to sessionStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
      } catch { /* quota exceeded, ignore */ }
    } else {
      sessionStorage.removeItem(MESSAGES_KEY);
    }
  }, [messages]);

  // Restore messages from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(MESSAGES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Restore Date objects from ISO strings
        const restored = parsed.map((m: Message & { timestamp: string }) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        setMessages(restored);
      }
    } catch { /* corrupt data, ignore */ }
  }, []);

  // Clear stale conversation ID when WelcomeScreen is shown (messages empty)
  // Always clear conversation ID when messages are empty to ensure fresh start
  useEffect(() => {
    if (messages.length === 0) {
      clearConversationId();
    }
  }, [messages.length, clearConversationId]);

  const sendUserMessage = useCallback(
    async (content: string, language?: UILanguage, apiContent?: string) => {
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

        const response = await fetch(CHAT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: (apiContent || content).trim(),
            conversation_id: conversationId || undefined,
            language: effectiveLanguage,
            stream: true,
          }),
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Chat API error: ${response.status} - ${errorText}`);
        }

        const contentType = response.headers.get('Content-Type') || '';

        if (contentType.includes('text/event-stream') && response.body) {
          // SSE streaming response — create a placeholder and stream content into it
          const assistantId = generateMessageId();
          const assistantMessage: Message = {
            id: assistantId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split('\n')) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data: ') || trimmed === 'data: [DONE]') continue;

              try {
                const parsed = JSON.parse(trimmed.slice(6));
                if (parsed.content) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: m.content + parsed.content }
                        : m
                    )
                  );
                }
              } catch {
                // skip malformed chunks
              }
            }
          }
        } else {
          // Regular JSON response (wizard states, etc.)
          const data = await response.json();

          if (data.conversation_id) {
            setConversationId(data.conversation_id);
          }

          const assistantMessage: Message = {
            id: generateMessageId(),
            role: 'assistant',
            content: data.message,
            timestamp: new Date(),
            cars: data.cars,
            calculation: data.calculation,
            state: data.state,
            message_id: data.message_id,
            suggestions: data.suggestions,
          };

          setMessages((prev) => [...prev, assistantMessage]);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // Ignore abort errors
        }
        const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
        // Mark the last user message as failed
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMessage.id ? { ...m, error: true } : m
          )
        );
        setError(errorMessage);
        console.error('Chat error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, isLoading, setConversationId]
  );

  const retryMessage = useCallback(
    async (messageId: string) => {
      const failedMessage = messages.find((m) => m.id === messageId && m.error);
      if (!failedMessage) return;

      // Remove the failed message
      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      // Re-send it
      await sendUserMessage(failedMessage.content);
    },
    [messages, sendUserMessage]
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
    retryMessage,
  };
}
