import type { VercelRequest, VercelResponse } from '@vercel/node';
import { searchDocuments } from '../server/lib/embeddings.js';
import { getOpenAI, CHAT_MODEL } from '../server/lib/openai.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, sources } = req.body as { question?: string; sources?: string[] };

  if (!question?.trim()) {
    return res.status(400).json({ error: 'question is required' });
  }

  const activeSources: string[] = Array.isArray(sources) ? sources : [];

  try {
    const docs = await searchDocuments(question, activeSources, 6);

    if (docs.length === 0) {
      return res.json({
        answer:
          "I couldn't find anything relevant in the indexed knowledge base. Try enabling more sources or rephrasing.",
        citations: [],
      });
    }

    const context = docs
      .map(
        (d, i) =>
          `[${i + 1}] Source: ${d.source} | Title: ${d.title}\nURL: ${d.url}\n${d.content}`,
      )
      .join('\n\n---\n\n');

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `You are Unity, an internal knowledge assistant for Capacity.
Answer questions using ONLY the provided source excerpts.
- Be concise but complete. Use markdown formatting where helpful.
- Cite sources by their bracketed number, e.g. [1], [2].
- If the provided context doesn't contain the answer, say so honestly.
- Do not invent URLs, ticket numbers, or feature names not present in the context.`,
        },
        {
          role: 'user',
          content: `Question: ${question}\n\nContext:\n${context}`,
        },
      ],
    });

    const answer = completion.choices[0].message.content ?? 'No response generated.';
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
}
