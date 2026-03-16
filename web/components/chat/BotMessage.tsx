'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Message, ParsedOption } from '@/types';
import { parseNumberedOptions, extractMainMessage } from '@/lib/parser';
import SuggestionButtons from '@/components/suggestions/SuggestionButtons';
import CarList from '@/components/cars/CarList';
import MarkdownContent from '@/components/markdown/MarkdownContent';
import { sendFeedback } from '@/lib/api';

function isRTLContent(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

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
  const [feedbackGiven, setFeedbackGiven] = useState<-1 | 1 | null>(null);

  const isRTL = isRTLContent(message.content);

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

  const handleFeedback = async (rating: -1 | 1) => {
    if (!message.message_id || feedbackGiven !== null) return;
    setFeedbackGiven(rating);
    try {
      await sendFeedback(message.message_id, rating);
    } catch (err) {
      console.error('Failed to send feedback:', err);
      setFeedbackGiven(null);
    }
  };

  return (
    <motion.div
      className="flex items-start gap-2.5 max-w-[90%]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* K Logo Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent to-[#1A6FD4] flex items-center justify-center ring-2 ring-accent/20">
        <span className="text-sm font-bold text-white">K</span>
      </div>

      {/* Message Content */}
      <div className="flex-1">
        <div className={`backdrop-blur-xl bg-[var(--bg-surface)]/80 px-4 py-3 border border-[var(--border-subtle)] ${
          isRTL ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm'
        }`}>
          <div dir={isRTL ? 'rtl' : 'ltr'}>
            <MarkdownContent content={displayContent} />
          </div>

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

          {/* Follow-up Suggestions */}
          {isLatest && message.suggestions && message.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--border-subtle)]">
              {message.suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestionSelect({ number: 0, text: suggestion })}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs rounded-lg bg-accent/5 border border-accent/20
                             text-accent hover:bg-accent/10 hover:border-accent/30
                             transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
                             text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Feedback buttons - only for LLM-generated messages */}
          {message.message_id && (
            <div className="flex items-center gap-1.5 mt-2">
              <button
                onClick={() => handleFeedback(1)}
                disabled={feedbackGiven !== null}
                className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md transition-colors ${
                  feedbackGiven === 1
                    ? 'text-success'
                    : 'text-text-secondary/40 hover:text-text-secondary'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleFeedback(-1)}
                disabled={feedbackGiven !== null}
                className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md transition-colors ${
                  feedbackGiven === -1
                    ? 'text-error'
                    : 'text-text-secondary/40 hover:text-text-secondary'
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Timestamp footer */}
          <p className="text-[10px] text-text-secondary/60 mt-2 text-right">
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
