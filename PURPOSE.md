# KarTN - Project Purpose & Context

## Vision

We are developing "KarTN," an intelligent chatbot designed to help Tunisian families navigate the complex landscape of
car purchasing and importing decisions.

## Problem Statement

The project addresses a critical need in Tunisia's automotive market, where families must choose between multiple
acquisition pathways including:

- FCR (Franchise de Change pour les Résidents) programs for importing used cars
- Local purchase options
- Government subsidy programs like "Une Voiture pour Chaque Famille" and "Voiture Populaire"

## Solution

The chatbot serves as a comprehensive decision-support system that combines:

- Deep knowledge of Tunisian automotive regulations, tax structures, import procedures, and financing options
- Real-time market data from platforms like automobile.tn and autoscout24.de

## Success Metrics

Measured by the system's ability to provide personalized, accurate recommendations that account for:

- Users residency status
- Income levels
- Eligibility for various programs
- Budget constraints
- Tunisia's complex regulatory environment

## Target Users

- Tunisian families domestically
- TRE (Tunisians Residing Abroad)

## Key Features

- Multilingual support: French, Arabic, and Tunisian Derja
- Cultural nuances handling

## Constraints

- Tunisia's foreign currency restrictions
- SMIG-based income thresholds for program eligibility
- Rapidly evolving regulations (e.g., 2026 electric vehicle incentives)

---

# KarTN Implementation Plan

## Architecture Overview

```
GitHub Actions (Scraping) → Public JSON/CSV → Supabase Edge Functions → PostgreSQL + pgvector
                                                      ↓
                                              Groq API (Llama 3.3 70B)
                                                      ↓
                                              Vercel Frontend (Chat UI)
```

---

## Stack

| Component     | Technology                                                  | Cost      |
|---------------|-------------------------------------------------------------|-----------|
| Scraping      | GitHub Actions + Crawl4AI                                   | Free      |
| Database      | Supabase PostgreSQL + pgvector                              | Free tier |
| Orchestration | Supabase Edge Functions (TypeScript)                        | Free tier |
| Embeddings    | paraphrase-multilingual-MiniLM-L12-v2 (via HuggingFace API) | Free      |
| LLM           | Groq API (Llama 3.3 70B)                                    | Free tier |
| Frontend      | Vercel                                                      | Free tier |

---

## Phase 1: Data Pipeline

### 1.1 Web Scraping (GitHub Actions) ✓

- [x] Implement scrapers for automobile.tn and autoscout24.de for new/used cars
- [x] Output: Public CSV files in GitHub repo (by market, max 500 lines each)
- [x] Schedule: Daily cron job via GitHub Actions

### 1.2 Data Ingestion (Supabase Edge Function) ✓

- [x] Create Edge Function `ingest-cars`
- [x] Fetch CSVs from GitHub raw URL
- [x] Parse and validate data
- [x] Batch upsert to `cars` table (500 rows/batch)
- [ ] Trigger: Webhook after GitHub Action completes or scheduled

---

## Phase 2: Knowledge Base Setup ✓

### 2.1 Document Processing

- [x] Chunk 17 knowledge documents (500-800 tokens each)
- [x] Preserve metadata (source, section, subsection, topic)
- [x] Categories:
    - FCR eligibility rules
    - Tax calculation procedures
    - Financing options
    - EV incentives (2026 law)
    - Parts availability guidelines
    - Import procedures
    - Insurance
    - Market info

### 2.2 Vector Storage

- [x] Enable pgvector extension in Supabase
- [x] Create `knowledge_chunks` table with IVFFlat index
- [x] Create `match_knowledge_chunks()` similarity search function
- [x] Create Edge Function `ingest-knowledge` for embedding generation
- [x] HuggingFace API integration (paraphrase-multilingual-MiniLM-L12-v2)

---

## Phase 3: Orchestration Layer

### 3.1 Chat Endpoint (Supabase Edge Function)

- [ ] Create Edge Function `chat`
- [ ] System prompt with:
    - **Topic restrictions**: Only respond to car purchasing, importing, FCR, taxes, financing, government programs, EV incentives, insurance, registration, running costs
    - **Language mirroring**: Respond in user's language (French, Arabic, or Derja)
    - **Off-topic handling**: Politely redirect to in-scope topics
