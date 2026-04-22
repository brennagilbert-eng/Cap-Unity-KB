import { useState } from 'react';
import type { Source } from '../App';
import { ALL_SOURCES } from '../App';
import SourceBadge, { SOURCE_CONFIG } from './SourceBadge';

interface SidebarProps {
  activeSources: Source[];
  onToggleSource: (source: Source) => void;
}

export default function Sidebar({ activeSources, onToggleSource }: SidebarProps) {
  const [urlInput, setUrlInput] = useState('');
  const [urls, setUrls] = useState<string[]>([]);
  const [crawl, setCrawl] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [indexMsg, setIndexMsg] = useState('');

  const webActive = activeSources.includes('web');

  function addUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed || urls.includes(trimmed)) return;
    try {
      new URL(trimmed); // validate
      setUrls((prev) => [...prev, trimmed]);
      setUrlInput('');
    } catch {
      setIndexMsg('Invalid URL — include https://');
    }
  }

  function removeUrl(url: string) {
    setUrls((prev) => prev.filter((u) => u !== url));
  }

  async function handleIndex() {
    if (!urls.length) return;
    setIndexing(true);
    setIndexMsg('');
    try {
      const res = await fetch('/api/ingest/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, crawl }),
      });
      const data = await res.json() as { message?: string; error?: string };
      setIndexMsg(data.message ?? data.error ?? 'Done');
    } catch {
      setIndexMsg('Server error — is the backend running?');
    } finally {
      setIndexing(false);
    }
  }

  return (
    <aside className="w-64 bg-night border-r border-border flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-earth flex items-center justify-center text-white font-bold text-sm">
            U
          </div>
          <div>
            <h1 className="text-white font-semibold text-base leading-tight">Unity</h1>
            <p className="text-slate-500 text-xs">Internal Knowledge</p>
          </div>
        </div>
      </div>

      {/* Source Filters */}
      <div className="px-4 py-5 flex-1 overflow-y-auto">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3 px-2">
          Sources
        </p>
        <div className="space-y-1">
          {ALL_SOURCES.map((source) => {
            const { label, icon } = SOURCE_CONFIG[source];
            const active = activeSources.includes(source);
            return (
              <button
                key={source}
                onClick={() => onToggleSource(source)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                  active
                    ? 'bg-earth/10 text-white'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-card'
                }`}
              >
                <span className="text-base">{icon}</span>
                <span className="text-sm font-medium flex-1">{label}</span>
                <span
                  className={`w-2 h-2 rounded-full transition-colors ${
                    active ? 'bg-earth' : 'bg-slate-700'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Web URL panel — shown when Web source is active */}
        {webActive && (
          <div className="mt-4 mx-1 p-3 rounded-lg bg-card border border-border">
            <p className="text-slate-400 text-xs font-semibold mb-2">Index websites</p>

            {/* URL list */}
            {urls.length > 0 && (
              <div className="mb-2 space-y-1">
                {urls.map((url) => (
                  <div
                    key={url}
                    className="flex items-center gap-1.5 text-xs text-slate-400 group"
                  >
                    <span className="truncate flex-1">{url.replace(/^https?:\/\//, '')}</span>
                    <button
                      onClick={() => removeUrl(url)}
                      className="text-slate-600 hover:text-mars opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* URL input */}
            <div className="flex gap-1 mb-2">
              <input
                className="flex-1 bg-surface border border-border text-slate-200 placeholder-slate-600 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-earth"
                placeholder="https://docs.example.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addUrl()}
              />
              <button
                onClick={addUrl}
                className="text-xs bg-earth/20 hover:bg-earth/30 text-earth px-2 py-1.5 rounded transition-colors"
              >
                Add
              </button>
            </div>

            {/* Crawl toggle */}
            <label className="flex items-center gap-2 mb-2 cursor-pointer">
              <div
                onClick={() => setCrawl((v) => !v)}
                className={`w-7 h-4 rounded-full transition-colors relative ${
                  crawl ? 'bg-earth' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${
                    crawl ? 'translate-x-3.5' : 'translate-x-0.5'
                  }`}
                />
              </div>
              <span className="text-xs text-slate-400">Crawl entire site</span>
            </label>

            {/* Index button */}
            <button
              onClick={handleIndex}
              disabled={!urls.length || indexing}
              className="w-full text-xs bg-earth hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-1.5 rounded transition-colors"
            >
              {indexing ? 'Indexing…' : `Index ${urls.length || ''} URL${urls.length !== 1 ? 's' : ''}`}
            </button>

            {indexMsg && (
              <p className="mt-2 text-xs text-slate-500 leading-tight">{indexMsg}</p>
            )}
          </div>
        )}

        <div className="mt-4 px-2">
          <p className="text-slate-600 text-xs">
            Toggle sources to filter which knowledge bases are searched.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border">
        <p className="text-slate-600 text-xs">Powered by OpenAI + Supabase</p>
      </div>
    </aside>
  );
}
