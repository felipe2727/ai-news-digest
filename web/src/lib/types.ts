export interface Digest {
  id: string;
  generated_at: string;
  intro_summary: string;
  project_recommendations: string;
  total_items: number;
  sources_checked: number;
  created_at: string;
}

export interface Article {
  id: string;
  digest_id: string;
  item_hash: string;
  title: string;
  slug: string;
  url: string;
  source_name: string;
  source_type: "reddit" | "youtube" | "news" | "github";
  published_at: string | null;
  score: number;
  matched_topics: string[];
  summary: string;
  content_snippet: string;
  extra: Record<string, unknown>;
  section_title: string;
  created_at: string;
}

export interface Subscriber {
  id: string;
  email: string;
  confirmed: boolean;
  created_at: string;
  confirmed_at: string | null;
}

export interface Profile {
  id: string;
  role: "reader" | "admin";
  created_at: string;
}

export type SourceType = Article["source_type"];
