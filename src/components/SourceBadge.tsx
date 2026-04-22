import type { Source } from '../App';

const SOURCE_CONFIG: Record<Source, { label: string; color: string; icon: string }> = {
  confluence: {
    label: 'Confluence',
    color: 'bg-earth/20 text-earth border-earth/30',
    icon: '📘',
  },
  jira: {
    label: 'Jira',
    color: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    icon: '🎯',
  },
  slack: {
    label: 'Slack',
    color: 'bg-sun/20 text-sun border-sun/30',
    icon: '💬',
  },
  drive: {
    label: 'Drive',
    color: 'bg-mars/20 text-mars border-mars/30',
    icon: '📁',
  },
  web: {
    label: 'Web',
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    icon: '🌐',
  },
};

interface SourceBadgeProps {
  source: Source;
  size?: 'sm' | 'md';
}

export default function SourceBadge({ source, size = 'sm' }: SourceBadgeProps) {
  const { label, color, icon } = SOURCE_CONFIG[source];
  return (
    <span
      className={`inline-flex items-center gap-1 border rounded-full font-medium ${color} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
    >
      <span>{icon}</span>
      {label}
    </span>
  );
}

export { SOURCE_CONFIG };
