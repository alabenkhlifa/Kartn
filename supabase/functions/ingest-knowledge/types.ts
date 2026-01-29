export interface KnowledgeChunk {
  id: string;
  content: string;
  source: string;
  section: string | null;
  subsection: string | null;
  topic: string;
  chunk_index: number;
  embedding: number[] | null;
}

export interface ParsedSection {
  level: number; // 1 = h1, 2 = h2, 3 = h3
  title: string;
  content: string;
}

export interface ChunkMetadata {
  source: string;
  section: string | null;
  subsection: string | null;
  topic: string;
}

export interface IngestRequest {
  sources?: string[] | 'all';
  regenerateEmbeddings?: boolean;
}

export interface IngestResponse {
  success: boolean;
  results: Record<string, SourceResult>;
  totalChunks: number;
  totalErrors: number;
}

export interface SourceResult {
  chunks: number;
  errors: number;
}

export interface EmbeddingResponse {
  embeddings: number[][];
}
