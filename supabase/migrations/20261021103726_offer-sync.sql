-- পাতার কোন অপশনের দাম এই offer ধরে রাখে (রং/region বাদ দিয়ে), যাতে এক লিংকের সব ভার্সন আলাদা করে আপডেট হয়
alter table offers add column variant_key text;

-- নতুন পণ্য বা নতুন ভার্সন এলে discover সাথে সাথে চলে; requested > discovered মানে খোঁজা বাকি
alter table products
  add column discover_requested_at timestamptz not null default now(),
  add column discovered_at timestamptz;

create function queue_discover() returns void
language sql security definer set search_path = public as $$
  update jobs set run_requested_at = now()
  where id = 'discover' and enabled
    and (run_requested_at is null or run_requested_at <= coalesce(last_run_at, '-infinity'));
$$;

revoke execute on function queue_discover() from public, anon, authenticated;

create function products_need_discover() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform queue_discover();
  return null;
end;
$$;

create function variants_need_discover() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update products set discover_requested_at = now() where id in (select product_id from added);
  perform queue_discover();
  return null;
end;
$$;

create trigger products_discover after insert on products
  for each statement execute function products_need_discover();

create trigger variants_discover after insert on variants
  referencing new table as added
  for each statement execute function variants_need_discover();

-- Gadget & Gear এর দামও এখন সাধারণ HTML থেকে আসে, আলাদা ব্রাউজার job লাগে না
delete from jobs where id = 'js-stores';
update jobs set schedule = 'নতুন পণ্য যোগ হলেই, আর প্রতি রাতে' where id = 'discover';
update jobs set schedule = 'প্রতি ৬ ঘণ্টায়' where id = 'prices';
