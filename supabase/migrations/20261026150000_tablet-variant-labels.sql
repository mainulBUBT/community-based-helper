-- চারটা ট্যাবলেটের একমাত্র ভার্সন ছিল "Standard", অথচ দোকানের পাতায় RAM/স্টোরেজ/Wi-Fi অপশন; worker মেলাতে পারত না।
-- seed পুরনো সারি বদলায় না, তাই নাম এখানে বদলানো। seed-এর আগে চালাতে হবে।

update variants set label = '64GB Wi-Fi + Cellular', attributes = '{"storage":"64GB","connectivity":"Wi-Fi + Cellular"}'::jsonb
where id = md5('variant:samsung-galaxy-tab-a9-8-7-inch-lte~v1')::uuid and label = 'Standard';

update variants set label = '128GB Wi-Fi', attributes = '{"storage":"128GB","connectivity":"Wi-Fi"}'::jsonb, official_price = 49999
where id = md5('variant:huawei-matepad-11-5-inch~v1')::uuid and label = 'Standard';

update variants set label = '256GB Wi-Fi + Cellular', attributes = '{"storage":"256GB","connectivity":"Wi-Fi + Cellular"}'::jsonb, official_price = 38999
where id = md5('variant:lenovo-idea-tab-11-inch~v1')::uuid and label = 'Standard';

update variants set label = '8GB / 128GB Wi-Fi', attributes = '{"ram":"8GB","storage":"128GB","connectivity":"Wi-Fi"}'::jsonb, official_price = 37500
where id = md5('variant:xiaomi-pad-7-11-2-inch~v1')::uuid and label = 'Standard';

-- PCB Store-এর Pad 7 পাতায় কোন RAM/স্টোরেজ লেখা নেই, তাই এই দাম কোনো ভার্সনে বসানো যায় না
delete from offers where variant_id = md5('variant:xiaomi-pad-7-11-2-inch~v1')::uuid and url = 'https://pcbstore.com.bd/product/xiaomi-pad-7-android-tablet';
