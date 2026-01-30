'use client';

import { useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { ParsedOption } from '@/types';
import { useChat } from '@/hooks/useChat';
import MessageList from './MessageList';
import InputArea from './InputArea';

export default function ChatContainer() {
  const { messages, isLoading, error, sendUserMessage, clearConversation } = useChat();

  const handleSuggestionSelect = useCallback(
    (option: ParsedOption) => {
      // Send the option text for better chat history readability
      sendUserMessage(option.text);
    },
    [sendUserMessage]
  );

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10">
        {/* Logo/Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-sm font-bold text-bg-primary">K</span>
          </div>
          <div>
            <h1 className="text-base font-medium text-text-primary">KarTN</h1>
            <p className="text-xs text-text-secondary">Assistant auto Tunisie</p>
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={clearConversation}
          className="p-2 rounded-lg text-text-secondary hover:text-text-primary
                     hover:bg-white/5 transition-colors"
          title="Nouvelle conversation"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="flex-shrink-0 px-4 py-2 bg-error/10 border-b border-error/20">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        onSuggestionSelect={handleSuggestionSelect}
      />

      {/* Input Area */}
      <InputArea onSend={sendUserMessage} disabled={isLoading} />
    </div>
  );
}
