-- অ্যাডমিনের "ফ্রি সীমা" পাতা: deploy-এর ফাইল আর শেষ commit rebuild লিখে রাখে, বাকিটা ডেটাবেস থেকে গোনা
alter table private_settings add column usage jsonb not null default '{}';

create function usage_stats() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'dbBytes', pg_database_size(current_database()),
    'viewsToday', coalesce((select sum(hits) from public.rate_limits
      where bucket = 'views:day' and window_start = date_bin(interval '1 day', now(), timestamptz '2000-01-01')), 0),
    'alerts', (select count(*) from public.price_alerts),
    'deploysThisMonth', (select count(*) from public.job_runs
      where job_id = 'rebuild' and status = 'ok' and started_at >= date_trunc('month', now())),
    'lastJobRun', (select max(started_at) from public.job_runs),
    'deploy', (select usage from public.private_settings)
  )
  where public.is_admin();
$$;

revoke execute on function usage_stats() from public, anon;
grant execute on function usage_stats() to authenticated;
