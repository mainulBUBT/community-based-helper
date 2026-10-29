-- মধু, খেজুর আর খেজুরের গুড় এক মূল ক্যাটাগরির ভাগ; পরে বীজ, বাদাম, তেল-ঘি এর ভেতরেই নতুন ভাগ হবে।
-- slug বদলায় না, শুধু parent; পণ্যের লিংক আগের মতোই
insert into categories (slug, name, name_en, icon, variant_axes, position, parent, warranty, conditions, verify_note, quality_note) values
  ('organic-foods', 'অর্গানিক খাবার', 'Organic Foods', 'salad', '{capacity}', 22, null, false, '{official}', false, false)
on conflict (slug) do nothing;

update categories set parent = 'organic-foods' where slug in ('honey', 'dates', 'date-jaggery') and parent is null;
