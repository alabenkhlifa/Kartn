'use client';

import { User } from 'lucide-react';
import { Message } from '@/types';

interface UserMessageProps {
  message: Message;
}

export default function UserMessage({ message }: UserMessageProps) {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="flex justify-end items-start gap-2">
      <div className="max-w-[80%]">
        <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm bg-accent text-white">
          <p className="text-[15px] whitespace-pre-wrap">{message.content}</p>
        </div>
        <p className="text-xs text-text-secondary mt-1 text-right">
          {formatTime(message.timestamp)}
        </p>
      </div>
      {/* User Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center">
        <User className="w-4 h-4 text-text-secondary" />
      </div>
    </div>
  );
}
