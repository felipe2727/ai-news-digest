import Link from "next/link";

interface ProjectPick {
  name: string;
  description: string;
  why: string;
  url: string;
  category: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  tool: "\u{1F6E0}\u{FE0F}",
  framework: "\u{1F4E6}",
  model: "\u{1F9E0}",
  library: "\u{1F4DA}",
  saas: "\u{1F680}",
  community: "\u{1F465}",
  marketplace: "\u{1F6D2}",
};

export function parseProjectPicks(raw: string): ProjectPick[] {
  try {
    const picks = JSON.parse(raw);
    if (Array.isArray(picks)) return picks.slice(0, 3);
  } catch {
    // ignore
  }
  return [];
}

export default function ProjectPicks({
  picks,
  compact = false,
}: {
  picks: ProjectPick[];
  compact?: boolean;
}) {
  if (!picks.length) return null;

  const isSingle = picks.length === 1;

  return (
    <div className={compact ? "mt-6 mb-8" : "mt-8 mb-10"}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">
          Build This
        </p>
        <Link
          href="/picks"
          className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
        >
          Past ideas &rarr;
        </Link>
      </div>
      <div className={isSingle ? "max-w-2xl" : "grid grid-cols-1 md:grid-cols-3 gap-3"}>
        {picks.map((pick) => (
          <Link
            key={pick.name}
            href="/picks"
            className={`glass rounded-xl border-l-2 border-l-emerald-500/50 hover:border-l-emerald-500 transition-all group cursor-pointer block ${
              isSingle ? "p-6" : "p-4"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={isSingle ? "text-lg" : "text-sm"}>
                {CATEGORY_ICONS[pick.category] || CATEGORY_ICONS.tool}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/70">
                {pick.category}
              </span>
            </div>
            <p className={`font-semibold text-[var(--foreground)] group-hover:text-emerald-400 transition-colors leading-tight mb-1 ${
              isSingle ? "text-base" : "text-sm"
            }`}>
              {pick.name}
            </p>
            <p className={`text-[var(--muted)] leading-relaxed ${
              isSingle ? "text-sm mb-2" : "text-xs line-clamp-2"
            }`}>
              {pick.description}
            </p>
            {isSingle && pick.why && (
              <p className="text-xs text-emerald-500/80 leading-relaxed">
                {pick.why}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
