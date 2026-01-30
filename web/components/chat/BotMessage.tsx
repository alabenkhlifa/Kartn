'use client';

import { Car } from 'lucide-react';
import { Message, ParsedOption } from '@/types';
import { parseNumberedOptions, extractMainMessage } from '@/lib/parser';
import SuggestionButtons from '@/components/suggestions/SuggestionButtons';
import CarList from '@/components/cars/CarList';
import MarkdownContent from '@/components/markdown/MarkdownContent';

interface BotMessageProps {
  message: Message;
  onSuggestionSelect: (option: ParsedOption) => void;
  isLatest: boolean;
  isLoading: boolean;
}

export default function BotMessage({
  message,
  onSuggestionSelect,
  isLatest,
  isLoading,
}: BotMessageProps) {
  const options = parseNumberedOptions(message.content);
  const mainContent = extractMainMessage(message.content);

  // Show full message if no options parsed, or if it contains car results
  const displayContent = options.length > 0 && !message.cars?.length ? mainContent : message.content;

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="flex items-start gap-2 max-w-[90%]">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-light flex items-center justify-center">
        <Car className="w-4 h-4 text-accent" />
      </div>

      {/* Message Content */}
      <div className="flex-1">
        <div className="bg-bg-secondary rounded-2xl rounded-tl-sm px-4 py-3 border border-white/10">
          <MarkdownContent content={displayContent} />

          {/* Suggestion Buttons - Only show for latest message */}
          {isLatest && options.length > 0 && (
            <SuggestionButtons
              options={options}
              onSelect={onSuggestionSelect}
              disabled={isLoading}
            />
          )}

          {/* Car Results */}
          {message.cars && message.cars.length > 0 && (
            <CarList cars={message.cars} />
          )}
        </div>
        <p className="text-xs text-text-secondary mt-1 ml-1">
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
