const BATCH = 500;

const text = (value) => (value == null ? "null" : `'${String(value).replaceAll("'", "''")}'`);
const uuidOf = (place) => `md5(${text(`${place.source}:${place.ref}`)})::uuid`;

function chunks(rows) {
  return Array.from({ length: Math.ceil(rows.length / BATCH) }, (_, i) => rows.slice(i * BATCH, (i + 1) * BATCH));
}

export function seedSql({ header, categories, purposes, places }) {
  const placeRows = places.map(
    (p) =>
      `(${uuidOf(p)}, ${text(p.source)}, ${text(p.ref)}, ${text(p.kind)}, ${text(p.category)}, ${text(p.name)}, ` +
      `${text(p.description)}, ${text(p.area)}, ${p.lat}, ${p.lng}, ${text(p.phone)}, ${text(p.website)}, ` +
      `${Boolean(p.hours?.open24h)}, 'new')`,
  );
  const hourRows = places.flatMap((p) =>
    (p.hours?.slots ?? []).map((s) => `(${uuidOf(p)}, ${s.weekday}, ${s.opens}, ${s.closes})`),
  );
  const purposeRows = places.filter((p) => p.vegetables).map((p) => `(${uuidOf(p)}, 'vegetables')`);

  return [
    ...header.map((line) => `-- ${line}`.trimEnd()),
    "",
    `insert into public.categories (id, name_bn, short_bn, is_market, sort_order) values\n${categories
      .map((c, i) => `(${text(c.id)}, ${text(c.name)}, ${text(c.short)}, ${c.isMarket}, ${i + 1})`)
      .join(",\n")}\non conflict (id) do update set name_bn = excluded.name_bn, short_bn = excluded.short_bn, is_market = excluded.is_market, sort_order = excluded.sort_order;`,
    "",
    `insert into public.purposes (id, name_bn, sort_order) values\n${purposes
      .map((p, i) => `(${text(p.id)}, ${text(p.name)}, ${i + 1})`)
      .join(",\n")}\non conflict (id) do update set name_bn = excluded.name_bn, sort_order = excluded.sort_order;`,
    "",
    ...chunks(placeRows).map(
      (rows) =>
        `insert into public.places (id, source, source_ref, kind, category_id, name, description, area, lat, lng, phone, website, open_24h, status) values\n${rows.join(",\n")}\n` +
        "on conflict (id) do update set kind = excluded.kind, category_id = excluded.category_id, name = excluded.name, " +
        "description = excluded.description, area = excluded.area, lat = excluded.lat, lng = excluded.lng, " +
        "phone = excluded.phone, website = excluded.website, open_24h = excluded.open_24h\nwhere public.places.status = 'new';",
    ),
    "",
    "delete from public.opening_hours h using public.places p where h.place_id = p.id and p.source = 'osm' and p.status = 'new';",
    ...chunks(hourRows).map(
      (rows) =>
        `insert into public.opening_hours (place_id, weekday, opens_min, closes_min) values\n${rows.join(",\n")}\non conflict do nothing;`,
    ),
    "",
    ...chunks(purposeRows).map(
      (rows) => `insert into public.place_purposes (place_id, purpose_id) values\n${rows.join(",\n")}\non conflict do nothing;`,
    ),
    "",
  ].join("\n");
}
