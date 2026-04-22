import { Router } from 'express';
import { searchDocuments } from '../lib/embeddings.js';
import { openai, CHAT_MODEL } from '../lib/openai.js';
import { UNITY_ASK_SYSTEM_PROMPT } from '../lib/unityAskSystemPrompt.js';
import type { DocumentRow } from '../lib/supabase.js';

export const askRouter = Router();

const INTERNAL_SOURCES = new Set(['confluence', 'jira', 'slack', 'drive']);
const EXTERNAL_SOURCES = new Set(['web']);

askRouter.post('/', async (req, res) => {
  const { question, sources, documentContext, history } = req.body as {
    question?: string;
    sources?: string[];
    documentContext?: { filename: string; content: string } | null;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  };

  if (!question?.trim()) {
    return res.status(400).json({ error: 'question is required' });
  }

  const activeSources: string[] = Array.isArray(sources) ? sources : [];

  try {
    // 1. Retrieve relevant chunks
    const docs: DocumentRow[] = await searchDocuments(question, activeSources, 10);

    if (docs.length === 0) {
      return res.json({
        answer:
          "I couldn't find anything relevant in the indexed knowledge base for that question. Try enabling more sources or rephrasing.",
        citations: [],
      });
    }

    // 2. Split into internal (Capacity/Confluence/Drive/Jira) vs external (web/API docs)
    const internal = docs.filter((d) => INTERNAL_SOURCES.has(d.source));
    const external = docs.filter((d) => EXTERNAL_SOURCES.has(d.source));

    // Build numbered context — internal first, then external, continuous numbering
    let idx = 1;
    const internalBlock = internal.length
      ? `## INTERNAL — Capacity docs, Confluence, past projects, playbooks\n\n` +
        internal
          .map((d) => `[${idx++}] ${d.source.toUpperCase()} | ${d.title}\nURL: ${d.url}\n${d.content}`)
          .join('\n\n---\n\n')
      : '';

    const externalBlock = external.length
      ? `## EXTERNAL — Third-party platform documentation\n\n` +
        external
          .map((d) => `[${idx++}] ${d.source.toUpperCase()} | ${d.title}\nURL: ${d.url}\n${d.content}`)
          .join('\n\n---\n\n')
      : '';

    const ragContext = [internalBlock, externalBlock].filter(Boolean).join('\n\n');

    // Optionally prepend uploaded document context
    const docBlock = documentContext?.content
      ? `--- UPLOADED DOCUMENT: ${documentContext.filename} ---\n${documentContext.content}\n--- END OF DOCUMENT ---\n\n`
      : '';

    const fullContext = docBlock + ragContext;

    // 3. Build multi-turn message history (cap at last 6 turns)
    const priorTurns = (Array.isArray(history) ? history : [])
      .slice(-6)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    // 4. Generate grounded answer
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.3,
      messages: [
        { role: 'system', content: UNITY_ASK_SYSTEM_PROMPT },
        ...priorTurns,
        {
          role: 'user',
          content: `${question}\n\n---\nKnowledge base context:\n${fullContext}`,
        },
      ],
    });

    const answer = completion.choices[0].message.content ?? 'No response generated.';

    // 5. Shape citations — same order as context (internal first, then external)
    const orderedDocs = [...internal, ...external];
    const citations = orderedDocs.map((d) => ({
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
