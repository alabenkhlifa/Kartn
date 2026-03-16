'use client';

import { motion } from 'framer-motion';

export default function TypingIndicator() {
  return (
    <motion.div
      className="flex items-start gap-2.5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      role="status"
      aria-live="assertive"
      aria-label="Assistant is typing"
    >
      {/* K Logo Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent to-[#1A6FD4] flex items-center justify-center ring-2 ring-accent/20">
        <span className="text-sm font-bold text-white">K</span>
      </div>
      <div className="backdrop-blur-xl bg-[var(--bg-surface)]/80 rounded-2xl rounded-tl-sm px-4 py-3 border border-[var(--border-subtle)]">
        <div className="flex items-center gap-1.5 h-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-accent typing-dot"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
