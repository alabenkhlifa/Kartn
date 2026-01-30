'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface InputAreaProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function InputArea({ onSend, disabled = false }: InputAreaProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex-shrink-0 border-t border-white/10 bg-bg-primary safe-area-bottom">
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-center gap-3">
          {/* Input Field */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écrivez votre message..."
              disabled={disabled}
              className="w-full px-4 py-3 rounded-xl bg-bg-elevated border border-white/10
                       text-text-primary placeholder:text-text-secondary/60
                       focus:outline-none focus:border-accent/50
                       transition-colors text-[15px]
                       disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-accent text-bg-primary
                     flex items-center justify-center
                     hover:bg-accent-hover active:opacity-90
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
