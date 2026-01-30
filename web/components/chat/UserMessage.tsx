'use client';

import { Message } from '@/types';

interface UserMessageProps {
  message: Message;
}

export default function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] px-4 py-2.5 rounded-2xl bg-bg-elevated text-text-primary">
        <p className="text-[15px] whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
