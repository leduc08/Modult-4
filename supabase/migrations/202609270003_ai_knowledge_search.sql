-- Server-side, bounded full-text retrieval for the AI chat endpoint.
create or replace function public.search_tourism_catalog(search_terms text[], result_limit integer default 8)
returns table (
  record_id text, record_type text, province_id text, province_name text,
  name text, category text, payload jsonb, relevance real
)
language sql stable security invoker
set search_path = public, pg_temp
as $$
  with query_data as (
    select to_tsquery('simple', string_agg(quote_literal(term) || ':*', ' | ')) as tsquery
    from unnest(coalesce(search_terms, array[]::text[])) as terms(term)
    where term ~ '^[[:alnum:]]{2,40}$'
  ), ranked as (
    select c.record_id, c.record_type, c.province_id, c.province_name,
      c.name, c.category, c.payload,
      ts_rank(to_tsvector('simple', c.province_name || ' ' || c.name || ' ' || coalesce(c.category, '')), q.tsquery) as rank
    from public.tourism_catalog c cross join query_data q
    where q.tsquery is not null
      and (to_tsvector('simple', c.province_name || ' ' || c.name || ' ' || coalesce(c.category, '')) @@ q.tsquery
        or to_tsvector('simple', c.payload::text) @@ q.tsquery)
  )
  select ranked.record_id, ranked.record_type, ranked.province_id, ranked.province_name,
    ranked.name, ranked.category, ranked.payload, ranked.rank
  from ranked order by ranked.rank desc, ranked.record_type, ranked.name
  limit least(greatest(coalesce(result_limit, 8), 1), 12);
$$;

create or replace function public.search_knowledge_documents(search_terms text[], result_limit integer default 4)
returns table (id text, title text, content text, source_url text, relevance real)
language sql stable security invoker
set search_path = public, pg_temp
as $$
  with query_data as (
    select to_tsquery('simple', string_agg(quote_literal(term) || ':*', ' | ')) as tsquery
    from unnest(coalesce(search_terms, array[]::text[])) as terms(term)
    where term ~ '^[[:alnum:]]{2,40}$'
  ), ranked as (
    select d.id::text as id, d.title, d.content, d.source_url,
      ts_rank(to_tsvector('simple', d.title || ' ' || d.content), q.tsquery) as rank
    from public.knowledge_documents d cross join query_data q
    where d.dataset_ref = 'vuonglsts/vietnam-tourism-v2'
      and d.dataset_version = 1 and d.split = 'train'
      and q.tsquery is not null
      and to_tsvector('simple', d.title || ' ' || d.content) @@ q.tsquery
  )
  select ranked.id, ranked.title, ranked.content, ranked.source_url, ranked.rank
  from ranked order by ranked.rank desc, ranked.title
  limit least(greatest(coalesce(result_limit, 4), 1), 8);
$$;

revoke all on function public.search_tourism_catalog(text[], integer) from public, anon, authenticated;
revoke all on function public.search_knowledge_documents(text[], integer) from public, anon, authenticated;
grant execute on function public.search_tourism_catalog(text[], integer) to service_role;
grant execute on function public.search_knowledge_documents(text[], integer) to service_role;
