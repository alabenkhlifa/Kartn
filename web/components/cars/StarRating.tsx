'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  strength: 'excellent' | 'good' | 'fair' | 'poor';
}

export default function StarRating({ strength }: StarRatingProps) {
  const ratings = {
    excellent: { stars: 3, label: 'EXCELLENT' },
    good: { stars: 2, label: 'BON' },
    fair: { stars: 1, label: 'CORRECT' },
    poor: { stars: 0, label: '' },
  };

  const { stars, label } = ratings[strength];

  if (stars === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {Array.from({ length: stars }).map((_, i) => (
          <Star
            key={i}
            className="w-4 h-4 fill-accent text-accent"
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-accent tracking-wide">
        {label}
      </span>
    </div>
  );
}
