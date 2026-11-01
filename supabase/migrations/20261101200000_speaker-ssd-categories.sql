-- ব্লুটুথ স্পিকার অডিওর ভাগে (ইয়ারবাড-হেডফোনের পাশে); পোর্টেবল SSD এক্সেসরিজে (চার্জারের পাশে)।
-- স্পিকারে এক মডেলে এক দাম (রং ভিন্ন হলেও দাম এক), তাই ভার্সনের ঘর নেই; SSD ধারণক্ষমতায় ভাগ হয়
insert into categories (slug, name, name_en, icon, variant_axes, position, parent, warranty, conditions, verify_note, quality_note) values
  ('speaker', 'ব্লুটুথ স্পিকার', 'Bluetooth Speakers', 'speaker', '{}', 15, 'audio', true, '{official,unofficial}', false, false),
  ('ssd', 'পোর্টেবল SSD', 'Portable SSDs', 'hard-drive', '{capacity}', 16, 'accessories', true, '{official,unofficial}', false, false)
on conflict (slug) do nothing;
