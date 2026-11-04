-- ২০২৬-১১-০৪: দামসহ ২ দোকান নেই এমন তিন পণ্যে পেজ থেকে যাচাই করা অফার হাতে যোগ (discover এগুলো ধরেনি)। পরে `prices` জব দাম হালনাগাদ রাখে।
-- দাম/স্টক JSON-LD থেকে ৪ নভেম্বর পড়া: Arogga ১৯৯৯ (স্টকে), Emart ১৯০০ (স্টকে), Skincare Shop ১৮৮০ (স্টকে), Global Brand SC735 ১TB ২৫৩০০ (স্টক-আউট), Star Tech X8 ২TB ৩৬০০০ (স্টক-আউট)।
insert into offers (variant_id, seller_id, condition, price, in_stock, url, source, published, checked_at)
select v.id, s.id, 'official', x.price, x.in_stock, x.url, 'site', true, now()
from (values
  ('Oily Skin Cleanser', '236ml', 'Arogga', 1999, true, 'https://www.arogga.com/product/47054/cetaphil-oily-skin-cleanser-for-combination-to-oily-and-sensitive-skin-236ml'),
  ('Oily Skin Cleanser', '236ml', 'Emart', 1900, true, 'https://e-mart.com.bd/shop/cetaphil-oily-skin-cleanser-236ml'),
  ('Oily Skin Cleanser', '236ml', 'Skincare Shop', 1880, true, 'https://skincareshop.com.bd/product/cetaphil-oily-skin-cleanser-for-oily-combination-sensitive-skin-236ml/'),
  ('SC735', '1TB', 'Global Brand', 25300, false, 'https://www.globalbrand.com.bd/adata-sc735-1000gb-usb-32-external-ssd-blue'),
  ('X8', '2TB', 'Star Tech', 36000, false, 'https://www.startech.com.bd/crucial-x8-2tb-usb-3-2-type-c-portable-ssd')
) as x(product, label, seller, price, in_stock, url)
join products p on p.name = x.product and p.active
join variants v on v.product_id = p.id and v.label = x.label
join sellers s on s.name = x.seller
where not exists (select 1 from offers o where o.variant_id = v.id and o.seller_id = s.id);

-- Computer Village SC735 1TB ৳২২,৫০০: ক্যাটাগরি পাতার দাম-তালিকা থেকে (পণ্য-পাতা তখন 503 দিচ্ছিল); স্টক পাতা থেকে নিশ্চিত নয়, পরের `local_prices` রানে ঠিক হবে।
insert into offers (variant_id, seller_id, condition, price, in_stock, url, source, published, checked_at)
select v.id, s.id, 'official', 22500, true, 'https://www.computervillage.com.bd/adata-sc735-external-ssd-cv', 'site', true, now()
from products p join variants v on v.product_id = p.id and v.label = '1TB' join sellers s on s.name = 'Computer Village'
where p.name = 'SC735' and p.active
  and not exists (select 1 from offers o where o.variant_id = v.id and o.seller_id = s.id);
