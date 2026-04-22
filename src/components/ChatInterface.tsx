import { useEffect, useRef, useState } from 'react';
import type { Message, Source } from '../App';
import MessageBubble from './MessageBubble';
import { SOURCE_CONFIG } from './SourceBadge';
import { askQuestion } from '../lib/api';

interface ChatInterfaceProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  activeSources: Source[];
}

const SUGGESTED_QUESTIONS = [
  'A customer needs to deflect Tier 1 support tickets — what do we recommend?',
  'Client wants to add voice AI to their contact center. What does our stack support?',
  'How do we solution for a client switching from English to Spanish IVR?',
  'What products should we lead with for a mid-market customer on a tight timeline?',
];

export default function ChatInterface({
  messages,
  setMessages,
  activeSources,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(question?: string) {
    const text = (question ?? input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const loadingMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput('');
    setLoading(true);

    try {
      const result = await askQuestion(text, activeSources);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? {
                ...m,
                content: result.answer,
                citations: result.citations,
                loading: false,
              }
            : m,
        ),
      );
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? {
                ...m,
                content: `⚠️ **Could not get an answer.**\n\n${detail}\n\nFix \`.env\` and restart the server if the message mentions keys or Supabase. For “Failed to fetch”, run \`npm run dev\` and match Vite’s proxy port to Express (\`PORT\` / \`API_PORT\`).`,
                loading: false,
              }
            : m,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  const empty = messages.length === 0;

  const searchSubtitle =
    activeSources.length === 0
      ? 'No sources selected'
      : `Searching ${activeSources.map((s) => SOURCE_CONFIG[s].label).join(' · ')}`;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <header className="px-6 py-4 border-b border-border bg-night flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-white font-semibold text-sm">Ask Unity</h2>
          <p className="text-slate-500 text-xs mt-0.5">{searchSubtitle}</p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => setMessages([])}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors rounded-md px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-earth/35"
          >
            Clear chat
          </button>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {empty ? (
          <div className="max-w-3xl mx-auto w-full flex flex-col items-center justify-center min-h-[min(70vh,36rem)] gap-10 text-center py-8">
            <div>
              <div className="unity-mark mx-auto mb-5 h-10 w-10 rounded-xl text-base">U</div>
              <h3 className="text-white font-semibold text-xl tracking-tight">
                Describe a customer problem.
              </h3>
              <p className="text-slate-500 text-sm mt-3 max-w-md mx-auto leading-relaxed">
                Unity acts as your solutions consultant — map customer needs to the right Capacity
                products across the full portfolio, grounded in real documentation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSubmit(q)}
                  className="card px-4 py-3 text-left text-sm text-slate-300 hover:text-white hover:border-earth/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-earth/35"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-border bg-night shrink-0">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            className="input-base flex-1 text-sm"
            placeholder="Describe a customer problem or use case…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            disabled={loading}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim() || loading}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Asking…
              </span>
            ) : (
              'Ask'
            )}
          </button>
        </div>
        <p className="text-center text-slate-700 text-xs mt-2">
          Answers are grounded in indexed sources. Always verify critical details.
        </p>
      </div>
    </div>
  );
}
