-- ক্যাটালগ ঠিক করা (২৫ অক্টোবর, দোকানের পাতা আর প্রকাশিত তারিখ মিলিয়ে)

-- "Galaxy Watch 8 40mm" আসলে "Galaxy Watch8" এরই 40mm; আলাদা পেজটা বাদ, আসলটায় সব দোকান থাকে
delete from products where slug = 'samsung-galaxy-watch-8-40mm' and exists (select 1 from products where slug = 'samsung-galaxy-watch8');

-- Star Tech আর Gadget & Gear Samsung এর অফিসিয়াল দোকান; Watch8 এ তাদের দাম ভুল করে আনঅফিসিয়াল ছিল
update offers o set condition = 'official'
from variants v, products p, sellers s
where o.variant_id = v.id and v.product_id = p.id and o.seller_id = s.id
  and p.slug = 'samsung-galaxy-watch8' and o.condition = 'unofficial'
  and (s.website ilike '%startech.com.bd%' or s.website ilike '%gadgetandgear.com%')
  and not exists (select 1 from offers x where x.variant_id = o.variant_id and x.seller_id = o.seller_id and x.condition = 'official');

update products set release_year = 2026 where slug = 'huawei-nova-y74' and release_year = 2025;

-- বছর ছিল না এমন ঘড়ি; আগে থেকে বছর থাকলে বদলায় না
update products set release_year = 2024 where slug = 'amazfit-bip-5-unity-smart-watch' and release_year is null;
update products set release_year = 2023 where slug = 'huawei-watch-gt-4-46mm' and release_year is null;
update products set release_year = 2024 where slug = 'xiaomi-redmi-watch-5' and release_year is null;
update products set release_year = 2022 where slug = 'apple-watch-se-2nd-gen' and release_year is null;
update products set release_year = 2025 where slug = 'huawei-watch-gt-6-46mm' and release_year is null;
update products set release_year = 2024 where slug = 'xiaomi-watch-s4' and release_year is null;
update products set release_year = 2026 where slug = 'haylou-solar-lite-2' and release_year is null;
update products set release_year = 2023 where slug = 'imiki-st2-bluetooth-calling-smart-watch' and release_year is null;
update products set release_year = 2026 where slug = 'kospet-orb-2-smart-watch' and release_year is null;
update products set release_year = 2025 where slug = 'imiki-frame-2-pro-smart-watch' and release_year is null;
update products set release_year = 2025 where slug = 'oraimo-watch-5-lite' and release_year is null;
update products set release_year = 2026 where slug = 'kospet-tank-t4c-smart-watch' and release_year is null;
update products set release_year = 2025 where slug = 'haylou-watch-4-with-gps' and release_year is null;
update products set release_year = 2025 where slug = 'oraimo-watch-6-osw-807' and release_year is null;
update products set release_year = 2025 where slug = 'kospet-orb-smart-watch' and release_year is null;
update products set release_year = 2023 where slug = 'kospet-tank-t3-ultra-smart-watch' and release_year is null;
update products set release_year = 2024 where slug = 'kieslect-actor-bt-calling-smart-watch' and release_year is null;
update products set release_year = 2026 where slug = 'oraimo-watch-nova-2r' and release_year is null;
update products set release_year = 2025 where slug = 'amazfit-bip-6' and release_year is null;
update products set release_year = 2025 where slug = 'amazfit-active-2' and release_year is null;
update products set release_year = 2024 where slug = 'xiaomi-watch-2' and release_year is null;
update products set release_year = 2024 where slug = 'huawei-watch-fit-3' and release_year is null;
update products set release_year = 2024 where slug = 'samsung-galaxy-watch-7-40mm' and release_year is null;
update products set release_year = 2026 where slug = 'huawei-watch-gt-7-46mm' and release_year is null;
