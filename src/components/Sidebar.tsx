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
          <div className="unity-mark h-8 w-8 rounded-lg text-sm">U</div>
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
                type="button"
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
          <div className="panel mt-5 mx-0.5 p-4 space-y-3">
            <p className="text-slate-300 text-xs font-semibold tracking-tight">Index websites</p>

            {/* URL list */}
            {urls.length > 0 && (
              <div className="space-y-1.5">
                {urls.map((url) => (
                  <div
                    key={url}
                    className="flex items-center gap-2 text-xs text-slate-400 group rounded-md px-1 py-0.5 hover:bg-surface/80"
                  >
                    <span className="truncate flex-1">{url.replace(/^https?:\/\//, '')}</span>
                    <button
                      type="button"
                      onClick={() => removeUrl(url)}
                      aria-label={`Remove ${url}`}
                      className="text-slate-600 hover:text-mars opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shrink-0 rounded px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* URL input */}
            <div className="flex gap-2">
              <input
                className="flex-1 min-w-0 bg-surface border border-border text-slate-200 placeholder-slate-600 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-earth focus-visible:ring-1 focus-visible:ring-earth/40"
                placeholder="https://docs.example.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addUrl()}
              />
              <button
                type="button"
                onClick={addUrl}
                className="text-xs shrink-0 bg-earth/20 hover:bg-earth/35 text-earth font-medium px-2.5 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-earth/40"
              >
                Add
              </button>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={crawl}
                onChange={(e) => setCrawl(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border bg-surface text-earth focus:ring-earth focus:ring-offset-0 focus:ring-2"
              />
              <span className="text-xs text-slate-400 leading-snug">Crawl entire site</span>
            </label>

            <button
              type="button"
              onClick={handleIndex}
              disabled={!urls.length || indexing}
              className="btn-primary-sm w-full disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
            >
              {indexing ? 'Indexing…' : `Index ${urls.length || ''} URL${urls.length !== 1 ? 's' : ''}`}
            </button>

            {indexMsg && (
              <p className="text-xs text-slate-500 leading-relaxed border-t border-border/60 pt-2">
                {indexMsg}
              </p>
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
