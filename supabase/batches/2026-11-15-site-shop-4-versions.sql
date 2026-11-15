-- ২০২৬-১১-১৫: ১৫ নভেম্বর "পাতায় মেলেনি" চারটা ভার্সন হাতে খুলে যাচাই করা হয়েছে (Mobile Buzz, Gadget & Gear, Sumash, Kry)।
-- Mobile Buzz BD: tecno-spark-50c পাতায় এখন শুধু official অপশন — ৪/৬৪ ৳২০,৯৯৯, ৪/১২৮ ৳২২,৯৯৯ (old ৳২৯,৯৯৯)।
--   unofficial ৳১০,০০০ আর নেই (পাতায় "unofficial" শুধু দোকানের বর্ণনায়); তাই অফারটা official ৳২২,৯৯৯-এ বাঁধা হলো।
-- Gadget & Gear: honor-200-5g-12gb-256gb পাতার এক দাম ৳৩৭,৯৯৯, স্টক নেই। একই লিংকে official + unofficial দুটো একই অফার,
--   বাড়তি পুরনো unofficial কপিটা বাদ। লিংকে official অফার থেকে গেছে, তাই discover লিংকটা চেনা হিসেবে রাখবে।
-- Sumash Tech: pixel-9-pro-official পাতায় "12/128GB" লেখা (দোকানের টাইপো; Pixel 9 Pro আসলে 16GB RAM), দাম ৳১,০৪,৯৯৯ ঠিক।
--   ক্যাটালগের 16GB / 128GB অফারই সঠিক — বদলানো হয়নি।
-- Kry International: nothing-phone-3a পাতায় এখন শুধু 12GB / 256GB ৳৪৮,৯৯৯ (ক্যাটালগে এই ভার্সন নেই)।
--   ৮/১২৮ আর ৮/২৫৬ দুটোই পাতায় নেই; লিংকে আর কোনো অফার থাকে না, তাই review_queue-তে rejected।
-- প্রতিটা বদলে id + url গার্ড; আবার চালালে কিছুই বদলায় না।
begin;

-- ১. Mobile Buzz BD | tecno-spark-50c 4GB / 128GB | unofficial ৳১০,০০০ → official ৳২২,৯৯৯ (old ৳২৯,৯৯৯)
update offers
set condition = 'official', price = 22999, old_price = 29999, in_stock = true,
    variant_key = '128gb 4gb official', checked_at = now(), published = true
where id = '55e69c14-37c4-469e-b327-932d51c1d5bf'
  and url = 'https://mobilebuzzbd.com/product/tecno-spark-50c/'
  and (price <> 22999 or old_price is distinct from 29999 or condition <> 'official'
       or variant_key is distinct from '128gb 4gb official' or in_stock is not true);

-- ২. Gadget & Gear | honor-200-5g 12GB / 256GB | একই লিংকে একই দাম, unofficial বাড়তি কপি বাদ
delete from offers
where id = 'feba5b7d-9c13-47a1-bd08-f4f6d15cc14a'
  and url = 'https://gadgetandgear.com/product/honor-200-5g-12gb-256gb';

-- ৩. Kry International | nothing-phone-3a 8GB / 256GB | পাতায় এই ভার্সন নেই (এখন শুধু 12GB / 256GB)
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'Nothing Phone 3a', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Phone 3a 8GB / 256GB', 'reason', 'পাতায় এখন শুধু 12GB / 256GB',
    'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = '01f73a5e-25a5-4854-bcde-906e74e56f40'
  and o.url = 'https://kryinternational.com/products/nothing-phone-3a';
delete from offers
where id = '01f73a5e-25a5-4854-bcde-906e74e56f40'
  and url = 'https://kryinternational.com/products/nothing-phone-3a';

-- ৪. Kry International | nothing-phone-3a 8GB / 128GB | পাতায় এই ভার্সনও নেই
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'Nothing Phone 3a', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Phone 3a 8GB / 128GB', 'reason', 'পাতায় এখন শুধু 12GB / 256GB',
    'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = 'cd185d41-87a1-4ef9-b4ac-0be4815532ec'
  and o.url = 'https://kryinternational.com/products/nothing-phone-3a';
delete from offers
where id = 'cd185d41-87a1-4ef9-b4ac-0be4815532ec'
  and url = 'https://kryinternational.com/products/nothing-phone-3a';

commit;
