-- price submissions now arrive only through the submit-price edge function, after a Turnstile check
drop policy "anyone can submit a price" on review_queue;

-- the per-IP limit moves into submit_price: through the edge function every request comes from the function's own IP
create or replace function limit_submissions() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.created_at := now();
  if (select count(*) from public.review_queue where kind = 'submission' and created_at > now() - interval '10 minutes') >= 60 then
    raise exception 'too many submissions, try again later';
  end if;
  return new;
end;
$$;

create function submit_price(payload jsonb, ip text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if jsonb_typeof(payload) <> 'object' or pg_column_size(payload) > 4096 then
    raise exception 'bad submission';
  end if;
  if coalesce(ip, '') <> '' and public.take_hit('submit:ip', ip, interval '10 minutes') > 5 then
    raise exception 'too many submissions, try again later';
  end if;
  insert into public.review_queue (kind, payload) values ('submission', payload);
end;
$$;

revoke execute on function submit_price(jsonb, text) from public, anon, authenticated;
grant execute on function submit_price(jsonb, text) to service_role;
