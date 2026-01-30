'use client';

import { useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { ParsedOption } from '@/types';
import { useChat } from '@/hooks/useChat';
import MessageList from './MessageList';
import InputArea from './InputArea';
import WelcomeScreen from '@/components/welcome/WelcomeScreen';

export default function ChatContainer() {
  const { messages, isLoading, error, sendUserMessage, clearConversation } = useChat();

  const handleSuggestionSelect = useCallback(
    (option: ParsedOption) => {
      // Send the option text for better chat history readability
      sendUserMessage(option.text);
    },
    [sendUserMessage]
  );

  const handleFAQClick = useCallback(
    (message: string) => {
      sendUserMessage(message);
    },
    [sendUserMessage]
  );

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-center px-4 py-3 border-b border-white/10 bg-bg-secondary relative">
        {/* Logo/Title - Centered */}
        <span className="text-xl font-bold text-accent">KarTN</span>

        {/* Reset Button - only show when there are messages */}
        {hasMessages && (
          <button
            onClick={clearConversation}
            className="absolute right-4 p-2 rounded-lg text-text-secondary hover:text-accent
                       hover:bg-accent-light transition-colors"
            title="Nouvelle conversation"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        )}
      </header>

      {/* Error Banner */}
      {error && (
        <div className="flex-shrink-0 px-4 py-2 bg-error/10 border-b border-error/20">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Welcome Screen or Messages */}
      {!hasMessages && !isLoading ? (
        <WelcomeScreen onFAQClick={handleFAQClick} />
      ) : (
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onSuggestionSelect={handleSuggestionSelect}
        />
      )}

      {/* Input Area */}
      <InputArea onSend={sendUserMessage} disabled={isLoading} />
    </div>
  );
}
