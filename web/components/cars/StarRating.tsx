'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  strength?: 'excellent' | 'good' | 'fair' | 'poor';
}

const strengthColors: Record<string, { star: string; text: string }> = {
  excellent: { star: 'fill-accent text-accent', text: 'text-accent' },
  good: { star: 'fill-emerald-500 text-emerald-500', text: 'text-emerald-500' },
  fair: { star: 'fill-amber-500 text-amber-500', text: 'text-amber-500' },
};

export default function StarRating({ strength }: StarRatingProps) {
  if (!strength) return null;

  const ratings = {
    excellent: { stars: 3, label: 'EXCELLENT' },
    good: { stars: 2, label: 'BON' },
    fair: { stars: 1, label: 'CORRECT' },
    poor: { stars: 0, label: '' },
  };

  const { stars, label } = ratings[strength];
  const colors = strengthColors[strength] || strengthColors.fair;

  if (stars === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {Array.from({ length: stars }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${colors.star}`}
          />
        ))}
      </div>
      <span className={`text-xs font-semibold tracking-wide ${colors.text}`}>
        {label}
      </span>
    </div>
  );
}
