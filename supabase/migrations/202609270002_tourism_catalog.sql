-- Catalog the tourism data already bundled with the VietGo project.
create table if not exists public.tourism_catalog (
  record_id text primary key,
  record_type text not null check (record_type in ('province', 'poi', 'food', 'festival', 'souvenir', 'travel_tip')),
  province_id text,
  province_name text not null,
  name text not null,
  category text,
  payload jsonb not null,
  source text not null default 'vietgo-project',
  updated_at timestamptz not null default now()
);

create index if not exists tourism_catalog_type_province_idx
  on public.tourism_catalog (record_type, province_id);
create index if not exists tourism_catalog_payload_search_idx
  on public.tourism_catalog using gin (payload);
create index if not exists tourism_catalog_name_search_idx
  on public.tourism_catalog using gin (to_tsvector('simple', province_name || ' ' || name || ' ' || coalesce(category, '')));

alter table public.tourism_catalog enable row level security;
revoke all on table public.tourism_catalog from anon, authenticated;
grant select, insert, update, delete on table public.tourism_catalog to service_role;