- [ ] Flow:
    1. Receive user query
    2. Generate query embedding (HuggingFace API)
    3. Vector search on `knowledge_chunks`
    4. SQL query on `cars` table (if vehicle search needed)
    5. Construct prompt with retrieved context
    6. Call Groq API (Llama 3.3 70B)
    7. Return response

### 3.2 Query Classification (Two-Stage LLM)

- [ ] **Stage 1: Fast Classification** (Llama 3.1 8B via Groq)
    - Detect intent: `eligibility`, `car_search`, `cost_calculation`, `general_info`, `off_topic`
    - Detect language: `french`, `arabic`, `derja`
    - Extract filters (budget, fuel type, year, etc.) if car search
- [ ] **Stage 2: Route to retrieval strategy**
    - `off_topic` → Return polite redirect (skip retrieval + generation)
    - `eligibility` → Knowledge base only
    - `car_search` → SQL + Knowledge base
    - `cost_calculation` → Calculation engine + Knowledge base
    - `general_info` → Knowledge base only
- **Mixed Query Handling**: Multi-step pipeline approach
    1. Extract eligibility info from query
    2. Search cars based on filters
    3. Combine results for LLM response (Llama 3.3 70B)

### 3.3 Calculation Engine

- [ ] Implement tax calculation logic (5-layer structure)
- [ ] EUR-to-TND conversion with buffer
- [ ] FCR savings calculator
- [ ] Total cost of ownership estimator

---

## Phase 4: Frontend

### 4.1 Chat Interface (Vercel)

- [ ] Simple chat UI (React/Next.js)
- [ ] Multilingual support: French, Arabic, Tunisian Dialect (Derja)
    - **Language mirroring**: Respond in the same language the user writes in (Derja → Derja, French → French, Arabic →
      Arabic)
- [ ] Display car recommendations with images
- [ ] Show cost breakdowns in tables

### 4.2 User Flow

- [ ] Welcome message with language selection
- [ ] Guided eligibility questionnaire
- [ ] Free-form chat after initial assessment
- [ ] Save/share results functionality

---

## Phase 5: Testing & Refinement

### 5.1 Scenario Testing

- [ ] FCR-eligible TRE user (Germany, 5-year residency)
- [ ] Resident family (first-time FCR)
- [ ] "Voiture Populaire" eligible user
- [ ] EV buyer (2026 incentives)
- [ ] Budget-constrained user needing financing

### 5.2 RAG Optimization

- [ ] Tune chunk sizes
- [ ] Adjust retrieval top-k
- [ ] Test hybrid search (keyword + semantic)
- [ ] Evaluate response accuracy

---

## Database Schema

### `cars` table

```sql
CREATE TABLE cars
(
    id           SERIAL PRIMARY KEY,
    source       VARCHAR(50), -- automobile.tn, mobile.de, etc.
    brand        VARCHAR(100),
    model        VARCHAR(100),
    trim         VARCHAR(255),
    year         INTEGER,
    price_eur    DECIMAL,
    price_tnd    DECIMAL,
    mileage      INTEGER,
    fuel_type    VARCHAR(50),
    transmission VARCHAR(50),
    url          TEXT,
    image_url    TEXT,
    scraped_at   TIMESTAMP,
    UNIQUE (source, url)
);
```

### `knowledge_chunks` table

(see Phase 2.2)

### `conversations` table (optional, for history)

```sql
CREATE TABLE conversations
(
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    messages     JSONB,
    user_context JSONB, -- eligibility status, preferences
    created_at   TIMESTAMP        DEFAULT NOW()
);
```

---

## API Endpoints

| Endpoint          | Method | Description                |
|-------------------|--------|----------------------------|
| `/chat`           | POST   | Main chat endpoint         |
| `/ingest-cars`    | POST   | Trigger car data ingestion |
| `/calculate-cost` | POST   | Standalone cost calculator |

---

## Risks & Mitigations

| Risk                          | Mitigation                                   |
|-------------------------------|----------------------------------------------|
| European sites block scraping | Use proxies or fallback to manual data entry |
| Groq rate limits              | Cache frequent queries, fallback to Mixtral  |
| Edge Function timeouts        | Batch operations, optimize queries           |
| Embedding API limits          | Self-host MiniLM or use cached embeddings    |