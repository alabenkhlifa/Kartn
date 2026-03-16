'use client';

import { motion } from 'framer-motion';
import { ParsedOption } from '@/types';

interface SuggestionButtonsProps {
  options: ParsedOption[];
  onSelect: (option: ParsedOption) => void;
  disabled?: boolean;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
};

export default function SuggestionButtons({
  options,
  onSelect,
  disabled = false,
}: SuggestionButtonsProps) {
  if (options.length === 0) return null;

  const useGrid = options.length >= 3;

  return (
    <motion.div
      className={
        useGrid
          ? 'grid grid-cols-2 gap-2 mt-3'
          : 'flex flex-wrap gap-2 mt-3'
      }
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      role="group"
      aria-label="Quick reply options"
    >
      {options.map((option, index) => (
        <motion.button
          key={`${option.number}-${index}`}
          onClick={() => onSelect(option)}
          disabled={disabled}
          variants={itemVariants}
          whileTap={{ scale: 0.97 }}
          aria-label={`Option ${option.number}: ${option.text}`}
          className="px-4 py-2.5 text-sm rounded-xl bg-[var(--bg-elevated)]/60 border border-[var(--border-subtle)]
                     text-text-primary backdrop-blur-sm
                     hover:border-accent/40 hover:bg-accent/10
                     transition-colors
                     disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed
                     text-left"
        >
          {option.emoji && <span className="mr-1.5">{option.emoji}</span>}
          {option.text}
        </motion.button>
      ))}
    </motion.div>
  );
}
