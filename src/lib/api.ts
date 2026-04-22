import type { Citation, Source } from '../App';

interface AskResponse {
  answer: string;
  citations: Citation[];
}

export interface ParsedDoc {
  filename: string;
  content: string;
  truncated: boolean;
  charCount: number;
}

export async function parseDocument(file: File): Promise<ParsedDoc> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/parse-doc', { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Parse failed: ${res.status}`);
  }
  return res.json() as Promise<ParsedDoc>;
}

export async function askQuestion(
  question: string,
  sources: Source[],
  documentContext?: { filename: string; content: string } | null,
): Promise<AskResponse> {
  const res = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, sources, documentContext: documentContext ?? null }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<AskResponse>;
}

export async function triggerIngest(source?: Source): Promise<{ message: string }> {
  const res = await fetch('/api/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Ingest failed: ${res.status}`);
  }

  return res.json() as Promise<{ message: string }>;
}
