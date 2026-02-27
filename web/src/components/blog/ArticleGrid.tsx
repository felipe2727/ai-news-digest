import type { Article } from "@/lib/types";
import ArticleCard from "./ArticleCard";
import BuildThisCard from "./BuildThisCard";

interface ProjectPick {
  name: string;
  description: string;
  why: string;
  url: string;
  category: string;
}

export default function ArticleGrid({
  articles,
  buildThisPick,
}: {
  articles: Article[];
  buildThisPick?: ProjectPick | null;
}) {
  if (!articles.length) {
    return (
      <div className="text-center py-20 text-muted font-mono text-sm">
        No articles yet. Run the pipeline to generate your first digest.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-[360px]">
      {articles.map((article, i) => {
        const elements = [];

        // Insert BuildThisCard at position 2
        if (i === 1 && buildThisPick) {
          elements.push(
            <div key="build-this" className="border-b border-r border-border h-full">
              <BuildThisCard pick={buildThisPick} />
            </div>
          );
        }

        elements.push(
          <div key={article.id} className="border-b border-r border-border h-full">
            <ArticleCard article={article} />
          </div>
        );

        return elements;
      })}
    </div>
  );
}
