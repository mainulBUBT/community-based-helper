-- মধু (ব্র্যান্ডের প্যাক, ওজন ধরে ভার্সন) আর খেজুর (জাত আর ওজন ধরে তুলনা, দোকানভেদে মান আলাদা)
alter table categories add column if not exists quality_note boolean not null default false;

insert into categories (slug, name, name_en, icon, variant_axes, position, parent, warranty, conditions, verify_note, quality_note) values
  ('honey', 'মধু', 'Honey', 'hexagon', '{capacity}', 22, null, false, '{official}', true, false),
  ('dates', 'খেজুর', 'Dates', 'bean', '{capacity}', 23, null, false, '{official}', false, true)
on conflict (slug) do nothing;
