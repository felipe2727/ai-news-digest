export default function TLDRBar({ summary }: { summary: string }) {
  if (!summary) return null;

  return (
    <section className="border-y border-border py-4 my-8">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-3 shrink-0">
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-orange-500 text-white">
            TL;DR
          </span>
          <span className="text-[11px] font-mono text-muted hidden sm:inline">
            Quick_Summary.log
          </span>
          <span className="hidden sm:inline text-border">
            {"─".repeat(3)}
          </span>
        </div>
        <p className="text-sm text-muted leading-relaxed font-mono">
          {summary}
        </p>
      </div>
    </section>
  );
}
