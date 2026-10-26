-- রাউটার: সাধারণ রাউটারে এক ভার্সন, মেশে ১/২/৩ প্যাক আলাদা দামে (edition)
insert into categories (slug, name, name_en, icon, variant_axes, position, parent) values
  ('router', 'রাউটার', 'Routers', 'router', '{edition}', 21, null)
on conflict (slug) do nothing;
