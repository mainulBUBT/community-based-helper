-- Skyland-এর Corsair Vengeance 8GB DDR4 3200MHz SODIMM (১৫ নভেম্বর ব্রাউজারে পাতা খুলে দেখা):
-- পাতায় এখন ৳৮,৪০০-ই (স্টকে; আগের দাম ৳৯,৩৫০ কাটা, "Save 950৳") — সকালের run-এর ৳২,৭৫০ পড়াটা ভুল ছিল।
-- সন্দেহ বাতিল, পুরনো দাম আবার দেখাও।
update review_queue set status = 'rejected', resolved_at = now()
where kind = 'anomaly' and status = 'pending' and payload->>'offerId' = '9ec9b6d9-583a-41be-8261-58fcb15383d1';

update offers set published = true where id = '9ec9b6d9-583a-41be-8261-58fcb15383d1' and price = 8400;
