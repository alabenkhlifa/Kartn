'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScoredCarResult } from '@/types';
import CarCard from './CarCard';

interface CarListProps {
  cars: ScoredCarResult[];
}

export default function CarList({ cars }: CarListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // IntersectionObserver for active dot indicators
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const cards = container.querySelectorAll('[data-car-card]');
    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-car-index'));
            if (!isNaN(index)) {
              setActiveIndex(index);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.6,
      }
    );

    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [cars]);

  // Hide swipe hint after first scroll
  const handleScroll = useCallback(() => {
    if (showSwipeHint) {
      setShowSwipeHint(false);
    }
  }, [showSwipeHint]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Also hide hint after timeout
  useEffect(() => {
    const timer = setTimeout(() => setShowSwipeHint(false), 4000);
    return () => clearTimeout(timer);
  }, []);

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
                       bg-[var(--bg-secondary)] border border-[var(--border-medium)]
                       text-text-primary hover:bg-accent-light hover:text-accent hover:border-accent/30
                       transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10
                       w-10 h-10 items-center justify-center rounded-full
                       bg-[var(--bg-secondary)] border border-[var(--border-medium)]
                       text-text-primary hover:bg-accent-light hover:text-accent hover:border-accent/30
                       transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Cards Container - Vertical on mobile, horizontal scroll on desktop */}
      <div
        ref={scrollRef}
        className="flex flex-col md:flex-row gap-4 md:overflow-x-auto pb-4 md:-mx-4 md:px-4
                   md:snap-x md:snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {cars.map((car, index) => (
          <div
            key={car.id}
            data-car-card
            data-car-index={index}
            className="md:snap-start md:flex-shrink-0"
          >
            <CarCard car={car} index={index} />
          </div>
        ))}
      </div>

      {/* Swipe hint (mobile only) */}
      <AnimatePresence>
        {showSwipeHint && cars.length > 1 && (
          <motion.p
            className="text-xs text-text-secondary text-center mt-1 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            Glissez pour voir plus
          </motion.p>
        )}
      </AnimatePresence>

      {/* Active Dot Indicators */}
      {cars.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {cars.map((_, index) => (
            <div
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                index === activeIndex ? 'bg-accent w-4' : 'bg-text-secondary/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
