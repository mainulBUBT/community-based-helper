-- ২০২৬-১১-১৫: অ্যাডমিনের ১০টা রিভিউ। প্রতিটা দোকানের পাতা worker-এর reader আর পাতার লেখা দিয়ে পড়া।
begin;
-- Gadget BD "Apple iPad 11th Gen – iPad 11\" Wi-Fi" ৳53999: পাতার "128gb / wi fi" অপশন, ক্যাটালগের iPad 11-inch (A16) 128GB Wi-Fi। এই ভার্সনে Gadget BD-র লিংক নেই।
update review_queue set status = 'approved', resolved_at = now() where id = 'c5149f30-3689-4707-8b34-f131e78c5ef8' and status = 'pending' and applied_at is null;
-- Gadget BD "Mac Mini M5 Pro" ৳248999, স্টকে: পাতার "15 core cpu 16 core gpu / 24gb 512gb", ক্যাটালগের ভার্সন হুবহু।
update review_queue set status = 'approved', resolved_at = now() where id = '41c737b9-7e8d-4e93-8cad-bc269363eee5' and status = 'pending' and applied_at is null;
-- Gadget BD "Samsung Galaxy Watch 8" (Classic নয়) ৳23999: পাতার "wi fi / 40mm" = 40mm Bluetooth।
update review_queue set status = 'approved', resolved_at = now() where id = 'cfa58798-15ea-462b-8105-051a92244640' and status = 'pending' and applied_at is null;
-- একই পাতা ৳25499: "wi fi / 44mm" = 44mm Bluetooth।
update review_queue set status = 'approved', resolved_at = now() where id = 'af599090-6064-4e31-b1a5-061468275aac' and status = 'pending' and applied_at is null;
-- Gadget BD "MacBook Air M3 13 Inch" ৳114000, স্টক নেই: পাতায় "RAM 8GB Unified Memory", অপশন 256GB → ক্যাটালগের M3 8GB / 256GB (দাম ১০০৯৯৯–১৩৪৯৯৯-এর ভেতরে)।
update review_queue set status = 'approved', resolved_at = now(), payload = payload || jsonb_build_object('variantId', 'b0a2dc97-7669-9764-fea2-3c89aea6ab47', 'variantKey', '256gb', 'newVariant', 'false') where id = '6f7ca4c9-81e7-4992-9ff8-c9cde202145f' and status = 'pending' and applied_at is null;
-- Chaldal NeoCare Baby Wipes ৳235: পাতায় "NeoCare Baby Wipes 120 pcs", "Quantity: 120 Pcs" — 180pcs নয়, 120pcs ভার্সনে। এই ভার্সনে Chaldal-এর লিংক নেই।
update review_queue set status = 'approved', resolved_at = now(), payload = payload || jsonb_build_object('variantId', '2d397dde-a9aa-f3a3-f945-6872ab54a61b') where id = '174efe41-8a9d-4052-bd18-81c0480b142f' and status = 'pending' and applied_at is null;
-- Emart "Cetaphil Moisturising Cream" ৳900, স্টকে: লেখায় সাইজ নেই, তবে পণ্যের ছবির টিউবে "50g, Dry to Very Dry, Sensitive Skin" (ফাইল Cetaphil-Moisturising-Cream-50-g-1.jpg)।
-- ক্যাটালগের 50g ভার্সন আগে থেকেই আছে (৬ দোকান, ৳৮৫৫–১৩৭৯), Emart-এর লিংক নেই।
update review_queue set status = 'approved', resolved_at = now() where id = '08a1bdc9-d542-499a-b0b0-b7d716d3901e' and status = 'pending' and applied_at is null;
-- Emart "Nivea Soft Light Moisturising Cream (Jar)" ৳473: পাতায় সাইজ নেই, নামও "Soft Light"; দাম দেখে 75ml ধরা আন্দাজ।
update review_queue set status = 'rejected', resolved_at = now() where id = '3553f6db-9a0f-49b4-b347-2c13126b8ae7' and status = 'pending';
-- Chaldal Meril Baby Shampoo: পাতা এখন 404।
update review_queue set status = 'rejected', resolved_at = now() where id = 'ec75dace-9b4d-496c-b416-1016d19dc6d0' and status = 'pending';
-- Skyland Kingston FURY Beast 16GB 3200MHz DDR4 CL16 (official): ৳16499 → ৳4300 একবারের ভুল পড়া; পাতায় এখন ৳16499, কোথাও ৪৩০০ নেই।
-- লিংক ঠিক ভার্সনেই (16GB official; unofficial ৳15499 আলাদা লিংকে)। প্রত্যাখ্যান করে লুকানো দামটা দোকানের তালিকায় ফেরানো।
update review_queue set status = 'rejected', resolved_at = now() where id = '1276b8db-3e65-4bbd-96fa-fb00837e5b07' and status = 'pending';
update offers set published = true, in_stock = true, checked_at = now() where id = '7cda7ffd-3aba-4f24-9ede-3a9480db91ee' and price = 16499;
commit;
