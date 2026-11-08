-- মৌসুমি ক্যাটাগরি হোমের টাইল আর শেলফে দেখাবে কি না (অ্যাডমিন → মৌসুমি ক্যাটাগরি); বন্ধ থাকলেও মেনু, নিজের পাতা আর sitemap এ থাকে
alter table categories add column if not exists show_on_home boolean not null default true;
