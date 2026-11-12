-- ২০২৬-১১-১২: স্টকে ২টা দোকানের পণ্যে নতুন দোকান (৮৪টা দোকানে discover, প্রতিটা পাতা worker-এর reader দিয়ে পড়া)।
-- Sebamed Clear Face Cleansing Foam 150ml ← BanglaShoppers ৳1290; Technic Mega Lash Volumising Mascara 14ml ← Smart Deal ৳380 ("Black 14ml")।
-- বাদ: Beprincess-এর "#Maroon" পাতায় 12ml লেখা, Beauty Booth-এর 14ml পাতায় "Water Resistant" লেখা; দুটোই নিশ্চিত নয়।
-- একই দোকান-ভার্সন আগে থাকলে বা লিংক অন্য কোথাও বসানো থাকলে কিছু হয় না; স্টক পরের prices run ঠিক করবে।
begin;

insert into offers (variant_id, seller_id, condition, price, url, source, published, checked_at)
select v.id, '7ca277c6-f1ef-4eb6-b841-40783afe4e71', 'official', 1290, 'https://www.banglashoppers.com/sebamed-clear-face-cleansing-foam-for-acne-prone-skin-150-ml.html', 'site', true, now() - interval '7 days'
from variants v join products p on p.id = v.product_id
where p.slug = 'sebamed-clear-face-cleansing-foam' and v.label = '150ml'
  and not exists (select 1 from offers where url = 'https://www.banglashoppers.com/sebamed-clear-face-cleansing-foam-for-acne-prone-skin-150-ml.html')
on conflict (variant_id, seller_id, condition) do nothing;

insert into offers (variant_id, seller_id, condition, price, url, source, published, checked_at)
select v.id, 'e44833dc-33f5-4aef-a4e7-82f70d78d45c', 'official', 380, 'https://smartdeal.com.bd/product/technic-mega-lash-volumising-mascara-black-14ml', 'site', true, now() - interval '7 days'
from variants v join products p on p.id = v.product_id
where p.slug = 'technic-mega-lash-volumising-mascara' and v.label = '14ml'
  and not exists (select 1 from offers where url = 'https://smartdeal.com.bd/product/technic-mega-lash-volumising-mascara-black-14ml')
on conflict (variant_id, seller_id, condition) do nothing;

commit;
