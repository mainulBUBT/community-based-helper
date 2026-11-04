-- ২০২৬-১১-০৪: iPad 11-inch (A16) এ Diamu এর ভুল অফার। পাতাটা "Apple iPad 10.2 2021 (9th Generation) 256GB Wi-Fi + Cellular"
-- (পাতায় A16 এর উল্লেখ নেই, 10.2 ৯ বার, 9th ৭ বার); ক্যাটালগে ৯ম প্রজন্মের iPad নেই।
-- অফার সরিয়ে প্রত্যাখ্যাত যাচাই রাখা, যাতে discover একই লিংক আবার ওই পণ্যে না বসায়। ইতিমধ্যে লাইভে চালানো।
begin;

insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'Apple iPad 10.2 2021 (9th Generation) 256GB Wi-Fi + Cellular', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Apple iPad 11-inch (A16) 256GB Wi-Fi + Cellular', 'reason', 'পাতাটা iPad 10.2 (৯ম প্রজন্ম), iPad 11-inch (A16) নয়', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = '3ca2ab53-9cb1-4e97-b7b3-efc8788bc781' and o.url like '%ipad-10-2-2021-9th-generation%';

delete from offers where id = '3ca2ab53-9cb1-4e97-b7b3-efc8788bc781' and url like '%ipad-10-2-2021-9th-generation%';

commit;
