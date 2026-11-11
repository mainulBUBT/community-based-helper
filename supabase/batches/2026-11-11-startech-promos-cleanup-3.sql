-- ব্র্যান্ড মেলানো কোডে আসার আগের run এ ঢোকা ২টা: VSOL রাউটার আর T-Wolf মাউস/কিবোর্ড আমাদের তালিকায় নেই।
delete from promos where id in (
  '4219a9e6-dac0-4493-92d3-71c2787fac55',
  '6c5e20be-f548-4aff-8ed5-5eb33179339d'
);
