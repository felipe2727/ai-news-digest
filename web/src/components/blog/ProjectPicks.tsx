import Link from "next/link";

interface ProjectPick {
  name: string;
  description: string;
  why: string;
  url: string;
  category: "tool" | "framework" | "model" | "library";
}

const CATEGORY_ICONS: Record<string, string> = {
  tool: "\u{1F6E0}\u{FE0F}",
  framework: "\u{1F4E6}",
  model: "\u{1F9E0}",
  library: "\u{1F4DA}",
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

  return (
    <div className={compact ? "mt-6" : "mt-8 mb-10"}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">
          Today&apos;s Picks
        </p>
        <Link
          href="/picks"
          className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
        >
          View all &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {picks.map((pick) => (
          <Link
            key={pick.name}
            href="/picks"
            className="glass rounded-xl p-4 border-l-2 border-l-emerald-500/50 hover:border-l-emerald-500 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">
                {CATEGORY_ICONS[pick.category] || CATEGORY_ICONS.tool}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/70">
                {pick.category}
              </span>
            </div>
            <p className="text-sm font-semibold text-[var(--foreground)] group-hover:text-emerald-400 transition-colors leading-tight mb-1">
              {pick.name}
            </p>
            <p className="text-xs text-[var(--muted)] leading-relaxed line-clamp-2">
              {pick.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
