import type { MatchLevel } from '@/lib/types';
import { MATCH_LABEL } from '@/lib/matching';

const styles: Record<MatchLevel, { dot: string; cls: string }> = {
  good: { dot: 'bg-brand-500', cls: 'bg-brand-50 text-brand-700 border-brand-200' },
  moderate: { dot: 'bg-amber-400', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  low: { dot: 'bg-ink-300', cls: 'bg-ink-50 text-ink-600 border-ink-200' },
};

export function MatchBadge({ level, reason }: { level: MatchLevel; reason?: string }) {
  const s = styles[level];
  return (
    <span
      className={`badge border ${s.cls}`}
      title={reason}
    >
      <span className={`inline-block h-2 w-2 rounded-full ${s.dot}`} />
      {MATCH_LABEL[level]}
    </span>
  );
}
