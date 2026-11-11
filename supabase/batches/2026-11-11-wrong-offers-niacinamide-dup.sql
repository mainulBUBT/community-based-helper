-- ২০২৬-১১-১১: ভুল পাতার ৩টা অফার সরানো আর ডুপ্লিকেট The Ordinary Niacinamide পণ্য মোছা (পাতার আসল শিরোনাম/স্পেক পড়ে যাচাই করা)।
-- প্রতিটা বদলে id + url গার্ড আছে; আবার চালালে কিছুই বদলায় না।
begin;

-- ১. Kemei KM-6637: Apple Gadgets-এর লিংক খুললে "Kemei KM-1916 4 In 1 Shaver for Women" (অন্য মডেল)।
-- অফার সরিয়ে প্রত্যাখ্যাত যাচাই বসানো, যাতে discover একই লিংক আবার এই পণ্যে না বসায়।
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'Kemei KM-1916 4 In 1 Shaver for Women', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Kemei KM-6637 4-in-1 Shaver for Women', 'reason', 'পাতাটা KM-1916-এর, KM-6637 নয়', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = 'c339364d-d8ec-4d1b-bbd4-43d691a896e9' and o.url = 'https://www.applegadgetsbd.com/product/kemei-km-6637-4-in-1-shaver-for-women';
delete from offers where id = 'c339364d-d8ec-4d1b-bbd4-43d691a896e9' and url = 'https://www.applegadgetsbd.com/product/kemei-km-6637-4-in-1-shaver-for-women';

-- ২. Redmi Pad SE 8.7": Apple Gadgets-এর /product/redmi-pad-se পাতা 11" মডেলের (স্পেকে 11.0", Snapdragon 680)।
-- একই লিংক 11" পণ্যে আগে থেকেই ঠিকভাবে আছে; শুধু 8.7"-এর দুটো অফার সরানো।
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'Redmi Pad SE (11-inch)', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Redmi Pad SE 8.7-inch', 'reason', 'পাতাটা 11" মডেলের, 8.7" নয়', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id in ('4ccf8640-f9f0-4313-9b6c-1c275ae30e4a', '8595e4ba-da56-47d9-8f51-a588f43a301d') and o.url = 'https://www.applegadgetsbd.com/product/redmi-pad-se';
delete from offers where id in ('4ccf8640-f9f0-4313-9b6c-1c275ae30e4a', '8595e4ba-da56-47d9-8f51-a588f43a301d') and url = 'https://www.applegadgetsbd.com/product/redmi-pad-se';

-- ৩. The Ordinary Niacinamide 10% + Zinc 1% 30ml দুবার: `-serum-30ml` (ক্যাটালগে নেই, ৩টা অফার) মোছা; `-30ml`-এ ওই দোকানগুলো
-- (Arogga, Shajgoj একই লিংক; MedEasy আলাদা লিংকে) আগে থেকেই আছে। ভার্সন/অফার cascade-এ যায়; দাম-কমার সতর্কতা ০টা।
-- পুরনো ঠিকানা public/_redirects-এ 301।
delete from products
where slug = 'the-ordinary-niacinamide-10-zinc-1-serum-30ml'
  and exists (select 1 from products where slug = 'the-ordinary-niacinamide-10-zinc-1-30ml');

commit;
