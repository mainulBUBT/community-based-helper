-- স্নিকার্সের নাম থেকে "1:1 Copy Sneakers" সরানো, ব্র্যান্ড ঠিক (AF-1 → Nike, Samba → Adidas ...), আর কপি এখন দামের ধরন।
-- seed পণ্যের id slug থেকে বানায় (md5('product:<slug>')), তাই নাম বদলাতে পুরনো সারি মুছে seed থেকে নতুন করে বসানো হয়।
-- এই migration এর পরে seed চালাতে হবে: npx supabase db query --linked -f supabase/seed.sql
delete from products where slug in (
  'af-1-air-force-1-1-1-copy-sneakers',
  'campus-00s-campus-00s-1-1-copy-sneakers',
  'samba-samba-og-1-1-copy-sneakers',
  'samba-samba-vegan-1-1-copy-sneakers',
  'onitsuka-tiger-mexico-66-1-1-copy-sneakers',
  'onitsuka-tiger-tokuten-1-1-copy-sneakers',
  'converse-chuck-70-1-1-copy-sneakers',
  'converse-chuck-taylor-all-star-high-1-1-copy-sneakers',
  'aj-1-jordan-1-low-1-1-copy-sneakers',
  'aj-1-jordan-1-retro-high-1-1-copy-sneakers',
  'aj-4-jordan-4-retro-1-1-copy-sneakers',
  'nike-sb-dunk-low-1-1-copy-sneakers',
  'new-balance-9060-1-1-copy-sneakers',
  'new-balance-530-1-1-copy-sneakers',
  'puma-speedcat-og-1-1-copy-sneakers',
  'adidas-gazelle-indoor-1-1-copy-sneakers',
  'vans-knu-skool-1-1-copy-sneakers',
  'adidas-adizero-evo-sl-1-1-copy-sneakers',
  'adidas-adizero-adios-pro-evo-1-1-1-copy-sneakers',
  'adidas-adizero-adios-pro-4-1-1-copy-sneakers'
);
