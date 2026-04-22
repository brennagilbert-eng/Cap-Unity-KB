import type { VercelRequest, VercelResponse } from '@vercel/node';
import { searchDocuments } from '../server/lib/embeddings.js';
import { getOpenAI, CHAT_MODEL } from '../server/lib/openai.js';
import { UNITY_ASK_SYSTEM_PROMPT } from '../server/lib/unityAskSystemPrompt.js';

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
          content: UNITY_ASK_SYSTEM_PROMPT,
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
