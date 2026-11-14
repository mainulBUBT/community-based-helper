-- RAM এক্সেসরিজে (পোর্টেবল SSD আর চার্জারের পাশে); ভার্সন ধারণক্ষমতা আর স্পিডে ("16GB 6000MHz"), SSD-র মতো লেবেলেই
insert into categories (slug, name, name_en, icon, variant_axes, position, parent, warranty, conditions, verify_note, quality_note) values
  ('ram', 'র‍্যাম', 'RAM', 'memory-stick', '{capacity}', 29, 'accessories', true, '{official,unofficial}', false, false)
on conflict (slug) do nothing;
