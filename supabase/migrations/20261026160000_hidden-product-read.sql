-- লুকানো (active = false) পণ্যের ভার্সন, দাম আর দামের ইতিহাস REST দিয়ে পড়া যেত; এখন পণ্য দেখা গেলে তবেই
drop policy "public read" on variants;
create policy "public read" on variants for select
  using (exists (select 1 from products p where p.id = product_id));

drop policy "public read" on offers;
create policy "public read" on offers for select
  using (((published and (expires_at is null or expires_at > now())) or is_admin()) and exists (select 1 from variants v where v.id = variant_id));
