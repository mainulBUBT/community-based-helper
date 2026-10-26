-- অ্যাডমিনের AI সেটিংসে প্রতিটা প্রোভাইডারের পুরো key ঘরেই থাকে (চোখের বোতামে দেখা যায়); শুধু অ্যাডমিন পায়
create or replace function llm_keys() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce((select value -> 'llmKeys' from public.private_settings), '{}')
  where public.is_admin();
$$;

revoke execute on function llm_keys() from public, anon;
grant execute on function llm_keys() to authenticated;
