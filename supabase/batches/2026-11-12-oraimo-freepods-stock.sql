-- ২০২৬-১১-১২: oraimo FreePods Lite OTW-330-এ Sumash আর Rio-র পাতা "Out of Stock" (Sumash payload-এ stock 0, Rio-র কার্ট ঘরে Stock Out বাটন), কিন্তু DB-তে in_stock true ছিল।
-- কারণ: দুই দোকানেরই অপশনহীন এক-দামের পাতা, parser কিছু ফেরত দিত না বলে স্টক বদল কখনো বসত না; parser এখন ঠিক করেছে।
-- Mobile Buzz BD সত্যিই স্টকে আছে (Woo variations is_in_stock true), তাই তাকে ছোঁয়া হয়নি।
begin;

update offers set in_stock = false, checked_at = now()
where url in (
  'https://www.sumashtech.com/product/oraimo-freepods-lite-otw-330',
  'https://riointernational.com.bd/product/oraimo-freepods-lite-otw330-tws'
);

commit;
