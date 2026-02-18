import { getRecentArticles } from "@/lib/admin-queries";
import ArticlesTable from "./ArticlesTable";

export default async function DashboardArticles() {
  const { articles, total } = await getRecentArticles();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-[var(--font-instrument-serif)] text-3xl">
          Articles
        </h1>
        <span className="text-sm text-[var(--muted)]">
          {total.toLocaleString()} total
        </span>
      </div>

      <ArticlesTable articles={articles} />
    </div>
  );
}
