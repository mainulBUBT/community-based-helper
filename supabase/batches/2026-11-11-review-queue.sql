begin;

-- Perfecto পাতায় Size 87ml = ৳1,300 (ছাড়ে), 237ml স্টকে নেই
update review_queue set status = 'approved', resolved_at = now()
where status = 'pending' and id::text like 'b2efe97a%' and payload->>'variantId' = '33c12ae9-835b-4e68-af49-89bdadbfa6ce';

-- কম্বো প্যাক, সাবান, অন্য পণ্য (Daily Advance), মেলে না এমন সাইজ (30ml, 800g),
-- আর Shajgoj-এর যে দুটো Cetaphil লিংক একই ভার্সনে আগে থেকেই আছে
update review_queue set status = 'rejected', resolved_at = now()
where status = 'pending' and kind = 'match' and (
  id::text like '0c5871cd%' or id::text like '40d8492d%' or id::text like '4afa91cf%' or id::text like '13538872%'
  or id::text like '5fd4a3ef%' or id::text like '2b7f8699%' or id::text like 'b3b30a15%' or id::text like 'e2648037%'
  or id::text like '4fd3c395%' or id::text like 'aa0245d0%' or id::text like '4025fb76%' or id::text like 'bb31d9da%'
  or id::text like '7f7d2b9a%' or id::text like '3c3ef5f8%' or id::text like '4787960d%'
);

commit;
