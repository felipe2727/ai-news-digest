import type { Article } from "@/lib/types";
import ArticleCard from "./ArticleCard";

export default function ArticleGrid({ articles }: { articles: Article[] }) {
  if (!articles.length) {
    return (
      <div className="text-center py-20 text-[var(--muted)]">
        No articles yet. Run the pipeline to generate your first digest.
      </div>
    );
  }

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
      {articles.map((article, i) => (
        <div key={article.id} className="break-inside-avoid">
          <ArticleCard article={article} featured={i % 7 === 6} />
        </div>
      ))}
    </div>
  );
}
