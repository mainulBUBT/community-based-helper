-- ২০২৬-১১-১২: অ্যাডমিনের ৭টা রিভিউ (AI কোটা শেষ হওয়ায় আন্দাজ ছাড়া এসেছিল)। প্রতিটা পাতা worker-এর reader দিয়ে পড়া।
-- নতুন সাইজ গোনা: ২৯টা beauty দোকানে discover, তারপর প্রতিটা পাতা পড়ে; মালিকের দেওয়া Klassy লিংক discover ধরেনি, তাই আলাদা পড়া।
-- Nivea Soft 500ml ১টা দোকানে (Shajgoj-এর "500-ml" লিংক আসলে 50ml); CeraVe Daily Lotion 562ml Arogga + Klassy (২টা); 29ml Arogga + Klassy (দুটোই স্টক নেই),
-- আর skinplusbd.com-এ আছে কিন্তু ওটা আমাদের দোকান নয়। ৩টা চেনা দোকান লাগে, তাই বাতিল।
begin;

-- Arogga SKIN1004 Poremizing Fresh Ampoule ৳1815: শিরোনামে সাইজ নেই, পাতার ছবি "ampoule-serum-100ml"; দাম অন্যদের 100ml-এর কাছে (১৯৮০–২২৫০)। Arogga-র 100ml-এ আগে কোনো লিংক নেই।
update review_queue set status = 'approved', resolved_at = now(), payload = payload || jsonb_build_object('variantId', '9ba47716-6751-4823-9702-fd540cc186d1', 'productId', 'b123356f-1cd1-4481-9fc1-94955400d231', 'newVariant', 'false') where id = '06fe7588-a163-43f9-ab69-80e549818fd2' and status = 'pending' and applied_at is null;

-- UK Direct Nivea Soft ৳630: শিরোনাম, বর্ণনা, ছবি কোথাও সাইজ নেই; কোন ভার্সন বলা যায় না।
update review_queue set status = 'rejected', resolved_at = now() where id = '50bcfea5-6d57-4673-bbb1-ede9ab12ad3c' and status = 'pending';
-- UK Direct Nivea Soft 500ml: শুধু UK Direct।
update review_queue set status = 'rejected', resolved_at = now() where id = '4ae4b296-0e76-4020-ab35-b7a59e89c1f5' and status = 'pending';
-- UK Direct Nivea Original Daily Moisture Soft Body Lotion 500ml: বডি লোশন, Nivea Soft ক্রিম নয়।
update review_queue set status = 'rejected', resolved_at = now() where id = '635e755e-99dc-4d26-bed2-559fcfe81ef0' and status = 'pending';
-- Arogga CeraVe Daily Moisturizing Lotion 562ml (Canada আর সাধারণ) আর 29ml: চেনা দোকানের মধ্যে Arogga আর Klassy, ২টা।
update review_queue set status = 'rejected', resolved_at = now() where id in ('6b26956b-c9b1-4ac0-9752-dfb4fa2444b8', '16855644-1480-482d-bec9-1b675c910db7', '67869385-a85d-4782-ad84-5595309a4e9e') and status = 'pending';

commit;
