'use client';

import { Message, ParsedOption } from '@/types';
import { parseNumberedOptions, extractMainMessage } from '@/lib/parser';
import SuggestionButtons from '@/components/suggestions/SuggestionButtons';
import CarList from '@/components/cars/CarList';

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

  return (
    <div className="flex items-start gap-3 max-w-[90%]">
      {/* Avatar */}
      <div className="flex-shrink-0 w-7 h-7 rounded-md bg-accent flex items-center justify-center">
        <span className="text-xs font-bold text-bg-primary">K</span>
      </div>

      {/* Message Content */}
      <div className="flex-1 pt-0.5">
        <p className="text-[15px] text-text-primary whitespace-pre-wrap leading-relaxed">
          {displayContent}
        </p>

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
    </div>
  );
}
