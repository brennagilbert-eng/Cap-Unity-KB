import { openai, EMBEDDING_MODEL } from './openai.js';
import { supabase, type DocumentRow } from './supabase.js';

/** Embed a string using OpenAI text-embedding-3-small */
export async function embedText(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000), // stay well under token limit
  });
  return res.data[0].embedding;
}

/**
 * Recency multiplier: boosts docs updated recently.
 * Brand-new doc (+15%), 30 days (~10%), 90 days (~5%), 180+ days (~1%).
 * Uses exponential decay: bonus = 0.15 * exp(-days / 90)
 */
function recencyMultiplier(updatedAt?: string): number {
  if (!updatedAt) return 1;
  const days = (Date.now() - new Date(updatedAt).getTime()) / 86_400_000;
  return 1 + 0.15 * Math.exp(-days / 90);
}

/** Search the knowledge base for chunks semantically similar to a query.
 *  Fetches 2× candidates then re-ranks with a recency boost so recently
 *  updated docs surface above stale ones at the same similarity score.
 */
export async function searchDocuments(
  query: string,
  sources: string[],
  matchCount = 6,
): Promise<DocumentRow[]> {
  const embedding = await embedText(query);

  // Fetch extra candidates so re-ranking has room to work
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_count: matchCount * 2,
    filter_sources: sources.length > 0 ? sources : null,
  });

  if (error) throw new Error(`Supabase search error: ${error.message}`);

  const rows = (data as DocumentRow[]) ?? [];

  // Re-rank by similarity × recency multiplier, return top matchCount
  return rows
    .map((row) => ({
      ...row,
      _boosted: (row.similarity ?? 0) * recencyMultiplier(row.updated_at),
    }))
    .sort((a, b) => b._boosted - a._boosted)
    .slice(0, matchCount);
}

/** Upsert a document chunk into the knowledge base */
export async function upsertDocument(doc: {
  source: string;
  source_id: string;
  title: string;
  content: string;
  url: string;
  author?: string;
}): Promise<void> {
  const embedding = await embedText(`${doc.title}\n\n${doc.content}`);

  const { error } = await supabase.from('documents').upsert(
    {
      source: doc.source,
      source_id: doc.source_id,
      title: doc.title,
      content: doc.content,
      url: doc.url,
      author: doc.author ?? null,
      embedding,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'source_id' },
  );

  if (error) throw new Error(`Upsert error: ${error.message}`);
}
