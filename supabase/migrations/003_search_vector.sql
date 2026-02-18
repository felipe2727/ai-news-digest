-- Full-text search on articles
alter table articles add column search_vector tsvector
  generated always as (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(summary, '') || ' ' ||
      coalesce(content_snippet, '')
    )
  ) stored;

create index idx_articles_search on articles using gin(search_vector);
