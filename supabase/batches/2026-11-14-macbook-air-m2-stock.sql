-- ২০২৬-১১-১৪: MacBook Air 13" M2-এর ১৯টা দামই স্টকে নেই (৫৮ ভিউ, ৭ দিনে ৩২), তাই স্টকে থাকা দোকান যোগ। পাতা খুলে শিরোনাম, ভার্সন আর "Add to cart"/"In Stock" মেলানো।
-- Arafa Telecom 8/256 (8-core GPU) ৳123999, unofficial (দোকানের বাকি Mac-ও তাই); PC House 8GB/256GB Midnight ৳149000, official।
-- বাদ: Arafa 8/512 পাতায় 8-core GPU, আমাদের 8GB / 512GB ভার্সন 10-core GPU; Dazzle-এর JSON-LD InStock কিন্তু পাতায় "Not in stock / Discontinued"।
-- একই লিংক আগে থাকলে কিছু হয় না; দাম আর স্টক পরের prices run ঠিক করবে।
begin;

insert into offers (variant_id, seller_id, condition, price, in_stock, url, source, published, checked_at)
select v.id, 'd8ad0f31-5e69-40a9-bcde-99aeafef75f2', 'unofficial', 123999, true, 'https://arafatelecom.com/product/apple-macbook-air-m2-13-6-inch-8-256-gb/', 'site', true, now() - interval '7 days'
from variants v join products p on p.id = v.product_id
where p.slug = 'apple-macbook-air-13-m2' and v.label = 'M2 8GB / 256GB'
  and not exists (select 1 from offers where url = 'https://arafatelecom.com/product/apple-macbook-air-m2-13-6-inch-8-256-gb/')
on conflict (variant_id, seller_id, condition) do nothing;

insert into offers (variant_id, seller_id, condition, price, in_stock, url, source, published, checked_at)
select v.id, '4a7dccd5-4dbc-43f1-9b4d-2622ae231915', 'official', 149000, true, 'https://www.pchouse.com.bd/apple-macbook-air-2022-m2-chip-13-6-inch-midnight', 'site', true, now() - interval '7 days'
from variants v join products p on p.id = v.product_id
where p.slug = 'apple-macbook-air-13-m2' and v.label = 'M2 8GB / 256GB'
  and not exists (select 1 from offers where url = 'https://www.pchouse.com.bd/apple-macbook-air-2022-m2-chip-13-6-inch-midnight')
on conflict (variant_id, seller_id, condition) do nothing;

commit;
