-- যেসব ক্যাটাগরিতে ব্র্যান্ড ওয়ারেন্টি বলে কিছু নেই (স্কিনকেয়ার, জুতা), সেখানে ওয়ারেন্টির ব্যাজ আর ফিল্টার দেখানো হয় না
alter table categories add column if not exists warranty boolean not null default true;

update categories set warranty = false
where slug in ('skincare', 'sneakers') or parent in ('skincare', 'sneakers');
