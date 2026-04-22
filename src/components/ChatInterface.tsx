import { useEffect, useRef, useState } from 'react';
import type { Message, Source } from '../App';
import { ALL_SOURCES } from '../App';
import MessageBubble from './MessageBubble';
import { SOURCE_CONFIG } from './SourceBadge';
import { askQuestion, parseDocument, type ParsedDoc, type HistoryMessage } from '../lib/api';

interface ChatInterfaceProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  activeSources: Source[];
  onToggleSource: (source: Source) => void;
}

const SUGGESTED_QUESTIONS = [
  'A customer needs to deflect Tier 1 support tickets — what do we recommend?',
  'Client wants to add voice AI to their contact center. What does our stack support?',
  'How do we solution for a client switching from English to Spanish IVR?',
  'What products should we lead with for a mid-market customer on a tight timeline?',
];

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.txt,.md';

export default function ChatInterface({
  messages,
  setMessages,
  activeSources,
  onToggleSource,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedDoc, setAttachedDoc] = useState<ParsedDoc | null>(null);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    try {
      const parsed = await parseDocument(file);
      setAttachedDoc(parsed);
    } catch (err) {
      alert(`Could not parse file: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function removeAttachment() {
    setAttachedDoc(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(question?: string) {
    const text = (question ?? input).trim();
    if (!text || loading) return;

    const docCtx = attachedDoc
      ? { filename: attachedDoc.filename, content: attachedDoc.content }
      : null;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: docCtx ? `📎 **${docCtx.filename}**\n\n${text}` : text,
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
    setAttachedDoc(null);
    setLoading(true);

    try {
      const history: HistoryMessage[] = messages
        .filter((m) => !m.loading && m.content)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const result = await askQuestion(text, activeSources, docCtx, history);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? { ...m, content: result.answer, citations: result.citations, loading: false }
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
                content: `⚠️ **Could not get an answer.**\n\n${detail}\n\nFix \`.env\` and restart the server if the message mentions keys or Supabase.`,
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
      <header className="px-6 py-3 border-b border-border bg-white flex items-center justify-between shrink-0 shadow-sm shadow-blue-50">
        {/* Logo */}
        <img
          src="/capacity-logo.png"
          alt="Capacity"
          className="h-7 w-auto"
        />

        {/* Source filter pills */}
        <div className="flex items-center gap-1.5">
          {ALL_SOURCES.map((source) => {
            const { label, icon } = SOURCE_CONFIG[source];
            const active = activeSources.includes(source);
            return (
              <button
                key={source}
                type="button"
                onClick={() => onToggleSource(source)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  active
                    ? 'bg-earth text-white shadow-sm shadow-earth/30'
                    : 'bg-surface text-slate-500 hover:text-earth hover:bg-blue-50 border border-border'
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Clear button */}
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => setMessages([])}
            className="text-xs text-slate-400 hover:text-earth transition-colors rounded-md px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-earth/35"
          >
            Clear chat
          </button>
        )}
        {messages.length === 0 && <div className="w-20" />}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {empty ? (
          <div className="max-w-3xl mx-auto w-full flex flex-col items-center justify-center min-h-[min(70vh,36rem)] gap-10 text-center py-8">
            <div>
              <div className="mx-auto mb-5">
                <img src="/capacity-logo.png" alt="Capacity" className="h-10 w-auto mx-auto opacity-20" />
              </div>
              <h3 className="text-slate-800 font-semibold text-xl tracking-tight">
                Describe a customer problem.
              </h3>
              <p className="text-slate-400 text-sm mt-3 max-w-md mx-auto leading-relaxed">
                Unity acts as your solutions consultant — map customer needs to the right Capacity
                products across the full portfolio, grounded in real documentation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSubmit(q)}
                  className="bg-white border border-border rounded-xl px-4 py-3 text-left text-sm text-slate-600 hover:text-earth hover:border-earth/40 hover:shadow-sm hover:shadow-blue-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-earth/35"
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
      <div className="px-6 py-4 border-t border-border bg-white shrink-0">
        <div className="max-w-3xl mx-auto flex flex-col gap-2">

          {/* Attached doc pill */}
          {attachedDoc && (
            <div className="flex items-center gap-2 bg-blue-50 border border-earth/20 rounded-lg px-3 py-2 text-xs">
              <svg className="w-3.5 h-3.5 text-earth shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="text-slate-600 truncate flex-1 min-w-0">{attachedDoc.filename}</span>
              {attachedDoc.truncated && (
                <span className="text-sun shrink-0">truncated</span>
              )}
              <span className="text-slate-400 shrink-0">{Math.round(attachedDoc.charCount / 1000)}k chars</span>
              <button
                onClick={removeAttachment}
                className="text-slate-400 hover:text-mars transition-colors shrink-0 ml-1"
                aria-label="Remove attachment"
              >
                ✕
              </button>
            </div>
          )}

          {parsing && (
            <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
              <span className="animate-pulse">Parsing document…</span>
            </div>
          )}

          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Attach button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || parsing}
              title="Attach a document (PDF, Word, TXT)"
              className="shrink-0 h-11 w-11 flex items-center justify-center rounded-lg border border-border bg-surface text-slate-400 hover:text-earth hover:border-earth/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-earth/35"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

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
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Asking…
                </span>
              ) : (
                'Ask'
              )}
            </button>
          </div>
        </div>
        <p className="text-center text-slate-300 text-xs mt-2">
          Answers are grounded in indexed sources. Always verify critical details.
        </p>
      </div>
    </div>
  );
}
