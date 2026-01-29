import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ALL_SOURCES, fetchCsv, SOURCE_CONFIGS } from './fetcher.ts';
import { parseCsv } from './parser.ts';
import {
  transformAutoScout24Row,
  transformAutomobileTnNewRow,
  transformAutomobileTnUsedRow,
} from './transformer.ts';
import {
  AutomobileTnNewRow,
  AutomobileTnUsedRow,
  AutoScout24Row,
  CarRecord,
  IngestRequest,
  IngestResponse,
  SourceKey,
  SourceResult,
} from './types.ts';

const BATCH_SIZE = 500;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse request body
    const body: IngestRequest = await req.json().catch(() => ({}));
    const sourcesToIngest: SourceKey[] =
      body.sources === 'all' || !body.sources ? ALL_SOURCES : body.sources;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const results: Record<SourceKey, SourceResult> = {} as Record<SourceKey, SourceResult>;
    let totalProcessed = 0;
    let totalErrors = 0;

    // Process each source
    for (const sourceKey of sourcesToIngest) {
      console.log(`Processing source: ${sourceKey}`);
      const config = SOURCE_CONFIGS[sourceKey];

      try {
        // Fetch CSV
        const csvContent = await fetchCsv(sourceKey);

        // Parse and transform based on source type
        let records: CarRecord[] = [];

        if (sourceKey.startsWith('autoscout24')) {
          const rows = parseCsv<AutoScout24Row>(csvContent);
          records = rows
            .map((row) => transformAutoScout24Row(row, config))
            .filter((r): r is CarRecord => r !== null);
        } else if (sourceKey === 'automobile_tn_new') {
          const rows = parseCsv<AutomobileTnNewRow>(csvContent);
          records = rows
            .map((row) => transformAutomobileTnNewRow(row, config))
            .filter((r): r is CarRecord => r !== null);
        } else if (sourceKey === 'automobile_tn_used') {
          const rows = parseCsv<AutomobileTnUsedRow>(csvContent);
          records = rows
            .map((row) => transformAutomobileTnUsedRow(row, config))
            .filter((r): r is CarRecord => r !== null);
        }

        console.log(`Parsed ${records.length} records from ${sourceKey}`);

        // Batch upsert
        let inserted = 0;
        let updated = 0;
        let errors = 0;

        for (let i = 0; i < records.length; i += BATCH_SIZE) {
          const batch = records.slice(i, i + BATCH_SIZE);

          const { data, error } = await supabase
            .from('cars')
            .upsert(batch, {
              onConflict: 'source,url',
              ignoreDuplicates: false,
            })
            .select('id');

          if (error) {
            console.error(`Batch error for ${sourceKey}:`, error);
            errors += batch.length;
          } else {
            // Count inserts vs updates (approximation - upsert doesn't distinguish)
            inserted += data?.length || 0;
          }
        }

        results[sourceKey] = { inserted, updated, errors };
        totalProcessed += inserted + updated;
        totalErrors += errors;

        console.log(`Completed ${sourceKey}: ${inserted} inserted, ${errors} errors`);
      } catch (error) {
        console.error(`Failed to process ${sourceKey}:`, error);
        results[sourceKey] = { inserted: 0, updated: 0, errors: 1 };
        totalErrors++;
      }
    }

    const response: IngestResponse = {
      success: totalErrors === 0,
      results,
      totalProcessed,
      totalErrors,
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Ingestion error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
