-- মৌসুমি/উৎসবের ক্যাটাগরি: নিজের পণ্য নেই, অন্য ক্যাটাগরির পণ্যের slug হাতে বাছা। null মানে সাধারণ ক্যাটাগরি
alter table categories add column if not exists collection_products text[];

-- বন্ধ অবস্থায় বসে: পুরনো কোড এটাকে খালি সাধারণ ক্যাটাগরি ভাবত। নতুন কোড deploy হলে অ্যাডমিন থেকে চালু করতে হয়
insert into categories (slug, name, name_en, icon, variant_axes, position, active, collection_products) values
  ('winter', 'শীতের পণ্য', 'Winter Essentials', 'snowflake', '{}', 0, false, array[
    'khaas-food-patali-gur', 'khaas-food-jhola-gur', 'root-date-jaggery-cubes', 'farmers-gold-patali-gur', 'farmers-gold-jhola-gur', 'root-date-jaggery-powder',
    'ashol-mustard-flower-honey', 'saffola-honey', 'dabur-honey', 'ashol-sundarban-natural-honey', 'aci-pure-multifloral-honey', 'karkuma-organic-honey', 'al-shifa-natural-honey', 'farmers-gold-black-seed-honey',
    'parachute-just-for-baby-lotion', 'aveeno-baby-daily-care-moisturising-lotion', 'meril-baby-lotion', 'himalaya-baby-lotion', 'kodomo-anti-rash-moisturizing-baby-lotion',
    'parachute-just-for-baby-face-cream', 'sebamed-baby-cream-extra-soft', 'himalaya-baby-cream', 'kodomo-pink-hanabaki-baby-cream',
    'parachute-just-for-baby-oil', 'meril-baby-oil', 'johnsons-baby-oil-with-vitamin-e',
    'cerave-moisturizing-cream-56ml', 'round-lab-birch-juice-moisturizing-cream-80ml', 'cosrx-advanced-snail-92-all-in-one-cream-100g', 'purito-dermide-cica-barrier-sleeping-pack',
    'cerave-hydrating-cleanser-236ml', 'torriden-dive-in-low-molecule-hyaluronic-acid-serum-50ml',
    'wishcare-ceramide-lip-balm-spf-50', 'maybelline-baby-lips-color-lip-balm-spf11', 'laneige-lip-sleeping-mask-berry', 'cosrx-propolis-lip-sleeping-mask'
  ])
on conflict (slug) do nothing;
