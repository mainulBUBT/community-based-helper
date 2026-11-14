-- ২০২৬-১১-১৪: RAM পণ্য DB-তে বসার কয়েক মিনিট পরেই discover চলেছিল পুরনো কোডে (Star Tech-এর RAM ক্যাটাগরি তখনো যোগ হয়নি),
-- তাই Star Tech, UCC সহ সব দোকান RAM-কে "খোঁজা হয়েছে" ধরে নিয়েছে। নতুন করে চাওয়া হলে পরের discover নতুন কোডে আবার খুঁজবে।
update products set discover_requested_at = now() where category = 'ram';
