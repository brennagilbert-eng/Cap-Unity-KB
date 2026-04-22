import ReactMarkdown from 'react-markdown';
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
        <div className="max-w-[70%] bg-earth text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 max-w-[85%]">
      <div className="flex items-center gap-2.5">
        <div className="unity-mark h-9 w-9 rounded-lg text-xs">U</div>
        <span className="text-slate-400 text-xs font-medium">Unity</span>
        <span className="text-slate-600 text-xs tabular-nums">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="card px-5 py-4 shadow-sm shadow-black/10">
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
          <div className="prose prose-invert prose-sm max-w-none prose-p:text-slate-200 prose-headings:text-white prose-strong:text-white prose-code:text-sun prose-a:text-earth">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Citations */}
      {message.citations && message.citations.length > 0 && (
        <div className="rounded-xl border border-border/80 bg-card/60 px-3 py-3 -mt-0.5">
          <p className="text-slate-500 text-[0.65rem] uppercase tracking-wider font-semibold mb-2">
            Sources
          </p>
          <ul className="flex flex-col gap-2 list-none m-0 p-0">
            {message.citations.map((citation) => (
              <li key={citation.id}>
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg px-1 py-1 -mx-1 group hover:bg-surface/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-earth/35"
                >
                  <SourceBadge source={citation.source} />
                  <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors truncate flex-1 min-w-0">
                    {citation.title}
                  </span>
                  <span className="text-[0.65rem] text-slate-600 tabular-nums shrink-0">
                    {Math.round(citation.similarity * 100)}%
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
