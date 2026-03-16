'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Message, ParsedOption } from '@/types';
import BotMessage from './BotMessage';
import UserMessage from './UserMessage';
import TypingIndicator from './TypingIndicator';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onSuggestionSelect: (option: ParsedOption) => void;
  onRetry?: (messageId: string) => void;
}

export default function MessageList({
  messages,
  isLoading,
  onSuggestionSelect,
  onRetry,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4" role="log" aria-live="polite" aria-label="Chat messages">
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => (
          <div key={message.id}>
            {message.role === 'assistant' ? (
              <BotMessage
                message={message}
                onSuggestionSelect={onSuggestionSelect}
                isLatest={index === messages.length - 1 && !isLoading}
                isLoading={isLoading}
              />
            ) : (
              <UserMessage
                message={message}
                onRetry={message.error ? () => onRetry?.(message.id) : undefined}
              />
            )}
          </div>
        ))}
      </AnimatePresence>

      {/* Typing Indicator */}
      <AnimatePresence>
        {isLoading && <TypingIndicator />}
      </AnimatePresence>

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}
