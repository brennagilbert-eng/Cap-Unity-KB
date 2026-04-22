import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '../App';
import SourceBadge from './SourceBadge';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%] bg-earth text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed shadow-sm shadow-earth/20">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 max-w-[85%]">
      <div className="flex items-center gap-2.5">
        <img src="/capacity-logo.png" alt="Capacity" className="h-4 w-auto" />
        <span className="text-slate-400 text-xs tabular-nums">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm shadow-blue-50">
        {message.loading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <span className="animate-pulse">Searching</span>
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 bg-earth rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          </div>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-slate-800 font-semibold text-base mt-5 mb-2 first:mt-0">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-slate-800 font-semibold text-sm mt-4 mb-1.5 first:mt-0">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-slate-700 font-medium text-sm mt-3 mb-1 first:mt-0">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="text-slate-700 text-sm leading-relaxed mb-3 last:mb-0">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="text-slate-700 text-sm space-y-1 mb-3 last:mb-0 pl-4 list-none">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="text-slate-700 text-sm space-y-1 mb-3 last:mb-0 pl-4 list-decimal">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="flex gap-2 items-start leading-relaxed">
                  <span className="text-earth mt-[0.35em] shrink-0">•</span>
                  <span>{children}</span>
                </li>
              ),
              strong: ({ children }) => (
                <strong className="text-slate-900 font-semibold">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="text-slate-500 italic">{children}</em>
              ),
              code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
                inline ? (
                  <code className="text-earth bg-blue-50 px-1.5 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                ) : (
                  <pre className="bg-slate-50 border border-border rounded-lg px-4 py-3 overflow-x-auto mb-3 last:mb-0">
                    <code className="text-earth text-xs font-mono">{children}</code>
                  </pre>
                ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-earth pl-3 my-2 text-slate-500 italic text-sm">
                  {children}
                </blockquote>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-earth hover:text-blue-700 underline underline-offset-2 transition-colors"
                >
                  {children}
                </a>
              ),
              hr: () => <hr className="border-border my-4" />,
              table: ({ children }) => (
                <div className="overflow-x-auto mb-3 last:mb-0">
                  <table className="w-full text-sm border-collapse">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-surface text-slate-600 font-medium">{children}</thead>
              ),
              tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
              tr: ({ children }) => <tr className="hover:bg-blue-50/50 transition-colors">{children}</tr>,
              th: ({ children }) => (
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-border">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-3 py-2 text-slate-700 text-sm">{children}</td>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>

      {/* Citations */}
      {message.citations && message.citations.length > 0 && (
        <CitationList citations={message.citations} />
      )}
    </div>
  );
}

function CitationList({ citations }: { citations: NonNullable<Message['citations']> }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? citations : citations.slice(0, 3);
  const extras = citations.length - 3;

  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-3 -mt-0.5">
      <p className="text-slate-400 text-[0.65rem] uppercase tracking-wider font-semibold mb-2">
        Sources
      </p>
      <ul className="flex flex-col gap-2 list-none m-0 p-0">
        {visible.map((citation, idx) => (
          <li key={citation.id}>
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-lg px-1 py-1 -mx-1 group hover:bg-blue-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-earth/35"
            >
              <span className="text-[0.65rem] font-semibold text-earth/70 tabular-nums shrink-0 w-5 text-center">
                [{idx + 1}]
              </span>
              <SourceBadge source={citation.source} />
              <span className="text-xs text-slate-500 group-hover:text-earth transition-colors truncate flex-1 min-w-0">
                {citation.title}
              </span>
            </a>
          </li>
        ))}
      </ul>

      {extras > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 flex items-center gap-1 text-xs text-slate-400 hover:text-earth transition-colors focus-visible:outline-none"
        >
          <svg
            className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          {expanded ? 'Show less' : `${extras} more source${extras > 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  );
}
