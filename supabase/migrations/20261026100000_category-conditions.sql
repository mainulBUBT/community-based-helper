-- দামের ধরন ক্যাটাগরি ধরে: ইলেকট্রনিক্সে ওয়ারেন্টি (official/unofficial/used), জুতায় আসল/প্রিমিয়াম কপি/কপি, স্কিনকেয়ারে শুধু আসল
alter type offer_condition add value if not exists 'replica_premium';
alter type offer_condition add value if not exists 'replica';

alter table categories add column if not exists conditions text[] not null default '{official,unofficial,used}'
  check (cardinality(conditions) > 0 and conditions <@ '{official,unofficial,used,replica_premium,replica}');

update categories set conditions = '{official}'
where slug = 'skincare' or parent = 'skincare';

update categories set conditions = '{official,replica_premium,replica}'
where slug = 'sneakers' or parent = 'sneakers';
