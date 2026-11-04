-- ২০২৬-১১-০৪: ERRUMBD (প্রতিলিপি স্নিকার্স/স্ট্রিটওয়্যারের রিসেলার) সেলার। worker কনফিগ workers/stores/index.ts এ `errum`।
insert into sellers (name, kind, website, verified)
select 'ERRUMBD', 'website', 'https://www.errumbd.com/', true
where not exists (select 1 from sellers where website ilike '%errumbd.com%');
