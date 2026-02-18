export default function ScoreBadge({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-1 font-[var(--font-dm-mono)] text-xs text-[var(--muted)]">
      <span className="text-[var(--accent)] font-bold">{Math.round(score)}</span>
      <span className="text-[10px]">pts</span>
    </span>
  );
}
