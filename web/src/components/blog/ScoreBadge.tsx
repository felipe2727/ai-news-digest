export default function ScoreBadge({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs text-muted">
      <span className="text-primary font-bold">{Math.round(score)}</span>
      <span className="text-[10px]">pts</span>
    </span>
  );
}
