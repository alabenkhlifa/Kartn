'use client';

import { ParsedOption } from '@/types';

interface SuggestionButtonsProps {
  options: ParsedOption[];
  onSelect: (option: ParsedOption) => void;
  disabled?: boolean;
}

export default function SuggestionButtons({
  options,
  onSelect,
  disabled = false,
}: SuggestionButtonsProps) {
  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {options.map((option, index) => (
        <button
          key={`${option.number}-${index}`}
          onClick={() => onSelect(option)}
          disabled={disabled}
          className="px-3.5 py-2 text-sm rounded-full bg-bg-elevated border border-white/10
                     text-text-primary hover:bg-accent hover:text-white hover:border-accent
                     transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {option.emoji && <span className="mr-1.5">{option.emoji}</span>}
          {option.text}
        </button>
      ))}
    </div>
  );
}
