import type { Source } from '../App';
import { ALL_SOURCES } from '../App';
import SourceBadge, { SOURCE_CONFIG } from './SourceBadge';

interface SidebarProps {
  activeSources: Source[];
  onToggleSource: (source: Source) => void;
}

export default function Sidebar({ activeSources, onToggleSource }: SidebarProps) {
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
      <div className="px-4 py-5 flex-1">
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
