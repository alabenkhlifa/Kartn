'use client';

import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { Message } from '@/types';
import { t } from '@/lib/i18n';
import { useLanguage } from '@/contexts/LanguageContext';

function isRTLContent(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

interface UserMessageProps {
  message: Message;
  onRetry?: () => void;
}

export default function UserMessage({ message, onRetry }: UserMessageProps) {
  const { language } = useLanguage();
  const isRTL = isRTLContent(message.content);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <motion.div
      className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="max-w-[80%]">
        <div className={`px-4 py-2.5 ${
          isRTL ? 'rounded-2xl rounded-tl-sm' : 'rounded-2xl rounded-tr-sm'
        } ${
          message.error
            ? 'bg-gradient-to-r from-red-500/80 to-red-600/80 text-white'
            : 'bg-gradient-to-r from-[#2D8CFF] to-[#1A6FD4] text-white'
        }`} dir={isRTL ? 'rtl' : 'ltr'}>
          <p className="text-[15px] whitespace-pre-wrap">{message.content}</p>
          {/* Timestamp inside bubble */}
          <p className="text-[10px] text-white/50 mt-1.5 text-right">
            {formatTime(message.timestamp)}
          </p>
          {message.error && (
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] text-red-400">{t('retry.failed', language)}</span>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center gap-1 text-[11px] text-accent hover:text-accent-hover transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  {t('retry.button', language)}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
