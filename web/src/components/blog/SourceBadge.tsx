"use client";

import type { SourceType } from "@/lib/types";

const styles: Record<SourceType, string> = {
  reddit: "bg-[var(--reddit)] text-white",
  youtube: "bg-[var(--youtube)] text-white",
  github: "bg-[#333] text-[var(--github)]",
  news: "bg-[var(--news)] text-white",
};

export default function SourceBadge({ type }: { type: SourceType }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded ${styles[type]}`}
    >
      {type}
    </span>
  );
}
