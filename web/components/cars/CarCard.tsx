'use client';

import { ExternalLink, Fuel, Gauge, Check, X } from 'lucide-react';
import { ScoredCarResult } from '@/types';
import { formatPrice, formatMileage } from '@/lib/parser';
import StarRating from './StarRating';

interface CarCardProps {
  car: ScoredCarResult;
  index: number;
}

export default function CarCard({ car }: CarCardProps) {
  const price = car.price_eur
    ? formatPrice(car.price_eur, 'EUR')
    : car.price_tnd
      ? formatPrice(car.price_tnd, 'TND')
      : '?';

  const totalTnd = formatPrice(car.estimated_total_tnd, 'TND');
  const mileage = formatMileage(car.mileage_km);

  const fcrStatus = car.fcr_tre_eligible
    ? { eligible: true, label: 'FCR TRE' }
    : car.fcr_famille_eligible
      ? { eligible: true, label: 'FCR Famille' }
      : { eligible: false, label: 'Non FCR' };

  return (
    <div
      className="min-w-[280px] max-w-[320px] p-4 rounded-xl bg-bg-secondary
                 border border-white/10 hover:border-white/20
                 transition-colors"
    >
      {/* Header with Rating */}
      <div className="mb-3">
        <StarRating strength={car.recommendation_strength} />
      </div>

      {/* Car Name */}
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        {car.brand} {car.model} {car.variant && `(${car.variant})`}
        <span className="text-text-secondary ml-2">({car.year})</span>
      </h3>

      {/* Price */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl font-bold text-accent">{price}</span>
        <span className="text-text-secondary">→</span>
        <span className="text-lg font-semibold text-text-primary">~{totalTnd}</span>
      </div>

      {/* Details */}
      <div className="flex flex-wrap gap-3 mb-3 text-sm text-text-secondary">
        <div className="flex items-center gap-1">
          <Fuel className="w-4 h-4" />
          <span className="capitalize">{car.fuel_type}</span>
        </div>
        <div className="flex items-center gap-1">
          <Gauge className="w-4 h-4" />
          <span>{mileage}</span>
        </div>
      </div>

      {/* FCR Status */}
      <div className={`flex items-center gap-1 text-sm mb-4 ${fcrStatus.eligible ? 'text-success' : 'text-text-secondary'}`}>
        {fcrStatus.eligible ? (
          <Check className="w-4 h-4" />
        ) : (
          <X className="w-4 h-4 text-error" />
        )}
        <span>{fcrStatus.label}</span>
      </div>

      {/* View Listing Button */}
      <a
        href={car.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg
                   bg-accent/10 border border-accent/30 text-accent
                   hover:bg-accent/20 hover:border-accent/50
                   transition-colors text-sm font-medium"
      >
        <span>Voir l&apos;annonce</span>
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}
