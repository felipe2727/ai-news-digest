-- Enable RLS on all tables
alter table digests enable row level security;
alter table articles enable row level security;
alter table subscribers enable row level security;
alter table newsletter_sends enable row level security;
alter table profiles enable row level security;
alter table page_views enable row level security;
alter table article_clicks enable row level security;

-- Public read for content
create policy "Public read digests" on digests for select using (true);
create policy "Public read articles" on articles for select using (true);

-- Subscribers: public insert (signup), admin read
create policy "Anyone can subscribe" on subscribers for insert with check (true);
create policy "Admin read subscribers" on subscribers for select
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
create policy "Admin update subscribers" on subscribers for update
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- Profiles: users read own, admins read all
create policy "Read own profile" on profiles for select using (auth.uid() = id);
create policy "Admin read all profiles" on profiles for select
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- Analytics: public insert, admin read
create policy "Public insert page_views" on page_views for insert with check (true);
create policy "Public insert clicks" on article_clicks for insert with check (true);
create policy "Admin read page_views" on page_views for select
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
create policy "Admin read clicks" on article_clicks for select
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- Newsletter sends: admin only
create policy "Admin read newsletter_sends" on newsletter_sends for select
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
