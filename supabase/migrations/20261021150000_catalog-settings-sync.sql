-- Brings an already-migrated database up to the catalog and settings shape the app now uses.
-- Every statement is safe to run whether or not the earlier versions of these changes were applied.

alter table categories add column if not exists parent text references categories (slug) on update cascade;

insert into categories (slug, name, name_en, icon, variant_axes, position, parent) values
  ('mobile', 'মোবাইল', 'Mobiles', 'smartphone', '{ram,storage}', 1, null),
  ('laptop', 'ল্যাপটপ', 'Laptops', 'laptop', '{chip,ram,storage}', 2, null),
  ('tablet', 'ট্যাবলেট', 'Tablets', 'tablet', '{storage,connectivity}', 3, null),
  ('desktop', 'ডেস্কটপ', 'Desktops', 'monitor', '{chip,ram,storage}', 4, null),
  ('watch', 'স্মার্টওয়াচ', 'Smartwatches', 'watch', '{size,connectivity}', 5, null),
  ('audio', 'অডিও', 'Audio', 'headphones', '{color}', 6, null)
on conflict (slug) do nothing;

insert into categories (slug, name, name_en, icon, variant_axes, position, parent) values
  ('earbuds', 'ইয়ারবাড', 'Earbuds', 'headphones', '{color}', 7, 'audio'),
  ('headphones', 'হেডফোন', 'Headphones', 'headphones', '{color}', 8, 'audio')
on conflict (slug) do update set parent = excluded.parent;

-- new settings keys get defaults; anything the admin already saved wins
update site_settings set value = jsonb_build_object(
  'tagline', 'বাংলাদেশের সব দোকানের দাম মিলিয়ে দেখুন, কেনার আগেই জানুন কোথায় সবচেয়ে কম।',
  'taglineEn', 'Compare prices from shops across Bangladesh and know where it''s cheapest before you buy.',
  'seoTitle', 'দরদাম – কম দাম কোথায়? এক ক্লিকে বাংলাদেশের সব দোকান',
  'seoDescription', 'বাংলাদেশের দোকানগুলো থেকে একই পণ্যের দাম পাশাপাশি দেখুন — মোবাইল, ল্যাপটপ, গ্যাজেট থেকে শুরু করে আরও অনেক কিছু। কেনার আগে যাচাই করুন কোথায় সবচেয়ে কম।',
  'seoTitleEn', 'Dordam – Compare Prices in Bangladesh: Mobiles, Laptops & More',
  'seoDescriptionEn', 'See the same product''s price from shops across Bangladesh side by side — mobiles, laptops, gadgets and more. Check where it''s cheapest before you buy.',
  'aboutWho', 'দরদাম একটা স্বাধীন দাম-তুলনার সাইট। আমরা কোনো দোকান নই, কিছু বিক্রিও করি না, কোনো দোকানের হয়ে কাজও করি না।',
  'aboutWhoEn', 'Dordam is an independent price comparison site. We''re not a shop, we don''t sell anything, and we don''t work for any shop.',
  'aboutWhat', 'বাংলাদেশের দোকানগুলো থেকে একই পণ্যের দাম জোগাড় করে পাশাপাশি দেখাই, যাতে কেনার আগে যাচাই করে সবচেয়ে ভালো দামে কিনতে পারেন।',
  'aboutWhatEn', 'We gather prices for the same product from shops across Bangladesh and show them side by side, so you can check before you buy and pay the best price.',
  'regionNotes', jsonb_build_array(
    jsonb_build_object('region', 'USA', 'note', 'USA ভার্সনের iPhone এ শুধু eSIM, ফিজিক্যাল সিম কার্ড লাগানো যায় না।', 'noteEn', 'US iPhones are eSIM-only; there''s no physical SIM slot.'),
    jsonb_build_object('region', 'Japan', 'note', 'Japan ভার্সনে ক্যামেরার শাটারের শব্দ বন্ধ করা যায় না।', 'noteEn', 'Japanese models play a camera shutter sound that can''t be turned off.'),
    jsonb_build_object('region', 'Global', 'note', 'আন্তর্জাতিক ভার্সন। ব্র্যান্ডের নয়, শুধু দোকানের ওয়ারেন্টি থাকে।', 'noteEn', 'International version. Only the shop''s warranty applies, not the brand''s.')
  )
) || value;

-- earlier seeds' wording, if the admin never changed it
update site_settings set value = value || jsonb_build_object('seoTitle', 'দরদাম – কম দাম কোথায়? এক ক্লিকে বাংলাদেশের সব দোকান')
where value->>'seoTitle' in ('দরদাম: মোবাইল আর গ্যাজেটের দাম তুলনা', 'দরদাম — আগে দাম যাচাই, তারপর স্মার্ট কেনা');
update site_settings set value = value || jsonb_build_object('tagline', 'বাংলাদেশের সব দোকানের দাম মিলিয়ে দেখুন, কেনার আগেই জানুন কোথায় সবচেয়ে কম।')
where value->>'tagline' in ('মোবাইল, Apple আর স্মার্টওয়াচের দাম এক জায়গায়', 'মোবাইল, ল্যাপটপ, ট্যাবলেট আর স্মার্টওয়াচের দাম এক জায়গায়', 'বাংলাদেশের সব দোকানের দাম, পাশাপাশি এক জায়গায়');
update site_settings set value = value || jsonb_build_object('taglineEn', 'Compare prices from shops across Bangladesh and know where it''s cheapest before you buy.')
where value->>'taglineEn' = 'Prices from shops across Bangladesh, side by side';
update site_settings set value = value || jsonb_build_object('seoDescription', 'বাংলাদেশের দোকানগুলো থেকে একই পণ্যের দাম পাশাপাশি দেখুন — মোবাইল, ল্যাপটপ, গ্যাজেট থেকে শুরু করে আরও অনেক কিছু। কেনার আগে যাচাই করুন কোথায় সবচেয়ে কম।')
where value->>'seoDescription' in ('বাংলাদেশের দোকানগুলোতে মোবাইল, iPhone, MacBook আর স্মার্টওয়াচের দাম পাশাপাশি দেখুন।', 'বাংলাদেশের সব দোকানের দাম পাশাপাশি দেখুন, কোথায় সবচেয়ে কম তা কেনার আগেই জেনে নিন।');
update site_settings set value = value || jsonb_build_object('seoTitleEn', 'Dordam – Compare Prices in Bangladesh: Mobiles, Laptops & More')
where value->>'seoTitleEn' = 'Dordam — Compare first, buy smart';
update site_settings set value = value || jsonb_build_object('seoDescriptionEn', 'See the same product''s price from shops across Bangladesh side by side — mobiles, laptops, gadgets and more. Check where it''s cheapest before you buy.')
where value->>'seoDescriptionEn' = 'See prices from shops across Bangladesh side by side, and find the lowest before you buy.';
