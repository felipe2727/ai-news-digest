"use client";

import Link from "next/link";
import type { Article } from "@/lib/types";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `${hours}h ago`;
  return "just now";
}

export default function ArticlesTable({
  articles,
}: {
  articles: Article[];
}) {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.07] text-left text-[var(--muted)]">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium w-24">Source</th>
              <th className="px-4 py-3 font-medium w-20">Score</th>
              <th className="px-4 py-3 font-medium w-32">Topics</th>
              <th className="px-4 py-3 font-medium w-24">Date</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr
                key={a.id}
                className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/articles/${a.slug}`}
                    className="hover:text-[var(--accent)] transition-colors line-clamp-1"
                  >
                    {a.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[var(--muted)] capitalize">
                  {a.source_type}
                </td>
                <td className="px-4 py-3 font-[var(--font-dm-mono)] text-[var(--accent)]">
                  {a.score}
                </td>
                <td className="px-4 py-3 text-[var(--muted)]">
                  {a.matched_topics.slice(0, 2).join(", ")}
                </td>
                <td className="px-4 py-3 text-[var(--muted)]">
                  {a.created_at ? timeAgo(a.created_at) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
