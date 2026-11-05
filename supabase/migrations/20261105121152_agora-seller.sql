insert into sellers (name, kind, website, verified)
select 'Agora', 'website', 'https://agorasuperstores.com/', true
where not exists (select 1 from sellers where website like '%agorasuperstores.com%');
