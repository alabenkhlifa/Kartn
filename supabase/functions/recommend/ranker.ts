import { CarListing, CarRecommendation, RecommendationFilters } from './types.ts';
import { calculateDetailedCost, checkFCREligibility } from './cost-calculator.ts';
import { scoreCar, matchesFilters, getTopRecommendations, ScoredCar } from './scoring.ts';

/**
 * Build car recommendations from scored cars
 */
export function buildRecommendations(
  scoredCars: ScoredCar[],
  filters: RecommendationFilters,
  includeCostBreakdown: boolean
): CarRecommendation[] {
  return scoredCars.map((car, index) => {
    const recommendation: CarRecommendation = {
      car: {
        id: car.id,
        brand: car.brand,
        model: car.model,
        variant: car.variant,
        year: car.year,
        price_eur: car.price_eur,
        price_tnd: car.price_tnd,
        fuel_type: car.fuel_type,
        engine_cc: car.engine_cc,
        mileage_km: car.mileage_km,
        body_type: car.body_type,
        country: car.country,
        source: car.source,
        url: car.url,
        seller_type: car.seller_type,
        fcr_tre_eligible: car.fcr_tre_eligible,
        fcr_famille_eligible: car.fcr_famille_eligible,
      },
      rank: index + 1,
      estimated_total_tnd: car.estimated_total_tnd,
      score: car.score,
      score_breakdown: car.score_breakdown,
      recommendation_strength: car.recommendation_strength,
    };

    // Include detailed cost breakdown if requested
    if (includeCostBreakdown && car.country !== 'TN' && car.price_eur) {
      recommendation.cost_breakdown = calculateDetailedCost(
        car,
        filters.fcr_regime as 'fcr_tre' | 'fcr_famille' | 'regime_commun' | undefined
      );
    }

    // Include FCR eligibility only for imported cars
    if (car.country !== 'TN') {
      const eligibility = checkFCREligibility(car.engine_cc, car.fuel_type, car.year);
      recommendation.fcr_eligible = {
        tre: eligibility.tre,
        famille: eligibility.famille,
      };
    }

    return recommendation;
  });
}

/**
 * Calculate estimated total TND for budget filtering
 * Uses simplified estimation for performance
 */
function getEstimatedTotalForBudgetFilter(car: CarListing, regime?: string): number {
  // Local Tunisian car - price is final
  if (car.country === 'TN' && car.price_tnd) {
    return car.price_tnd;
  }

  // Imported car - quick estimate
  if (car.price_eur) {
    const isFcrEligible = car.fcr_tre_eligible || car.fcr_famille_eligible ||
                          regime === 'fcr_tre' || regime === 'fcr_famille';
    const exchangeRate = 3.35 * 1.05; // With 5% buffer
    const cifTnd = car.price_eur * exchangeRate;

    if (isFcrEligible) {
      return Math.round(cifTnd * 1.25);
    }
    return Math.round(cifTnd * 2.5);
  }

  return car.price_tnd || 0;
}

/**
 * Apply filtering and multi-factor scoring pipeline
 */
export function filterAndRank(
  cars: CarListing[],
  filters: RecommendationFilters,
  options: {
    limit?: number;
    offset?: number;
    includeCostBreakdown?: boolean;
  } = {}
): { total: number; recommendations: CarRecommendation[] } {
  const { limit = 5, offset = 0, includeCostBreakdown = false } = options;

  // Step 1: Filter cars (respects 'any' values)
  const matchingCars = cars.filter((car) => matchesFilters(car, filters));

  // Step 2: Budget filtering (if provided)
  let budgetFilteredCars = matchingCars;
  if (filters.budget_tnd) {
    budgetFilteredCars = matchingCars.filter((car) => {
      const estimatedTotal = getEstimatedTotalForBudgetFilter(car, filters.fcr_regime);
      return estimatedTotal <= filters.budget_tnd!;
    });
  }

  // Step 3: Score each car using 7-factor system
  const scoredCars = budgetFilteredCars.map((car) => scoreCar(car, filters));

  // Step 4: Sort by score (highest first)
  scoredCars.sort((a, b) => b.score - a.score);

  // Step 5: Apply diversity (max 2 of same model)
  const diverseCars = getTopRecommendations(scoredCars, offset + limit);

  // Step 6: Paginate
  const paginatedCars = diverseCars.slice(offset, offset + limit);

  // Step 7: Build recommendations
  const recommendations = buildRecommendations(paginatedCars, filters, includeCostBreakdown);

  return {
    total: budgetFilteredCars.length,
    recommendations,
  };
}
