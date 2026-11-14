-- ১৪ নভেম্বর ২০২৬: ৩ দিনের বেশি না-হালনাগাদ দামের ডেটা-ভুল ঠিক করা।
-- চালানো: npx supabase db query --linked -f supabase/batches/2026-11-14-stale-offers-cleanup.sql
-- আবার চালালে কিছু বদলায় না (প্রতিটা ধাপ id/লেবেল দিয়ে গার্ড করা)।
--
-- মূল কারণ: import-catalog.mjs ভার্সনের id দেয় তালিকার ক্রমে (~v1, ~v2)। ২৮ অক্টোবর dates.json-এ 250g তালিকার শুরুতে বসায়
-- ~v1 (DB-তে 500g) আর ~v2 (DB-তে 1kg) JSON-এ 250g আর 500g হয়ে যায়; seed নতুন ~v3 "1kg" বানায় আর 500g-এর দাম 1kg-তে বসায়।
-- ২ নভেম্বরের ক্লিনআপ শুধু অফার মুছেছিল, ভার্সন থেকে যাওয়ায় seed আবার একই সারি ফিরিয়েছে।
-- এখন JSON-এর ক্রম DB-র সাথে মেলানো (500g, 1kg, 250g; মধু 400g, 300g) আর DB-র বাড়তি ভার্সনকে JSON-এর ~v3/~v2 বানানো।

begin;

-- ক. 1kg ভার্সনে বসা 500g পাতার দাম (Khaas Food, Holy Basket ajwa-dates-500gm): একই লিংক 500g-তে আগে থেকেই আছে
delete from offers o
where o.variant_id in ('a6a91f77-b18c-1335-d2f5-74c05a30d24d', 'd08ba22d-3795-0a57-233b-4fb4f6276198')
  and exists (
    select 1 from offers x
    where x.url = o.url and x.seller_id = o.seller_id
      and x.variant_id in ('f7f0977c-90c0-77ec-b2c4-4a313b7bbb57', 'd2424b88-bbd4-dafa-3f39-74a9fc08c7a9')
  );

-- খ. একই লেবেলের দ্বিতীয় ভার্সনের দাম আসলটায়; একই দোকান-অবস্থা দুই জায়গায় থাকলে সবশেষে যাচাই হওয়াটা থাকে
create temporary table variant_merge (keep uuid, drop_id uuid) on commit drop;
insert into variant_merge values
  ('a6a91f77-b18c-1335-d2f5-74c05a30d24d', '3ce149bd-1e52-4b58-d60e-85edccdfcb30'), -- ajwa-dates 1kg
  ('d08ba22d-3795-0a57-233b-4fb4f6276198', '6ed1346b-3980-7471-b741-e99e55845338'), -- maryam-mabroom-dates 1kg
  ('92304706-afc1-8f0a-1ce5-6a12f38eda32', '3c1b6c59-6cb2-f965-f010-e0e52a42de66'), -- medjool-dates 1kg
  ('5f6d3ee9-dd0d-a04f-2e56-85bfcea11d43', '70ff3cde-f862-92ec-abd5-00dd1c548bc6'); -- karkuma-organic-honey 400g

delete from offers d using variant_merge m, offers k
where d.variant_id = m.drop_id and k.variant_id = m.keep
  and k.seller_id = d.seller_id and k.condition = d.condition and k.checked_at >= d.checked_at
  and exists (select 1 from variants v where v.id = m.drop_id and v.label = (select label from variants where id = m.keep));
delete from offers k using variant_merge m, offers d
where k.variant_id = m.keep and d.variant_id = m.drop_id
  and k.seller_id = d.seller_id and k.condition = d.condition
  and exists (select 1 from variants v where v.id = m.drop_id and v.label = (select label from variants where id = m.keep));
