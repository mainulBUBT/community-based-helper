-- নকল বেশি হয় এমন ক্যাটাগরিতে পণ্যের পাতায় "আমরা আসল কিনা যাচাই করি না, কেনার আগে জেনে নিন"
alter table categories add column if not exists verify_note boolean not null default false;

insert into categories (slug, name, name_en, icon, variant_axes, position, parent, warranty, conditions, verify_note) values
  ('makeup', 'মেকআপ', 'Makeup', 'palette', '{capacity}', 14, null, false, '{official}', true)
on conflict (slug) do nothing;

update categories set verify_note = true
where slug in ('skincare', 'makeup') or parent in ('skincare', 'makeup');
