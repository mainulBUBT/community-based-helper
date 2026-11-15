-- Computer Village-এর hp-probook-460-g11-core-ultra-5-laptop পাতাটা আসলে Core Ultra 5 125H 16GB / 512GB
-- (পাতার স্পেক টেবিল আর JSON-LD দুটোতেই; title-এর "8GB" ওদেরই টাইপো)। আমাদের Core Ultra 7 155U 16GB ভার্সনে
-- ভুল করে বসা ছিল; ওদের সাইটে 155U-এর কোনো পাতাই নেই (১৫ নভেম্বরের সাইটম্যাপ)। এই পাতার দাম ৳১২৩,০০০।
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected', jsonb_build_object(
  'listing', 'hp-probook-460-g11-core-ultra-5-laptop',
  'seller', s.name,
  'price', o.price::text,
  'url', o.url,
  'guess', 'Core Ultra 7 155U 16GB / 512GB',
  'reason', 'পাতাটা HP ProBook 460 G11 Core Ultra 5 125H 16GB — ক্যাটালগে এই ভার্সন নেই',
  'sellerId', o.seller_id,
  'variantId', o.variant_id,
  'condition', o.condition
), now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = '604eae75-3a7f-440d-8f87-087292517d51' and o.url = 'https://www.computervillage.com.bd/hp-probook-460-g11-core-ultra-5-laptop';

delete from offers where id = '604eae75-3a7f-440d-8f87-087292517d51' and url = 'https://www.computervillage.com.bd/hp-probook-460-g11-core-ultra-5-laptop';
