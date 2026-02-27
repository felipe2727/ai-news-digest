import { createClient } from "@/lib/supabase/server";
import type { Digest, Article } from "@/lib/types";
import { parseProjectPicks, type ProjectPick } from "@/components/blog/ProjectPicks";

export async function getLatestDigest(): Promise<{
  digest: Digest;
  articles: Article[];
} | null> {
  const supabase = await createClient();

  // Try the most recent digests and return the first one that has articles
  const { data: digests } = await supabase
    .from("digests")
    .select("*")
    .order("generated_at", { ascending: false })
    .limit(5);

  if (!digests?.length) return null;

  for (const digest of digests) {
    const { data: articles } = await supabase
      .from("articles")
      .select("*")
      .eq("digest_id", digest.id)
      .order("score", { ascending: false });

    if (articles && articles.length > 0) {
      return { digest, articles };
    }
  }

  // Fallback: return the latest digest even with no articles
  return { digest: digests[0], articles: [] };
}

export async function getDigestByDate(dateStr: string): Promise<{
  digest: Digest;
  articles: Article[];
} | null> {
  const supabase = await createClient();
  // Find digests generated on the given date (YYYY-MM-DD)
  const dayStart = `${dateStr}T00:00:00Z`;
  const dayEnd = `${dateStr}T23:59:59Z`;

  const { data: digests } = await supabase
    .from("digests")
    .select("*")
    .gte("generated_at", dayStart)
    .lte("generated_at", dayEnd)
    .order("generated_at", { ascending: false })
    .limit(5);

  if (!digests?.length) return null;

  // Prefer the digest that actually has articles
  for (const digest of digests) {
    const { data: articles } = await supabase
      .from("articles")
      .select("*")
      .eq("digest_id", digest.id)
      .order("score", { ascending: false });

    if (articles && articles.length > 0) {
      return { digest, articles };
    }
  }

  // Fallback: return the latest digest for this date even with no articles
  return { digest: digests[0], articles: [] };
}

export async function getAvailableDigestDates(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("digests")
    .select("generated_at")
    .order("generated_at", { ascending: false })
    .limit(60);

  if (!data) return [];
  // Deduplicate dates (multiple digests can exist on the same day)
  const seen = new Set<string>();
  return data
    .map((d) => new Date(d.generated_at).toISOString().split("T")[0])
    .filter((date) => {
      if (seen.has(date)) return false;
      seen.add(date);
      return true;
    });
}

export async function getDigests(
  limit = 20,
  offset = 0
): Promise<Digest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("digests")
    .select("*")
    .order("generated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return data || [];
}

export async function getDigestById(
  id: string
): Promise<{ digest: Digest; articles: Article[] } | null> {
  const supabase = await createClient();
  const { data: digest } = await supabase
    .from("digests")
    .select("*")
    .eq("id", id)
    .single();

  if (!digest) return null;

  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .eq("digest_id", digest.id)
    .order("score", { ascending: false });

  return { digest, articles: articles || [] };
}

export async function getArticles(params: {
  topic?: string;
  source?: string;
  sort?: "score" | "date";
  limit?: number;
  offset?: number;
}): Promise<Article[]> {
  const supabase = await createClient();
  let query = supabase.from("articles").select("*");

  if (params.topic) {
    query = query.contains("matched_topics", [params.topic]);
  }
  if (params.source) {
    query = query.eq("source_type", params.source);
  }

  const sortCol = params.sort === "date" ? "published_at" : "score";
  query = query.order(sortCol, { ascending: false });

  const limit = params.limit || 30;
  const offset = params.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data } = await query;
  return data || [];
}

export async function getArticleBySlug(
  slug: string
): Promise<Article | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .single();

  return data || null;
}

export async function searchArticles(
  query: string,
  limit = 20
): Promise<Article[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("*")
    .textSearch("search_vector", query, { type: "websearch" })
    .order("score", { ascending: false })
    .limit(limit);

  return data || [];
}

export async function getDigestsWithPicks(
  limit = 10
): Promise<{ id: string; generated_at: string; project_recommendations: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("digests")
    .select("id, generated_at, project_recommendations")
    .neq("project_recommendations", "")
    .neq("project_recommendations", "[]")
    .order("generated_at", { ascending: false })
    .limit(limit);

  return data || [];
}

export interface BuildLibraryItem {
  digest_id: string;
  generated_at: string;
  date: string;
  pick: ProjectPick;
}

function projectSignature(pick: ProjectPick): string {
  const name = (pick.name || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const desc = (pick.description || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return `${name}|${desc.slice(0, 120)}`;
}

function getUniquePick(
  raw: string,
  used: Set<string>
): ProjectPick | null {
  const picks = parseProjectPicks(raw);
  for (const pick of picks) {
    if (!pick?.name || !pick?.description) continue;
    const sig = projectSignature(pick);
    if (used.has(sig)) continue;
    used.add(sig);
    return pick;
  }
  return null;
}

export async function getBuildLibraryProjects(
  limitDays = 30
): Promise<BuildLibraryItem[]> {
  const supabase = await createClient();
  const { data: digests } = await supabase
    .from("digests")
    .select("id, generated_at, project_recommendations")
    .neq("project_recommendations", "")
    .neq("project_recommendations", "[]")
    .order("generated_at", { ascending: false })
    .limit(Math.max(limitDays * 8, 60));

  if (!digests?.length) return [];

  // Determine "today" based on latest digest that actually has a usable project.
  let latestDateWithProject: string | null = null;
  for (const digest of digests) {
    const picks = parseProjectPicks(digest.project_recommendations);
    if (picks.length > 0) {
      latestDateWithProject = new Date(digest.generated_at).toISOString().split("T")[0];
      break;
    }
  }

  const usedSignatures = new Set<string>();
  const usedDates = new Set<string>();
  const out: BuildLibraryItem[] = [];

  for (const digest of digests) {
    if (out.length >= limitDays) break;

    const date = new Date(digest.generated_at).toISOString().split("T")[0];
    if (latestDateWithProject && date === latestDateWithProject) continue; // current day lives on home hero
    if (usedDates.has(date)) continue; // one project per day in library

    const pick = getUniquePick(digest.project_recommendations, usedSignatures);
    if (!pick) continue;

    usedDates.add(date);
    out.push({
      digest_id: digest.id,
      generated_at: digest.generated_at,
      date,
      pick,
    });
  }

  return out;
}

export async function getRelatedArticles(
  article: Article,
  limit = 4
): Promise<Article[]> {
  if (!article.matched_topics.length) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("*")
    .contains("matched_topics", [article.matched_topics[0]])
    .neq("id", article.id)
    .order("score", { ascending: false })
    .limit(limit);

  return data || [];
}
