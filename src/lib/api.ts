import type { Citation, Source } from '../App';

interface AskResponse {
  answer: string;
  citations: Citation[];
}

export async function askQuestion(question: string, sources: Source[]): Promise<AskResponse> {
  const res = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, sources }),
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
