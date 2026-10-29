-- Trek N Tread সাইট নতুন করে বানিয়েছে: পুরনো লিংক "Product Not Found"। বেশিরভাগ লিংকে শুধু সংখ্যার prefix বাদ
-- (/products/648-air-jordan-4-... → /products/air-jordan-4-...); দুটোর নাম পুরো বদলেছে; New Balance 530 আর নেই।
-- লিংক বদলালে পাতার অপশন-বাঁধন (variant_key) পুরনো, তাই খালি করা হয়; পরের prices run নতুন করে বাঁধে।
update offers set url = 'https://trekntread.com/products/all-star-converse-color-black-white-high-neck-grade-oem', variant_key = null
where url = 'https://trekntread.com/products/all-star-converse-chuck-taylor-high-top-black-white';

-- আগের ২০৯০ টাকার কপি আর নেই; একই রঙের এখন শুধু 1:1 গ্রেড, তাই প্রিমিয়াম কপি
update offers set url = 'https://trekntread.com/products/air-jordan-1-color-university-blue-low-neck-11-grade', condition = 'replica_premium', price = 3990, old_price = null, variant_key = null
where url = 'https://trekntread.com/products/nike-air-jordan-1-unc-university-north-carolina-blue-white-low-top-mens-sneakers-bd'
  and not exists (
    select 1 from offers o
    where o.condition = 'replica_premium' and o.seller_id = offers.seller_id and o.variant_id = offers.variant_id
  );

delete from offers where url = 'https://trekntread.com/products/new-balance-mens-530-white-sky-blue-silver-casual-running-shoes-online-bd';

update offers set url = regexp_replace(url, '/products/\d+-', '/products/'), variant_key = null
where url ~ '^https://trekntread\.com/products/\d+-';
