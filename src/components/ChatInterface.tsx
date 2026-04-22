import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Message, Source } from '../App';
import MessageBubble from './MessageBubble';
import { askQuestion, parseDocument, type ParsedDoc, type HistoryMessage } from '../lib/api';
import { supabase } from '../lib/supabase';

interface ChatInterfaceProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  activeSources: Source[];
  onToggleSource: (source: Source) => void;
  user: User;
}

const SUGGESTED_QUESTIONS = [
  'A customer needs to deflect Tier 1 support tickets — what do we recommend?',
  'Client wants to add voice AI to their contact center. What does our stack support?',
  'How do we solution for a client switching from English to Spanish IVR?',
  'What products should we lead with for a mid-market customer on a tight timeline?',
];

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.txt,.md';

// Extend Window for webkit speech
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default function ChatInterface({
  messages,
  setMessages,
  activeSources,
  onToggleSource,
  user,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedDoc, setAttachedDoc] = useState<ParsedDoc | null>(null);
  const [parsing, setParsing] = useState(false);
  const [listening, setListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  // Speech-to-text
  const toggleListening = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) {
      alert('Speech recognition is not supported in this browser. Try Chrome.');
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = true;

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .slice(e.resultIndex)
        .map((r) => r[0]?.transcript ?? '')
        .join(' ')
        .trim();
      if (transcript) setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening]);

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

    // Stop mic if still listening
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
      setListening(false);
    }

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
        <img src="/capacity-logo.png" alt="Capacity" className="h-7 w-auto" />
        <div />
        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setMessages([])}
              className="text-xs text-slate-400 hover:text-earth transition-colors rounded-md px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-earth/35"
            >
              Clear chat
            </button>
          )}
          <div className="flex items-center gap-2">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt={user.user_metadata?.full_name ?? 'User'}
                className="w-7 h-7 rounded-full border border-border"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-earth/10 border border-border flex items-center justify-center text-xs font-medium text-earth">
                {(user.email ?? '?')[0].toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="text-xs text-slate-400 hover:text-mars transition-colors"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {empty ? (
          <div className="max-w-3xl mx-auto w-full flex flex-col items-center justify-center min-h-[min(70vh,36rem)] gap-10 text-center py-8">
            <div>
              <div className="mx-auto mb-5">
                <img src="/capacity-logo.png" alt="Capacity" className="h-10 w-auto mx-auto" />
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

          <div className="flex gap-2 items-end">
            {/* Mic button */}
            <button
              type="button"
              onClick={toggleListening}
              disabled={loading}
              title={listening ? 'Stop listening' : 'Speak your question'}
              className={`shrink-0 h-11 w-11 flex items-center justify-center rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-earth/35 ${
                listening
                  ? 'bg-mars/10 border-mars/40 text-mars animate-pulse'
                  : 'border-border bg-surface text-slate-400 hover:text-earth hover:border-earth/40'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" strokeLinecap="round" />
                <line x1="8" y1="23" x2="16" y2="23" strokeLinecap="round" />
              </svg>
            </button>

            {/* Auto-resizing textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              className="input-base flex-1 text-sm resize-none overflow-hidden leading-relaxed"
              style={{ minHeight: '44px', maxHeight: '200px' }}
              placeholder="Describe a customer problem or use case…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              disabled={loading}
            />

            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || loading}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed shrink-0 h-11"
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
