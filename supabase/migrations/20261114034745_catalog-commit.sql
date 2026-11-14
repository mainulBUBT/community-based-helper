-- catalog JSON-এর কোন commit পর্যন্ত DB-তে তোলা হয়েছে (worker-এর syncCatalog); শুরু ১৪ নভেম্বরের db:seed করা commit থেকে
alter table private_settings add column catalog_commit text;
update private_settings set catalog_commit = '66232932b0c06d7145da333484bf2db6be7355b7' where id;
