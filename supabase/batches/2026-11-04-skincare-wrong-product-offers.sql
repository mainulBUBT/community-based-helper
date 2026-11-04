-- ২০২৬-১১-০৪: skincare এ ভুল পণ্য/সাইজে বসা ৩টা অফার ঠিক (পাতার আসল শিরোনাম পড়ে যাচাই করা)।
-- ইতিমধ্যে লাইভে চালানো; রেকর্ড। প্রতিটা বদলে id + url গার্ড আছে।
begin;

-- ১. CeraVe Hydrating Cleanser এ Glowella এর লিংক আসলে Cetaphil Hydrating Foaming Cream Cleanser (অন্য ব্র্যান্ড, ক্যাটালগে নেই)।
-- অফার সরিয়ে প্রত্যাখ্যাত যাচাই বসানো, যাতে discover একই লিংক আবার ওই পণ্যে না বসায়।
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'Cetaphil Hydrating Foaming Cream Cleanser 236ml', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'CeraVe Hydrating Cleanser 236ml', 'reason', 'পাতাটা Cetaphil এর পণ্য, CeraVe নয়', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = '1bce86b6-995a-44d8-bb7f-652b6bc7e0c1' and o.url like '%cetaphil-hydrating-foaming-cream-cleanser%';
delete from offers where id = '1bce86b6-995a-44d8-bb7f-652b6bc7e0c1' and url like '%cetaphil-hydrating-foaming-cream-cleanser%';

-- ২. Sebamed Clear Face Cleansing Foam: IndianMartBD এর লিংক 50ml (URL আর শিরোনামে), অথচ 150ml ভার্সনে বসা ছিল → নতুন 50ml ভার্সন
insert into variants (product_id, label, attributes, position)
select p.id, '50ml', '{"capacity": "50ml"}'::jsonb, 1 from products p
where p.slug = 'sebamed-clear-face-cleansing-foam' and not exists (select 1 from variants v where v.product_id = p.id and v.label = '50ml');
update offers set variant_id = (select v.id from variants v join products p on p.id = v.product_id where p.slug = 'sebamed-clear-face-cleansing-foam' and v.label = '50ml'), variant_key = null
where id = 'cb22b0f7-e924-4ad4-b984-5c42eed926b7' and url like '%sebamed-clear-face-cleansing-foam-50ml%';

-- ৩. Acnes Creamy Wash: Chardike এর লিংক 130g (URL আর শিরোনামে, ৳৯৫১), অথচ 50gm ভার্সনে বসা ছিল → নতুন 130g ভার্সন
insert into variants (product_id, label, attributes, position)
select p.id, '130g', '{"capacity": "130g"}'::jsonb, 1 from products p
where p.slug = 'acnes-creamy-wash' and not exists (select 1 from variants v where v.product_id = p.id and v.label = '130g');
update offers set variant_id = (select v.id from variants v join products p on p.id = v.product_id where p.slug = 'acnes-creamy-wash' and v.label = '130g'), variant_key = null
where id = 'f0dba8f5-97f0-4612-8f7b-da2ba453d87a' and url like '%acnes-creamy-face-wash-130g%';

commit;
