-- দোকানের ডেলিভারি চার্জ: {dhaka, outside, minDays, maxDays, cod, returnDays}; worker পণ্যের পাতার shippingDetails থেকে বসায়, অ্যাডমিন বদলাতে পারে
alter table sellers add column if not exists delivery jsonb;
