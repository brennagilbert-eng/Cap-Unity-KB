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

async function parsePdfClientSide(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
  // Use the bundled legacy worker to avoid CDN dependency
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item: { str?: string }) => item.str ?? '').join(' '));
  }
  return pages.join('\n\n');
}

export async function parseDocument(file: File): Promise<ParsedDoc> {
  const isPdf = file.type === 'application/pdf' || file.name.match(/\.pdf$/i);

  let text: string;

  if (isPdf) {
    // Parse PDFs entirely in the browser — no serverless dependency
    text = await parsePdfClientSide(file);
  } else {
    // Word / text files — send to server
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
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

  text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (text.length < 20) throw new Error('Could not extract text from this PDF.');

  const truncated = text.length > 50000;
  return {
    filename: file.name,
    content: truncated ? text.slice(0, 50000) + '\n\n[Document truncated for length]' : text,
    truncated,
    charCount: text.length,
  };
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
