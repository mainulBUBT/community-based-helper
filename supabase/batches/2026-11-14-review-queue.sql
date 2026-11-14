-- ২০২৬-১১-১৪: অ্যাডমিনের ৬টা রিভিউ। প্রতিটা দোকানের পাতা worker-এর reader দিয়ে পড়া; পাঁচটাই এখন স্টক নেই।
begin;
-- Orasine "Premium white Stamp Seal" ৳600 (ক্রেতার পাঠানো): ক্যাটালগে এমন পণ্য বা ক্যাটাগরি নেই, Orasine বিক্রেতাও নয়।
update review_queue set status = 'rejected', resolved_at = now() where id = 'fa902393-261c-4915-a648-d92d52b366aa' and status = 'pending';
-- PC House "CORSAIR VENGEANCE LPX 8GB DDR4 3600MHz" ৳3200: 3600MHz, ক্যাটালগের ভার্সন 3200MHz; দামও পুরনো (8GB 3200MHz এখন ৭৫০০–৮৭০০)।
update review_queue set status = 'rejected', resolved_at = now() where id = 'b4fb1383-5141-4757-acd5-3db5ab20756a' and status = 'pending';
-- PC House "T-FORCE DELTA RGB 32GB (16GBx2) 7000MHz White" ৳19690: 7000MHz White, ক্যাটালগের ভার্সন 32GB 6000MHz।
update review_queue set status = 'rejected', resolved_at = now() where id = 'dfdbff23-7f8f-49ce-af98-285e70e7d108' and status = 'pending';
-- Computer Vision "Kingston FURY Beast 16GB 5600MHz DDR5" ৳7000: 5600MHz, ক্যাটালগের ভার্সন 16GB 6000MHz; দামও পুরনো (8GB 5600MHz-ই ১৮৩০০+)।
update review_queue set status = 'rejected', resolved_at = now() where id = 'a40f0982-7b1a-4354-805a-8196062fa126' and status = 'pending';
-- Computer Vision "CORSAIR VENGEANCE 8GB DDR4 3200MHz SODIMM Laptop" ৳3300, স্টক নেই: পণ্য আর ভার্সন ঠিক (Vengeance DDR4 Laptop 8GB 3200MHz)।
-- দাম দোকানের পুরনো, তবে স্টক-নেই হিসেবে বসে; স্টকে ফিরলে prices নতুন দাম তোলে। বাতিল করলে লিংকটা discover-এ চিরতরে বন্ধ হতো।
update review_queue set status = 'approved', resolved_at = now() where id = '3666d056-43a5-4987-9214-cfd224bcf859' and status = 'pending' and applied_at is null;
-- Computer Vision "TEAM T-FORCE DELTA RGB 32GB 6000MHz DDR5" ৳14900, স্টক নেই: পণ্য আর ভার্সন ঠিক (32GB 6000MHz); একই কারণে স্টক-নেই হিসেবে।
update review_queue set status = 'approved', resolved_at = now() where id = '4d19f569-3c13-45fa-abc2-a58b76f6a716' and status = 'pending' and applied_at is null;
commit;

-- পরে আসা ১টা: PC House "TEAM T-FORCE DELTA RGB 32GB (16GBx2) 7200MHz DDR5" ৳26400, স্টক নেই: 7200MHz, ক্যাটালগের ভার্সন 32GB 6000MHz।
begin;
update review_queue set status = 'rejected', resolved_at = now() where id = '891bf6bf-8dfc-4b5a-ae2b-8d759a0c72c8' and status = 'pending';
commit;