update offers o set variant_id = m.keep, variant_key = null
from variant_merge m
where o.variant_id = m.drop_id
  and exists (select 1 from variants v where v.id = m.drop_id and v.label = (select label from variants where id = m.keep));

-- গ. খালি হওয়া ভার্সন এখন JSON-এর ~v3 (250g) / ~v2 (300g); হাতে বানানো আলাদা-id-র 250g/300gm-এর দাম সেখানে, পুরনোটা মোছা
update variants set label = '250g', attributes = '{"capacity": "250g"}'::jsonb, position = 3
where id in ('3ce149bd-1e52-4b58-d60e-85edccdfcb30', '6ed1346b-3980-7471-b741-e99e55845338', '3c1b6c59-6cb2-f965-f010-e0e52a42de66') and label = '1kg';
update variants set label = '300g', attributes = '{"capacity": "300g"}'::jsonb, position = 2
where id = '70ff3cde-f862-92ec-abd5-00dd1c548bc6' and label = '400g';

create temporary table variant_move (target uuid, slug text, old_label text) on commit drop;
insert into variant_move values
  ('3ce149bd-1e52-4b58-d60e-85edccdfcb30', 'ajwa-dates', '250g'),
  ('6ed1346b-3980-7471-b741-e99e55845338', 'maryam-mabroom-dates', '250g'),
  ('70ff3cde-f862-92ec-abd5-00dd1c548bc6', 'karkuma-organic-honey', '300gm');

create temporary table variant_old on commit drop as
select v.id, m.target from variant_move m
join products p on p.slug = m.slug
join variants v on v.product_id = p.id and v.label = m.old_label and v.id <> m.target;

delete from offers o using variant_old x, offers t
where o.variant_id = x.id and t.variant_id = x.target and t.seller_id = o.seller_id and t.condition = o.condition;
update offers o set variant_id = x.target, variant_key = null from variant_old x where o.variant_id = x.id;
delete from variants v using variant_old x where v.id = x.id;

-- ঘ. একই লিংক, একই ভার্সন, অন্য অবস্থার পুরনো সারি (দোকান এখন একটাই অবস্থায় বেচে; নতুনটা প্রতিদিন হালনাগাদ হচ্ছে)
delete from offers where id in (
  '9e7a7f8a-e6c5-45d5-a725-ad3b928931bc', -- Othoba American Gourmet Honey official (unofficial সারি চলছে)
  'f35f3b0c-7ab7-4c27-b3ee-4006148e5b5a', -- Star Tech Buds3 Pro unofficial
  '8fee7aa5-0586-4073-bb0f-dfb6c1b861f9', -- MC Solution MacBook Air 15 M3 8/512 unofficial
  '30b606ca-4a46-4cdd-ab8f-df5bae5e04f4', -- MC Solution MacBook Air 15 M3 16/512 unofficial
  'f48ec1aa-4504-46f6-a980-c9d37e997396', -- Star Tech Mac Studio M5 Max unofficial
  '3a19d03b-56b0-4092-9eca-8e6816596b25'  -- Diamu Watch Fit 4 official
);

-- ঙ. একই লিংক দুই পণ্য/ভার্সনে: পাতা যাচাই করে ভুলটা মোছা
delete from offers where id in (
  'b8147beb-c242-408e-9fe5-df56f28ba811', -- Glowella: পাতার শিরোনাম "Water Sleeping Mask EX 15ml", সাধারণ 15ml নয়
  '1c1d6a19-6ff8-4507-964a-90051eee090c', -- EmartWay: একই EX 15ml পাতা
  'c1f9daa7-1b1d-4d8e-a20a-4a1e3a0c6c0d'  -- Klassy Missy: পাতা "Daily Moisturising Lotion 473ml", Daily-তে চলছে
);
-- Niacinamide-এর ডুপ্লিকেট পণ্য: 2026-11-11-wrong-offers-niacinamide-dup.sql এখনো চালানো হয়নি, ওটা চালালেই ঠিক

commit;
