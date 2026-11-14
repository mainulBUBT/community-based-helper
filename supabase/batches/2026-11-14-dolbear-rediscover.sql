-- ২০২৬-১১-১৪: Dolbear-এর পণ্যের লিংক /product/ থেকে /products/-এ গেছে, worker-এর path পুরনো ছিল বলে discover একটাও পাতা পায়নি
-- অথচ দোকানকে "খোঁজা শেষ" চিহ্ন দিয়েছে। চিহ্ন মুছলে পরের discover run পুরো ক্যাটালগ Dolbear-এ আবার খোঁজে।
begin;
update sellers set discovered_at = null where website ilike '%dolbear.com.bd%';
commit;
