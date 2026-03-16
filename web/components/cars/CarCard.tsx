'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Fuel, Gauge, Check, X, Bookmark } from 'lucide-react';
import { ScoredCarResult } from '@/types';
import { formatPrice, formatMileage } from '@/lib/parser';
import { t } from '@/lib/i18n';
import { useLanguage } from '@/contexts/LanguageContext';
import StarRating from './StarRating';

interface CarCardProps {
  car: ScoredCarResult;
  index: number;
  isFavorite?: boolean;
  onToggleFavorite?: (carId: string) => void;
}

const strengthGradients: Record<string, string> = {
  excellent: 'from-accent to-[#1A6FD4]',
  good: 'from-emerald-500 to-emerald-600',
  fair: 'from-amber-500 to-amber-600',
  poor: 'from-gray-500 to-gray-600',
};

export default function CarCard({ car, isFavorite, onToggleFavorite }: CarCardProps) {
  const { language } = useLanguage();

  // Always show price in TND - use estimated total for imports, or direct TND price for local cars
  const priceTnd = car.estimated_total_tnd
    ? formatPrice(car.estimated_total_tnd, 'TND')
    : car.price_tnd
      ? formatPrice(car.price_tnd, 'TND')
      : null;

  const mileage = formatMileage(car.mileage_km);

  const fcrStatus = car.fcr_tre_eligible
    ? { eligible: true, label: 'FCR TRE' }
    : car.fcr_famille_eligible
      ? { eligible: true, label: 'FCR Famille' }
      : { eligible: false, label: t('car.fcrNone', language) };

  const stripeGradient = strengthGradients[car.recommendation_strength || 'poor'] || strengthGradients.poor;

  return (
    <motion.div
      className="w-full md:min-w-[280px] md:max-w-[320px] rounded-xl overflow-hidden
                 backdrop-blur-md bg-[var(--bg-elevated)]/60 border border-[var(--border-subtle)]
                 hover:border-accent/30 transition-all"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      role="article"
      aria-label={`${car.brand} ${car.model} ${car.year}, ${priceTnd || 'price unavailable'}, ${car.fuel_type}, ${mileage}`}
    >
      {/* Top accent stripe */}
      <div className={`h-1 w-full bg-gradient-to-r ${stripeGradient}`} />

      <div className="p-4" dir="auto">
        {/* Header with Rating + Bookmark */}
        <div className="flex items-center justify-between mb-3">
          <StarRating strength={car.recommendation_strength} />
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(car.id)}
              className={`p-1.5 rounded-lg transition-colors ${
                isFavorite
                  ? 'text-accent bg-accent/10'
                  : 'text-text-secondary/40 hover:text-text-secondary hover:bg-[var(--bg-surface)]'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Car Name */}
        <h3 className="text-lg font-bold text-text-primary mb-1">
          {car.brand} {car.model} {car.variant && `(${car.variant})`}
        </h3>
        <p className="text-sm text-text-secondary mb-3">{car.year}</p>

        {/* Price */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl font-bold text-accent">
            {priceTnd ? `~${priceTnd}` : '?'}
          </span>
        </div>

        {/* Detail chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-text-secondary">
            <Fuel className="w-3.5 h-3.5" />
            <span className="capitalize">{car.fuel_type}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-text-secondary">
            <Gauge className="w-3.5 h-3.5" />
            <span>{mileage}</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-sm
            ${fcrStatus.eligible
              ? 'bg-success/10 border-success/20 text-success'
              : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-text-secondary'
            }`}>
            {fcrStatus.eligible ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <X className="w-3.5 h-3.5 text-error" />
            )}
            <span>{fcrStatus.label}</span>
          </div>
        </div>

        {/* View Listing Button - Gradient CTA */}
        <a
          href={car.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg
                     bg-gradient-to-r from-accent to-[#1A6FD4] text-white
                     hover:from-accent-hover hover:to-[#155FBE]
                     transition-all text-sm font-medium"
        >
          <span>{t('car.viewListing', language)}</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </motion.div>
  );
}
