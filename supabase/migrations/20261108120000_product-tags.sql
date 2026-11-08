-- পণ্যের অন্য নাম (ভ্যাসলিন, lip balm, nivea cream): খোঁজায় নামের মতোই মেলে, অ্যাডমিন → পণ্যে লেখা যায়
alter table products add column if not exists tags text[] not null default '{}';
