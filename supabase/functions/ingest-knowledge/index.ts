import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ALL_DOCUMENTS, DOCUMENT_TOPICS, KB_BASE_URL } from './config.ts';
import { processDocument } from './chunker.ts';
import { generateEmbeddings } from './embeddings.ts';
import {
  IngestRequest,
  IngestResponse,
  KnowledgeChunk,
  SourceResult,
} from './types.ts';

const BATCH_SIZE = 50;

/**
 * Fetch document content from GitHub
 */
async function fetchDocument(filename: string): Promise<string> {
  const url = `${KB_BASE_URL}/${filename}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${filename}: ${response.status}`);
  }

  return response.text();
}

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
    const sourcesToIngest: string[] =
      body.sources === 'all' || !body.sources ? ALL_DOCUMENTS : body.sources;

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const huggingfaceKey = Deno.env.get('HUGGINGFACE_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    if (!huggingfaceKey) {
      throw new Error('Missing HUGGINGFACE_API_KEY environment variable');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const results: Record<string, SourceResult> = {};
    let totalChunks = 0;
    let totalErrors = 0;

    // Process each document
    for (const filename of sourcesToIngest) {
      console.log(`Processing document: ${filename}`);

      const topic = DOCUMENT_TOPICS[filename];
      if (!topic) {
        console.warn(`No topic mapping for ${filename}, skipping`);
        results[filename] = { chunks: 0, errors: 1 };
        totalErrors++;
        continue;
      }

      try {
        // Fetch document content
        const content = await fetchDocument(filename);
        console.log(`Fetched ${filename}: ${content.length} characters`);

        // Process into chunks
        const chunks = processDocument(filename, content, topic);
        console.log(`Created ${chunks.length} chunks from ${filename}`);

        // Generate embeddings
        const chunksWithEmbeddings = await generateEmbeddings(
          chunks,
          huggingfaceKey
        );

        // Count chunks without embeddings as errors
        const failedEmbeddings = chunksWithEmbeddings.filter(
          (c) => !c.embedding
        ).length;

        // Delete existing chunks for this source (for idempotent ingestion)
        const { error: deleteError } = await supabase
          .from('knowledge_chunks')
          .delete()
          .eq('source', filename);

        if (deleteError) {
          console.error(`Error deleting old chunks for ${filename}:`, deleteError);
        }

        // Batch upsert chunks
        let inserted = 0;
        let errors = failedEmbeddings;

        for (let i = 0; i < chunksWithEmbeddings.length; i += BATCH_SIZE) {
          const batch = chunksWithEmbeddings.slice(i, i + BATCH_SIZE);

          // Format for Supabase (convert embedding array to pgvector format)
          const records = batch.map((chunk) => ({
            id: chunk.id,
            content: chunk.content,
            source: chunk.source,
            section: chunk.section,
            subsection: chunk.subsection,
            topic: chunk.topic,
            chunk_index: chunk.chunk_index,
            embedding: chunk.embedding
              ? `[${chunk.embedding.join(',')}]`
              : null,
          }));

          const { data, error } = await supabase
            .from('knowledge_chunks')
            .upsert(records, { onConflict: 'id' })
            .select('id');

          if (error) {
            console.error(`Batch insert error for ${filename}:`, error);
            errors += batch.length;
          } else {
            inserted += data?.length || 0;
          }
        }

        results[filename] = { chunks: inserted, errors };
        totalChunks += inserted;
        totalErrors += errors;

        console.log(
          `Completed ${filename}: ${inserted} chunks inserted, ${errors} errors`
        );
      } catch (error) {
        console.error(`Failed to process ${filename}:`, error);
        results[filename] = { chunks: 0, errors: 1 };
        totalErrors++;
      }
    }

    const response: IngestResponse = {
      success: totalErrors === 0,
      results,
      totalChunks,
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
