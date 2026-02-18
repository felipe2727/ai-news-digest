export default function TopicTag({ topic }: { topic: string }) {
  const label = topic
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span className="inline-block px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded border border-[var(--accent)]/30 text-[var(--accent)]">
      {label}
    </span>
  );
}
