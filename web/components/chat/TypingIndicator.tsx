'use client';

import { Car } from 'lucide-react';

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-2">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-light flex items-center justify-center">
        <Car className="w-4 h-4 text-accent" />
      </div>
      <div className="bg-bg-secondary rounded-2xl rounded-tl-sm px-4 py-3 border border-white/10">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-accent animate-pulse"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
