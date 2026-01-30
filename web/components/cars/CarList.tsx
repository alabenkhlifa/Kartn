'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ScoredCarResult } from '@/types';
import CarCard from './CarCard';

interface CarListProps {
  cars: ScoredCarResult[];
}

export default function CarList({ cars }: CarListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (cars.length === 0) return null;

  return (
    <div className="relative mt-4">
      {/* Scroll Buttons - Hidden on mobile, shown on desktop */}
      {cars.length > 1 && (
        <>
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10
                       w-10 h-10 items-center justify-center rounded-full
                       bg-bg-secondary border border-white/10
                       text-text-primary hover:bg-bg-elevated
                       transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10
                       w-10 h-10 items-center justify-center rounded-full
                       bg-bg-secondary border border-white/10
                       text-text-primary hover:bg-bg-elevated
                       transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory
                   scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {cars.map((car, index) => (
          <div key={car.id} className="snap-start">
            <CarCard car={car} index={index} />
          </div>
        ))}
      </div>

      {/* Scroll Indicator Dots */}
      {cars.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {cars.map((_, index) => (
            <div
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                index === 0 ? 'bg-accent' : 'bg-text-secondary/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
