import type { SourceType } from "@/lib/types";

const styles: Record<SourceType, string> = {
  reddit: "text-reddit",
  youtube: "text-youtube",
  github: "text-github",
  news: "text-news",
};

export const sourceFilenames: Record<SourceType, string> = {
  reddit: "reddit.rs",
  youtube: "youtube.ts",
  github: "github.go",
  news: "news.py",
};

export default function SourceBadge({ type }: { type: SourceType }) {
  return (
    <span
      className={`inline-block text-[10px] font-mono font-bold uppercase tracking-wider ${styles[type]}`}
    >
      {type}
    </span>
  );
}
