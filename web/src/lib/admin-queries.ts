import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [articles, subscribers, digests, clicks] = await Promise.all([
    supabase
      .from("articles")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("confirmed", true),
    supabase
      .from("digests")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("article_clicks")
      .select("id", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo),
  ]);

  return {
    totalArticles: articles.count ?? 0,
    totalSubscribers: subscribers.count ?? 0,
    totalDigests: digests.count ?? 0,
    clicksLast30d: clicks.count ?? 0,
  };
}

export async function getDigestsOverTime(limit = 14) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("digests")
    .select("id, generated_at, total_items")
    .order("generated_at", { ascending: false })
    .limit(limit);

  return (data || []).reverse();
}

export async function getSourceDistribution() {
  const supabase = await createClient();
  const { data } = await supabase.from("articles").select("source_type");

  const counts: Record<string, number> = {};
  (data || []).forEach((row) => {
    counts[row.source_type] = (counts[row.source_type] || 0) + 1;
  });

  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export async function getTopicDistribution() {
  const supabase = await createClient();
  const { data } = await supabase.from("articles").select("matched_topics");

  const counts: Record<string, number> = {};
  (data || []).forEach((row) => {
    (row.matched_topics || []).forEach((t: string) => {
      counts[t] = (counts[t] || 0) + 1;
    });
  });

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);
}

export async function getRecentArticles(limit = 50, offset = 0) {
  const supabase = await createClient();
  const { data, count } = await supabase
    .from("articles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return { articles: data || [], total: count ?? 0 };
}

export async function getSubscribers(limit = 50, offset = 0) {
  const supabase = await createClient();
  const { data, count } = await supabase
    .from("subscribers")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return { subscribers: data || [], total: count ?? 0 };
}

export async function getPageViewsOverTime(days = 30) {
  const supabase = await createClient();
  const since = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data } = await supabase
    .from("page_views")
    .select("created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  // Group by date
  const byDate: Record<string, number> = {};
  (data || []).forEach((row) => {
    const date = row.created_at.split("T")[0];
    byDate[date] = (byDate[date] || 0) + 1;
  });

  return Object.entries(byDate).map(([date, views]) => ({ date, views }));
}
