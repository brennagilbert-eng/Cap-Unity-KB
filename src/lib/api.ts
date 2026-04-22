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
  // Read file as base64 for serverless-friendly JSON upload
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g. "data:application/pdf;base64,")
      resolve(result.split(',')[1]);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const res = await fetch('/api/parse-doc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: file.name, type: file.type, data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Parse failed: ${res.status}`);
  }
  return res.json() as Promise<ParsedDoc>;
}

export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function askQuestion(
  question: string,
  sources: Source[],
  documentContext?: { filename: string; content: string } | null,
  history?: HistoryMessage[],
): Promise<AskResponse> {
  const res = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      sources,
      documentContext: documentContext ?? null,
      history: history ?? [],
    }),
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
