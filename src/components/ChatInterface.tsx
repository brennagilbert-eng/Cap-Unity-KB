import { useEffect, useRef, useState } from 'react';
import type { Message, Source } from '../App';
import MessageBubble from './MessageBubble';
import { askQuestion } from '../lib/api';

interface ChatInterfaceProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  activeSources: Source[];
}

const SUGGESTED_QUESTIONS = [
  'What languages does Capacity support for TTS?',
  "What's on the product roadmap for Q2?",
  'How do we position Capacity for mid-market customers?',
  'What Jira issues are open for the SMS platform?',
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
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? {
                ...m,
                content:
                  '⚠️ Something went wrong fetching an answer. Check that the server is running and your `.env` is configured.',
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

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <header className="px-6 py-4 border-b border-border bg-night flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-white font-semibold text-sm">Ask Unity</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            {activeSources.length === 0
              ? 'No sources selected'
              : `Searching ${activeSources.join(', ')}`}
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Clear chat
          </button>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {empty ? (
          <div className="flex flex-col items-center justify-center h-full gap-8 text-center">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-earth to-mars mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white">
                U
              </div>
              <h3 className="text-white font-semibold text-xl">What do you want to know?</h3>
              <p className="text-slate-500 text-sm mt-2 max-w-sm">
                Ask anything about Capacity's product, roadmap, positioning, or past work. I'll
                pull answers from Confluence, Jira, Slack, and Drive.
              </p>
            </div>

            {/* Suggested questions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSubmit(q)}
                  className="card px-4 py-3 text-left text-sm text-slate-300 hover:text-white hover:border-earth/50 transition-all"
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
            placeholder="Ask a question about Capacity…"
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
