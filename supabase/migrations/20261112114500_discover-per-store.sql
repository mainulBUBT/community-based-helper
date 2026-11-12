alter table sellers add column discovered_at timestamptz;

update sellers set discovered_at = (select max(discovered_at) from products);
