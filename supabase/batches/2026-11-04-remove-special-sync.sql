-- ২০২৬-১১-০৪: stealth-ভিত্তিক `special_sync` জব সরানো (মালিকের সিদ্ধান্ত; scripts/special-stores.ts মুছে গেছে)।
-- job_runs.job_id jobs(id) এ ON DELETE CASCADE, তাই এর পুরনো run-ইতিহাসও যায়।
delete from jobs where id = 'special_sync';
