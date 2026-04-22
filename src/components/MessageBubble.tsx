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
      {/* Avatar + header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-earth to-mars flex items-center justify-center text-white text-xs font-bold shrink-0">
          U
        </div>
        <span className="text-slate-500 text-xs">Unity</span>
        <span className="text-slate-700 text-xs">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Content */}
      <div className="card px-5 py-4">
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
        <div className="flex flex-col gap-2 pl-1">
          <p className="text-slate-600 text-xs uppercase tracking-wider font-semibold">
            Sources
          </p>
          <div className="flex flex-col gap-1.5">
            {message.citations.map((citation) => (
              <a
                key={citation.id}
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 group"
              >
                <SourceBadge source={citation.source} />
                <span className="text-xs text-slate-400 group-hover:text-earth transition-colors truncate flex-1">
                  {citation.title}
                </span>
                <span className="text-xs text-slate-700 shrink-0">
                  {Math.round(citation.similarity * 100)}%
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
