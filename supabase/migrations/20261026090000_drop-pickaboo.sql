-- Pickaboo worker কে 403 দেয়, কোনো দাম আসে না; তাই বিক্রেতা তালিকা থেকে বাদ

delete from sellers where regexp_replace(website, '^https?://(www\.)?|/.*$', '', 'g') = 'pickaboo.com';
