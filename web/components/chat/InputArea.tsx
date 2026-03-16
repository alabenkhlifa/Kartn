'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { t } from '@/lib/i18n';
import { useLanguage } from '@/contexts/LanguageContext';

interface InputAreaProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function InputArea({ onSend, disabled = false }: InputAreaProps) {
  const [input, setInput] = useState('');
  const { language, isRTL } = useLanguage();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  return (
    <div className="flex-shrink-0 border-t border-[var(--border-medium)] bg-[var(--bg-secondary)] safe-area-bottom">
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-end gap-3" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Input Field */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={t('input.placeholder', language)}
              disabled={disabled}
              dir={isRTL ? 'rtl' : 'ltr'}
              rows={1}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]
                       text-text-primary placeholder:text-text-secondary
                       focus:outline-none focus:border-accent/50
                       focus:shadow-[0_0_0_3px_rgba(45,140,255,0.15)]
                       transition-all text-[15px]
                       disabled:opacity-50 disabled:cursor-not-allowed
                       resize-none overflow-hidden"
            />
          </div>

          {/* Send Button */}
          <motion.button
            type="submit"
            disabled={!input.trim() || disabled}
            whileTap={{ scale: 0.9 }}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-r from-accent to-[#1A6FD4] text-white
                     flex items-center justify-center
                     hover:from-accent-hover hover:to-[#155FBE] active:opacity-90
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-all"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </form>
    </div>
  );
}
