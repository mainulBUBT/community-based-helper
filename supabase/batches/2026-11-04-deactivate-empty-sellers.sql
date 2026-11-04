-- ২০২৬-১১-০৪: যে ১০টা সেলার থেকে কোনো ডেটা আনা যায় না, তাদের নিষ্ক্রিয় করা (মোছা নয়; active = true করলেই ফেরে)। ইতিমধ্যে লাইভে চালানো।
-- কারণ:
--   ব্রাউজার/Cloudflare/Vercel আটকায়, সাধারণ worker দিয়ে আনা যায় না: GadStyle, Ghorer Bazar, Naturo BD, Pickaboo, Ryans Computers, TechLand BD
--   কোনো worker কনফিগই নেই: Hype Cave, Prime Nation
--   খোলে কিন্তু ক্যাটালগের কোনো পণ্য নেই (৪ নভেম্বর সম্পূর্ণ discover চালিয়ে ০টা মেলা): Sundora, Zapatos (নিজস্ব ব্র্যান্ডের জুতা)
-- গার্ড: শুধু যাদের একটাও অফার নেই।
update sellers set active = false
where name in ('GadStyle', 'Ghorer Bazar', 'Hype Cave', 'Naturo BD', 'Pickaboo', 'Prime Nation', 'Ryans Computers', 'Sundora', 'TechLand BD', 'Zapatos')
  and active
  and not exists (select 1 from offers o where o.seller_id = sellers.id);
