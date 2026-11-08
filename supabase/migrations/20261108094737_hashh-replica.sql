-- Hashh Sneaker কপি জুতা বেচে (৳১,৭৮০–৫,৪৮০), কিন্তু worker কনফিগে official ছিল বলে দাম "আসল" হিসেবে বসেছিল
update offers o
set condition = 'replica'
from sellers s
where s.id = o.seller_id
  and s.website ilike '%hashh.store%'
  and o.condition = 'official'
  and not exists (
    select 1 from offers r
    where r.variant_id = o.variant_id and r.seller_id = o.seller_id and r.condition = 'replica'
  );
