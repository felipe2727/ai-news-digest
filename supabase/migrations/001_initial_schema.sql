-- Core content tables
create table digests (
  id                      uuid default gen_random_uuid() primary key,
  generated_at            timestamptz not null,
  intro_summary           text not null default '',
  project_recommendations text not null default '',
  total_items             integer not null default 0,
  sources_checked         integer not null default 0,
  created_at              timestamptz default now()
);

create table articles (
  id              uuid default gen_random_uuid() primary key,
  digest_id       uuid not null references digests(id) on delete cascade,
  item_hash       text not null,
  title           text not null,
  slug            text not null unique,
  url             text not null,
  source_name     text not null,
  source_type     text not null,
  published_at    timestamptz,
  score           real not null default 0,
  matched_topics  text[] not null default '{}',
  summary         text not null default '',
  content_snippet text not null default '',
  extra           jsonb not null default '{}',
  section_title   text not null default '',
  -- Phase 2 prep
  linkedin_post    text,
  twitter_post     text,
  social_image_url text,
  created_at      timestamptz default now()
);

create index idx_articles_digest on articles(digest_id);
create index idx_articles_slug on articles(slug);
create index idx_articles_source_type on articles(source_type);
create index idx_articles_score on articles(score desc);
create index idx_articles_published on articles(published_at desc);

-- Newsletter
create table subscribers (
  id            uuid default gen_random_uuid() primary key,
  email         text not null unique,
  confirmed     boolean not null default false,
  confirm_token text,
  unsub_token   text not null default gen_random_uuid()::text,
  created_at    timestamptz default now(),
  confirmed_at  timestamptz
);

create table newsletter_sends (
  id            uuid default gen_random_uuid() primary key,
  digest_id     uuid references digests(id),
  subscriber_id uuid references subscribers(id),
  sent_at       timestamptz default now(),
  resend_id     text
);

-- Auth profiles
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'reader' check (role in ('reader', 'admin')),
  created_at timestamptz default now()
);

-- Analytics
create table page_views (
  id         bigint generated always as identity primary key,
  path       text not null,
  referrer   text,
  user_agent text,
  created_at timestamptz default now()
);

create table article_clicks (
  id         bigint generated always as identity primary key,
  article_id uuid references articles(id) on delete cascade,
  created_at timestamptz default now()
);

create index idx_clicks_article on article_clicks(article_id);
create index idx_clicks_created on article_clicks(created_at desc);
