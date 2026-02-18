"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import ArticleCard from "@/components/blog/ArticleCard";
import type { Article } from "@/lib/types";
import { Search } from "lucide-react";

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
      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="font-[var(--font-instrument-serif)] text-3xl mb-6">
          Search
        </h1>

        <div className="relative mb-8">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            type="text"
            placeholder="Search articles..."
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              // Debounce
              const timer = setTimeout(() => handleSearch(val), 300);
              return () => clearTimeout(timer);
            }}
            className="w-full pl-11 pr-4 py-3 rounded-xl glass text-sm outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        {loading && (
          <div className="text-center py-12 text-[var(--muted)] text-sm">
            Searching...
          </div>
        )}

        {searched && !loading && (
          <p className="text-sm text-[var(--muted)] mb-4">
            {results.length} result{results.length !== 1 ? "s" : ""} found
          </p>
        )}

        <div className="flex flex-col gap-3">
          {results.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>

        {searched && !loading && results.length === 0 && (
          <div className="text-center py-12 text-[var(--muted)] text-sm">
            No articles match your search.
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
