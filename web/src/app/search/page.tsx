"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import ArticleCard from "@/components/blog/ArticleCard";
import type { Article } from "@/lib/types";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Article[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    const supabase = createClient();
    const { data } = await supabase
      .from("articles")
      .select("*")
      .textSearch("search_vector", q, { type: "websearch" })
      .order("score", { ascending: false })
      .limit(20);

    setResults(data || []);
    setLoading(false);
  }, []);

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        <h1 className="serif-headline text-3xl mb-6">Search</h1>

        <div className="relative mb-8">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-mono text-sm">
            $
          </span>
          <input
            type="text"
            placeholder="search --query &quot;your search here&quot;"
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              const timer = setTimeout(() => handleSearch(val), 300);
              return () => clearTimeout(timer);
            }}
            className="w-full pl-8 pr-4 py-3 bg-surface border border-border text-sm font-mono text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>

        {loading && (
          <div className="text-center py-12 text-muted text-sm font-mono">
            Searching...
          </div>
        )}

        {searched && !loading && (
          <p className="text-[11px] font-mono text-muted mb-4">
            {results.length} result{results.length !== 1 ? "s" : ""} found
          </p>
        )}

        <div className="flex flex-col">
          {results.map((article) => (
            <div key={article.id} className="border-b border-border">
              <ArticleCard article={article} />
            </div>
          ))}
        </div>

        {searched && !loading && results.length === 0 && (
          <div className="text-center py-12 text-muted text-sm font-mono">
            No articles match your search.
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
