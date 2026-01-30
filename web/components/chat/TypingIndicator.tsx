'use client';

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-md bg-accent flex items-center justify-center">
        <span className="text-xs font-bold text-bg-primary">K</span>
      </div>
      <div className="flex items-center gap-1.5 pt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-text-secondary animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
