insert into sellers (name, kind, website, verified)
select v.name, 'website', v.website, true
from (values
  ('Umrelo', 'https://umrelo.com.bd/'),
  ('PQS', 'https://www.pqs.com.bd/'),
  ('Electronics Bangladesh', 'https://electronicsbangladesh.com/'),
  ('Smart Deal', 'https://smartdeal.com.bd/'),
  ('Computer Vision', 'https://computervision.com.bd/'),
  ('Onix Computer', 'https://www.onixbd.com/')
) as v (name, website)
where not exists (
  select 1 from sellers s
  where regexp_replace(s.website, '^https?://(www\.)?|/.*$', '', 'g') = regexp_replace(v.website, '^https?://(www\.)?|/.*$', '', 'g')
);
