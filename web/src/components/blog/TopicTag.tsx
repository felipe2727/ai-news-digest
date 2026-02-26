export default function TopicTag({ topic }: { topic: string }) {
  const label = topic
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider border border-primary/30 text-primary">
      {label}
    </span>
  );
}
