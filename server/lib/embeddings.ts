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

/** Search the knowledge base for chunks semantically similar to a query */
export async function searchDocuments(
  query: string,
  sources: string[],
  matchCount = 6,
): Promise<DocumentRow[]> {
  const embedding = await embedText(query);

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_count: matchCount,
    filter_sources: sources.length > 0 ? sources : null,
  });

  if (error) throw new Error(`Supabase search error: ${error.message}`);
  return (data as DocumentRow[]) ?? [];
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
