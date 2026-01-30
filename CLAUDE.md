# Kartn - RAG Development Project

## Project Overview

This is a Retrieval-Augmented Generation (RAG) system built with TypeScript. The architecture is designed to be provider-agnostic, allowing flexibility in choosing LLM providers, vector databases, and embedding models.

## Project Structure

```
src/
├── ingestion/       # Document processing and chunking
├── embeddings/      # Embedding generation interfaces
├── retrieval/       # Vector search and retrieval logic
├── generation/      # LLM interaction and response generation
├── db/              # Database schemas and migrations
├── interfaces/      # Shared TypeScript interfaces
└── utils/           # Common utilities
```

## RAG Best Practices

### Chunking Strategy
- Use semantic chunking over fixed-size when document structure allows
- Maintain chunk overlap (10-20%) to preserve context at boundaries
- Include metadata with each chunk (source, position, section headers)
- Target chunk sizes: 256-512 tokens for most use cases

### Embedding Guidelines
- Abstract embedding providers behind a common interface
- Cache embeddings to avoid redundant API calls
- Batch embedding requests when processing multiple chunks
- Store embedding dimensions in config for easy model switching

### Retrieval Patterns
- Implement hybrid search (keyword + semantic) when possible
- Use reranking for improved relevance on top-k results
- Support metadata filtering before vector search
- Consider MMR (Maximal Marginal Relevance) to reduce redundancy

### Generation
- Keep retrieved context within model's effective context window
- Structure prompts with clear separation of context and query
- Implement streaming responses for better UX
- Add source attribution to generated responses

## TypeScript Conventions

### Strict Typing
- Enable `strict: true` in tsconfig
- Define explicit interfaces for all data structures
- Avoid `any` - use `unknown` with type guards when needed
- Use discriminated unions for state management

### Async Patterns
- Use async/await consistently
- Handle errors with try/catch at appropriate boundaries
- Implement proper cancellation for long-running operations
- Use `Promise.all` for independent concurrent operations

### Error Handling
- Create custom error classes for different failure modes
- Include context in error messages (document ID, chunk index, etc.)
- Log errors with structured metadata
- Implement graceful degradation where possible

## SQL Guidelines

### Migrations
- Use sequential numbered migrations: `001_initial.sql`, `002_add_index.sql`
- Each migration should be reversible when possible
- Include both `up` and `down` scripts
- Never modify existing migrations - create new ones

### Naming Conventions
- Tables: `snake_case`, plural (`documents`, `chunks`, `embeddings`)
- Columns: `snake_case` (`created_at`, `chunk_index`, `embedding_vector`)
- Indexes: `idx_{table}_{columns}` (`idx_chunks_document_id`)
- Foreign keys: `fk_{table}_{referenced_table}`

### Vector Storage
- Store vectors in appropriate column types for your DB
- Create HNSW or IVF indexes for similarity search
- Include metadata columns for filtering
- Partition large tables by document source or date

## Vector Database Patterns

### Provider-Agnostic Interface
```typescript
interface VectorStore {
  upsert(vectors: VectorRecord[]): Promise<void>;
  search(query: number[], options: SearchOptions): Promise<SearchResult[]>;
  delete(ids: string[]): Promise<void>;
}

interface VectorRecord {
  id: string;
  vector: number[];
  metadata: Record<string, unknown>;
}

interface SearchOptions {
  topK: number;
  filter?: MetadataFilter;
  includeMetadata?: boolean;
}
```

### Implementation Notes
- Implement adapters for each vector DB (Pinecone, Qdrant, pgvector, etc.)
- Use dependency injection for easy swapping
- Handle connection pooling and retries within adapters
- Normalize similarity scores across providers

## Testing Strategy

### Unit Tests
- Test chunking logic with various document types
- Mock embedding providers for deterministic tests
- Validate retrieval ranking algorithms
- Test prompt construction separately from LLM calls

### Integration Tests
- Test full ingestion pipeline with sample documents
- Verify end-to-end retrieval accuracy
- Test error recovery and retry logic
- Use test containers for database dependencies

### Test Data
- Maintain fixture documents in `tests/fixtures/`
- Use deterministic embeddings for retrieval tests
- Create golden datasets for regression testing

## Environment Variables

```
# LLM Provider
LLM_PROVIDER=          # openai, anthropic, etc.
LLM_API_KEY=
LLM_MODEL=

# Embedding Provider
EMBEDDING_PROVIDER=    # openai, cohere, local, etc.
EMBEDDING_API_KEY=
EMBEDDING_MODEL=

# Vector Database
VECTOR_DB_PROVIDER=    # pinecone, qdrant, pgvector, etc.
VECTOR_DB_URL=
VECTOR_DB_API_KEY=

# Primary Database
DATABASE_URL=
```

## Development Commands

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run with watch mode
npm run dev

# Build for production
npm run build

# Run migrations
npm run migrate

# Lint and format
npm run lint
npm run format

# Start chat edge function locally
npx supabase functions serve chat --env-file supabase/.env.local
```

## Chat Function Testing

See `TESTING.md` for full test commands. Quick reference:

```bash
# Single greeting test
curl -s 'http://127.0.0.1:54321/functions/v1/chat' \
  -H 'Content-Type: application/json' \
  -d '{"message": "Bonjour"}' | jq '.'

# Full wizard flow test
TESTING.md contains batch commands for all flows
```
