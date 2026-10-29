-- চার্জার এক্সেসরিজের ভাগ (পাওয়ার ব্যাংক আর চার্জার ফ্যান আলাদা মূল ক্যাটাগরি থাকে); পরে কেবল, মাউস, কিবোর্ড, SSD, RAM এর ভেতরেই নতুন ভাগ হবে।
-- slug বদলায় না, শুধু parent; পণ্যের লিংক আগের মতোই। অডিও নিজেই মূল ক্যাটাগরি, তাই আলাদা থাকে
insert into categories (slug, name, name_en, icon, variant_axes, position, parent, warranty, conditions, verify_note, quality_note) values
  ('accessories', 'এক্সেসরিজ', 'Accessories', 'usb', '{wattage,capacity}', 9, null, true, '{official,unofficial}', false, false)
on conflict (slug) do nothing;

update categories set parent = 'accessories' where slug = 'charger' and parent is null;
