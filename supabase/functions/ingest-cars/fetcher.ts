import { SourceConfig, SourceKey } from './types.ts';

const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/alabenkhlifa/automobile-tn-scrapper/main';

// Source configurations
export const SOURCE_CONFIGS: Record<SourceKey, SourceConfig> = {
  autoscout24_de: {
    key: 'autoscout24_de',
    filename: 'autoscout24_de.csv',
    country: 'DE',
    source: 'autoscout24',
  },
  autoscout24_fr: {
    key: 'autoscout24_fr',
    filename: 'autoscout24_fr.csv',
    country: 'FR',
    source: 'autoscout24',
  },
  autoscout24_it: {
    key: 'autoscout24_it',
    filename: 'autoscout24_it.csv',
    country: 'IT',
    source: 'autoscout24',
  },
  autoscout24_be: {
    key: 'autoscout24_be',
    filename: 'autoscout24_be.csv',
    country: 'BE',
    source: 'autoscout24',
  },
  automobile_tn_new: {
    key: 'automobile_tn_new',
    filename: 'automobile_tn_new_cars.csv',
    country: 'TN',
    source: 'automobile_tn_new',
  },
  automobile_tn_used: {
    key: 'automobile_tn_used',
    filename: 'automobile_tn_used_cars.csv',
    country: 'TN',
    source: 'automobile_tn_used',
  },
};

export const ALL_SOURCES: SourceKey[] = Object.keys(SOURCE_CONFIGS) as SourceKey[];

/**
 * Fetch CSV content from GitHub repository
 */
export async function fetchCsv(sourceKey: SourceKey): Promise<string> {
  const config = SOURCE_CONFIGS[sourceKey];
  if (!config) {
    throw new Error(`Unknown source: ${sourceKey}`);
  }

  const url = `${GITHUB_RAW_BASE}/${config.filename}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${sourceKey}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

/**
 * Fetch multiple CSVs in parallel
 */
export async function fetchMultipleCsvs(
  sourceKeys: SourceKey[]
): Promise<Map<SourceKey, string>> {
  const results = new Map<SourceKey, string>();

  const fetchPromises = sourceKeys.map(async (key) => {
    try {
      const content = await fetchCsv(key);
      return { key, content, error: null };
    } catch (error) {
      return { key, content: null, error };
    }
  });

  const settled = await Promise.all(fetchPromises);

  for (const result of settled) {
    if (result.content) {
      results.set(result.key, result.content);
    } else {
      console.error(`Failed to fetch ${result.key}:`, result.error);
    }
  }

  return results;
}
