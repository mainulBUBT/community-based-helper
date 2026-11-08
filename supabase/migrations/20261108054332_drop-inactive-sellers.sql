-- নিষ্ক্রিয় ১১টা দোকান পুরোপুরি বাদ (৮ নভেম্বর): বট আটকায় (Ryans, TechLand, Pickaboo, GadStyle, Ghorer Bazar, Naturo BD, Hype Cave, Prime Nation),
-- ক্যাটালগে মেলা পণ্য নেই (Sundora, Zapatos), Terms-এ দাম সংগ্রহ নিষেধ (ERRUMBD)। অফার, দামের ইতিহাস আর প্রোমো cascade এ মোছে।
-- গার্ড: শুধু যেগুলো এখনো নিষ্ক্রিয়; কেউ এর মধ্যে চালু করে থাকলে সেটা থাকে।
delete from sellers
where not active
  and regexp_replace(website, '^https?://(www\.)?|/.*$', '', 'g') in (
    'ryans.com', 'techlandbd.com', 'pickaboo.com', 'gadstyle.com', 'ghorerbazar.com', 'naturobd.com',
    'hypecave.store', 'primenationbd.com', 'sundora.com.bd', 'zapatos.com.bd', 'errumbd.com'
  );
