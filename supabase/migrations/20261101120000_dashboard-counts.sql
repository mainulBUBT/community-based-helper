-- অ্যাডমিন ড্যাশবোর্ডের সংখ্যা: পুরো ক্যাটালগ না নামিয়ে ডেটাবেসেই গোনা
create or replace function dashboard_counts()
returns table (review int, no_price int, no_image int, no_specs int, unverified int, old_models int)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from review_queue where status = 'pending')::int,
    (select count(*) from products p where not exists (
      select 1 from variants v join offers o on o.variant_id = v.id where v.product_id = p.id and o.published
    ))::int,
    (select count(*) from products where cardinality(images) = 0)::int,
    (select count(*) from products where jsonb_typeof(specs) <> 'array' or jsonb_array_length(specs) = 0)::int,
    (select count(*) from sellers where not verified)::int,
    (select count(*) from products where active and release_year <= extract(year from now() at time zone 'Asia/Dhaka')::int - 3)::int
  where is_admin();
$$;

revoke execute on function dashboard_counts() from public, anon;
grant execute on function dashboard_counts() to authenticated;
