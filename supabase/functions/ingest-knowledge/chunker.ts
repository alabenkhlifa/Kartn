import { CHUNKING_CONFIG } from './config.ts';
import { ChunkMetadata, KnowledgeChunk } from './types.ts';

interface Section {
  h2: string | null;
  h3: string | null;
  content: string;
}

/**
 * Parse markdown into sections based on H2/H3 headers
 */
function parseMarkdownSections(markdown: string): Section[] {
  const lines = markdown.split('\n');
  const sections: Section[] = [];

  let currentH2: string | null = null;
  let currentH3: string | null = null;
  let currentContent: string[] = [];

  const flushSection = () => {
    const content = currentContent.join('\n').trim();
    if (content) {
      sections.push({
        h2: currentH2,
        h3: currentH3,
        content,
      });
    }
    currentContent = [];
  };

  for (const line of lines) {
    // Check for H2 (## Header)
    if (line.startsWith('## ')) {
      flushSection();
      currentH2 = line.slice(3).trim();
      currentH3 = null;
      continue;
    }

    // Check for H3 (### Header)
    if (line.startsWith('### ')) {
      flushSection();
      currentH3 = line.slice(4).trim();
      continue;
    }

    // Skip H1 headers (document title - will be included as source context)
    if (line.startsWith('# ')) {
      continue;
    }

    // Skip horizontal rules
    if (line.trim() === '---') {
      continue;
    }

    currentContent.push(line);
  }

  // Flush remaining content
  flushSection();

  return sections;
}

/**
 * Estimate token count (rough approximation)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHUNKING_CONFIG.charsPerToken);
}

/**
 * Split text into paragraphs, preserving code blocks and tables
 */
function splitIntoParagraphs(text: string): string[] {
  const paragraphs: string[] = [];
  let current = '';
  let inCodeBlock = false;
  let inTable = false;

  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track code blocks
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      current += line + '\n';
      continue;
    }

    // Track tables (lines starting with |)
    if (line.trim().startsWith('|')) {
      if (!inTable) {
        // Flush previous content before starting table
        if (current.trim() && !inCodeBlock) {
          paragraphs.push(current.trim());
          current = '';
        }
        inTable = true;
      }
      current += line + '\n';
      continue;
    } else if (inTable) {
      // End of table
      if (current.trim()) {
        paragraphs.push(current.trim());
        current = '';
      }
      inTable = false;
    }

    // Inside code block - keep accumulating
    if (inCodeBlock) {
      current += line + '\n';
      continue;
    }

    // Empty line marks paragraph boundary
    if (line.trim() === '') {
      if (current.trim()) {
        paragraphs.push(current.trim());
        current = '';
      }
      continue;
    }

    current += line + '\n';
  }

  // Flush remaining
  if (current.trim()) {
    paragraphs.push(current.trim());
  }

  return paragraphs;
}

/**
 * Create chunks from a section, respecting token limits
 */
function chunkSection(section: Section, metadata: ChunkMetadata): string[] {
  const { targetTokens, maxTokens, overlapTokens } = CHUNKING_CONFIG;

  // Build context prefix
  const contextParts: string[] = [`Source: ${metadata.source}`];
  if (section.h2) contextParts.push(`Section: ${section.h2}`);
  if (section.h3) contextParts.push(`Subsection: ${section.h3}`);
  const contextPrefix = contextParts.join(' | ') + '\n\n';
  const contextTokens = estimateTokens(contextPrefix);

  const availableTokens = targetTokens - contextTokens;
  const paragraphs = splitIntoParagraphs(section.content);

  const chunks: string[] = [];
  let currentChunk = '';
  let currentTokens = 0;

  for (const paragraph of paragraphs) {
    const paragraphTokens = estimateTokens(paragraph);

    // If single paragraph exceeds max, we need to split it
    if (paragraphTokens > maxTokens - contextTokens) {
      // Flush current chunk first
      if (currentChunk.trim()) {
        chunks.push(contextPrefix + currentChunk.trim());
      }

      // Split large paragraph by sentences (rough split)
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      currentChunk = '';
      currentTokens = 0;

      for (const sentence of sentences) {
        const sentenceTokens = estimateTokens(sentence);
        if (currentTokens + sentenceTokens > availableTokens && currentChunk) {
          chunks.push(contextPrefix + currentChunk.trim());
          // Keep overlap
          const words = currentChunk.split(/\s+/);
          const overlapWords = Math.floor(
            (overlapTokens * CHUNKING_CONFIG.charsPerToken) / 5
          );
          currentChunk = words.slice(-overlapWords).join(' ') + ' ';
          currentTokens = estimateTokens(currentChunk);
        }
        currentChunk += sentence + ' ';
        currentTokens += sentenceTokens;
      }
      continue;
    }

    // Check if adding this paragraph would exceed target
    if (currentTokens + paragraphTokens > availableTokens && currentChunk) {
      chunks.push(contextPrefix + currentChunk.trim());

      // Start new chunk with overlap from previous
      const words = currentChunk.split(/\s+/);
      const overlapWords = Math.floor(
        (overlapTokens * CHUNKING_CONFIG.charsPerToken) / 5
      );
      currentChunk = words.slice(-overlapWords).join(' ') + '\n\n';
      currentTokens = estimateTokens(currentChunk);
    }

    currentChunk += paragraph + '\n\n';
    currentTokens += paragraphTokens;
  }

  // Flush remaining
  if (currentChunk.trim()) {
    chunks.push(contextPrefix + currentChunk.trim());
  }

  return chunks;
}

/**
 * Generate a deterministic chunk ID
 */
function generateChunkId(source: string, index: number): string {
  return `${source.replace('.md', '')}_chunk_${index.toString().padStart(3, '0')}`;
}

/**
 * Process a markdown document into knowledge chunks
 */
export function processDocument(
  filename: string,
  content: string,
  topic: string
): KnowledgeChunk[] {
  const sections = parseMarkdownSections(content);
  const chunks: KnowledgeChunk[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const metadata: ChunkMetadata = {
      source: filename,
      section: section.h2,
      subsection: section.h3,
      topic,
    };

    const textChunks = chunkSection(section, metadata);

    for (const text of textChunks) {
      chunks.push({
        id: generateChunkId(filename, chunkIndex),
        content: text,
        source: filename,
        section: section.h2,
        subsection: section.h3,
        topic,
        chunk_index: chunkIndex,
        embedding: null,
      });
      chunkIndex++;
    }
  }

  return chunks;
}
