-- নতুন কপি-জুতার দোকান (৮ নভেম্বর): robots.txt খোলা, Terms-এ scraping নিষেধ নেই (Barton-এ সাধারণ "content কপি নয়", Klassy/UK Direct-এর মতো)
insert into sellers (name, kind, website, verified)
select v.name, 'website', v.website, true
from (values
  ('Dhaka Step', 'https://www.dhakastep.com/'),
  ('Barton', 'https://bartonbangladesh.com/'),
  ('HK Lifestyle', 'https://hklifestyle.com.bd/')
) as v(name, website)
where not exists (
  select 1 from sellers s
  where regexp_replace(s.website, '^https?://(www\.)?|/.*$', '', 'g') = regexp_replace(v.website, '^https?://(www\.)?|/.*$', '', 'g')
);
