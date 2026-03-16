/**
 * All Flow Specifications Index
 */

import type { FlowSpec } from './types.ts';

// Car Search flows
import {
  carSearchTunisiaFlow,
  carSearchTunisiaNewFlow,
} from './car-search-tunisia.flow.ts';

import {
  carSearchImportTREFlow,
  carSearchImportTREElectricFlow,
} from './car-search-import-tre.flow.ts';

import {
  carSearchImportFCRFlow,
  carSearchImportNoFCRFlow,
} from './car-search-import-fcr.flow.ts';

// Cost calculator
import { costCalculatorFlow } from './cost-calculator.flow.ts';

// Procedure info
import {
  procedureFCRTREFlow,
  procedureFCRFamilleFlow,
  procedureToCarSearchFlow,
} from './procedure-info.flow.ts';

// EV info
import {
  evHybridVsEvFlow,
  evLawFlow,
  evChargingStationsFlow,
  evSolarPanelsFlow,
  evToCarSearchFlow,
} from './ev-info.flow.ts';

// Popular cars
import {
  popularCarsEligibilityFlow,
  popularCarsNotEligibleFlow,
  popularCarsModelsFlow,
  popularCarsToSearchFlow,
} from './popular-cars.flow.ts';

/**
 * All available flow specifications
 */
export const ALL_FLOWS: FlowSpec[] = [
  // Core car search flows
  carSearchTunisiaFlow,
  carSearchTunisiaNewFlow,
  carSearchImportTREFlow,
  carSearchImportTREElectricFlow,
  carSearchImportFCRFlow,
  carSearchImportNoFCRFlow,

  // Cost calculator
  costCalculatorFlow,

  // Procedure info
  procedureFCRTREFlow,
  procedureFCRFamilleFlow,
  procedureToCarSearchFlow,

  // EV info (4 topics)
  evHybridVsEvFlow,
  evLawFlow,
  evChargingStationsFlow,
  evSolarPanelsFlow,
  evToCarSearchFlow,

  // Popular cars
  popularCarsEligibilityFlow,
  popularCarsNotEligibleFlow,
  popularCarsModelsFlow,
  popularCarsToSearchFlow,
];

/**
 * Core flows (minimum required for validation)
 */
export const CORE_FLOWS: FlowSpec[] = ALL_FLOWS.filter((f) =>
  f.tags.includes('core')
);

/**
 * Get flows by tag
 */
export function getFlowsByTag(tag: string): FlowSpec[] {
  return ALL_FLOWS.filter((f) => f.tags.includes(tag));
}

/**
 * Get flow by ID
 */
export function getFlowById(id: string): FlowSpec | undefined {
  return ALL_FLOWS.find((f) => f.id === id);
}

/**
 * Get all unique tags
 */
export function getAllTags(): string[] {
  const tags = new Set<string>();
  for (const flow of ALL_FLOWS) {
    for (const tag of flow.tags) {
      tags.add(tag);
    }
  }
  return Array.from(tags).sort();
}

// Re-export individual flows for direct import
export {
  carSearchTunisiaFlow,
  carSearchTunisiaNewFlow,
  carSearchImportTREFlow,
  carSearchImportTREElectricFlow,
  carSearchImportFCRFlow,
  carSearchImportNoFCRFlow,
  costCalculatorFlow,
  procedureFCRTREFlow,
  procedureFCRFamilleFlow,
  procedureToCarSearchFlow,
  evHybridVsEvFlow,
  evLawFlow,
  evChargingStationsFlow,
  evSolarPanelsFlow,
  evToCarSearchFlow,
  popularCarsEligibilityFlow,
  popularCarsNotEligibleFlow,
  popularCarsModelsFlow,
  popularCarsToSearchFlow,
};

// Re-export helpers
export * from './helpers.ts';
