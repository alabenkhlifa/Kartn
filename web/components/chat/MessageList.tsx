'use client';

import { useEffect, useRef } from 'react';
import { Message, ParsedOption } from '@/types';
import BotMessage from './BotMessage';
import UserMessage from './UserMessage';
import TypingIndicator from './TypingIndicator';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onSuggestionSelect: (option: ParsedOption) => void;
}

export default function MessageList({
  messages,
  isLoading,
  onSuggestionSelect,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
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
            <UserMessage message={message} />
          )}
        </div>
      ))}

      {/* Typing Indicator */}
      {isLoading && <TypingIndicator />}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}
