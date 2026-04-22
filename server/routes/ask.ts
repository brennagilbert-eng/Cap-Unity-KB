import { Router } from 'express';
import { searchDocuments } from '../lib/embeddings.js';
import { openai, CHAT_MODEL } from '../lib/openai.js';
import type { DocumentRow } from '../lib/supabase.js';

export const askRouter = Router();

askRouter.post('/', async (req, res) => {
  const { question, sources } = req.body as { question?: string; sources?: string[] };

  if (!question?.trim()) {
    return res.status(400).json({ error: 'question is required' });
  }

  const activeSources: string[] = Array.isArray(sources) ? sources : [];

  try {
    // 1. Retrieve relevant chunks
    const docs: DocumentRow[] = await searchDocuments(question, activeSources, 6);

    if (docs.length === 0) {
      return res.json({
        answer:
          "I couldn't find anything relevant in the indexed knowledge base for that question. Try enabling more sources or rephrasing.",
        citations: [],
      });
    }

    // 2. Build context block for the LLM
    const context = docs
      .map(
        (d, i) =>
          `[${i + 1}] Source: ${d.source} | Title: ${d.title}\nURL: ${d.url}\n${d.content}`,
      )
      .join('\n\n---\n\n');

    // 3. Generate grounded answer
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `You are Unity, an internal knowledge assistant for Capacity.
You answer questions using ONLY the provided source excerpts.
- Be concise but complete. Use markdown formatting where helpful.
- Cite sources by their bracketed number, e.g. [1], [2].
- If the provided context doesn't contain the answer, say so honestly — do not guess or hallucinate.
- Do not invent URLs, ticket numbers, or feature names not present in the context.`,
        },
        {
          role: 'user',
          content: `Question: ${question}\n\nContext:\n${context}`,
        },
      ],
    });

    const answer = completion.choices[0].message.content ?? 'No response generated.';

    // 4. Shape citations for the frontend
    const citations = docs.map((d) => ({
      id: d.id,
      source: d.source,
      title: d.title,
      url: d.url,
      author: d.author,
      similarity: d.similarity ?? 0,
    }));

    return res.json({ answer, citations });
  } catch (err) {
    console.error('[ask]', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});
