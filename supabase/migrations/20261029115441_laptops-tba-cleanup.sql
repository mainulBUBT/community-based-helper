-- ২৯ অক্টোবরের ৬টা ল্যাপটপে Star Tech-এর দাম এসেছিল "To be announced" পাতার পুরনো অংক থেকে; সেটা বাদ দিলে প্রতিটা এক দোকানে নামে,
-- তাই পুরো পণ্য বাদ (মালিকের সিদ্ধান্ত)। seed আগে চলে থাকলে এগুলো DB-তে আছে; পণ্য মুছলে ভার্সন আর দাম cascade-এ মোছে।
delete from products where slug in (
  'asus-tuf-gaming-f16-fx608jmr',
  'asus-rog-strix-scar-16-g635lw',
  'asus-vivobook-15-x1504va',
  'asus-expertbook-p1-p1503cva',
  'dell-15-dc15250',
  'msi-cyborg-15-a13ve'
);
