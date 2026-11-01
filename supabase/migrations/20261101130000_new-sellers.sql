insert into sellers (name, kind, website, verified)
select v.name, 'website', v.website, true
from (values
  ('Vertech', 'https://www.vertech.com.bd/'),
  ('Rio International', 'https://riointernational.com.bd/'),
  ('ByteBliss', 'https://bytebliss.com.bd/'),
  ('Next Tech BD', 'https://www.nexttech.com.bd/'),
  ('Computer Village', 'https://www.computervillage.com.bd/'),
  ('PC House', 'https://www.pchouse.com.bd/'),
  ('Sundora', 'https://sundora.com.bd/'),
  ('Ghorer Bazar', 'https://ghorerbazar.com/')
) as v (name, website)
where not exists (
  select 1 from sellers s
  where regexp_replace(s.website, '^https?://(www\.)?|/.*$', '', 'g') = regexp_replace(v.website, '^https?://(www\.)?|/.*$', '', 'g')
);
