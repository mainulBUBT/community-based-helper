// Fetches spec tables for every specsSource in data/catalog/*.json into data/catalog/specs.json.
// Polite: honest user agent, one request per second, already-fetched pages are skipped.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "data/catalog";
const CACHE = join(DIR, "specs.json");
const UA = "DordamBot/1.0 (+https://dordam.app/about; price comparison)";

const decode = (text) =>
  text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
const clean = (html) => decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

function parse(page) {
  const start = page.indexOf('class="data-table flex-table"');
  if (start < 0) return [];
  const table = page.slice(start, page.indexOf("</table>", start));
  const groups = [];
  for (const [, row] of table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(([, c]) => clean(c)).filter(Boolean);
    if (cells.length === 1) groups.push({ group: cells[0], items: [] });
    else if (cells.length >= 2 && groups.length) groups.at(-1).items.push({ label: cells[0], value: cells.slice(1).join(" ") });
  }
  return groups.filter((g) => g.items.length && !/^warranty/i.test(g.group));
}

const cache = (() => {
  try {
    return JSON.parse(readFileSync(CACHE, "utf8"));
  } catch {
    return {};
  }
})();

const urls = new Set();
const isMobiledokan = (url) => /^https:\/\/(www\.)?mobiledokan\.(com|co)\//.test(url);
for (const file of readdirSync(DIR).filter((f) => f.endsWith(".json") && f !== "specs.json")) {
  for (const product of JSON.parse(readFileSync(join(DIR, file), "utf8")).products ?? []) {
    const src = product.specsSource;
    if (src && (/^https:\/\/www\.startech\.com\.bd\//.test(src) || isMobiledokan(src))) urls.add(src);
  }
}

for (const url of urls) {
  if (cache[url]?.length) continue;
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) {
    console.log(`skip ${url}: HTTP ${res.status}`);
    continue;
  }
  cache[url] = (isMobiledokan(url) ? parseMobiledokan : parse)(await res.text());
  console.log(`${cache[url].length} groups  ${url}`);
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

function parseMobiledokan(page) {
  const groups = [];
  const parts = page.matchAll(/<h[2-6][^>]*>([\s\S]*?)<\/h[2-6]>|<table[^>]*spec-grp-tbl[^>]*>([\s\S]*?)<\/table>/g);
  for (const [, heading, table] of parts) {
    if (heading !== undefined) {
      const name = clean(heading);
      if (name && (!groups.length || groups.at(-1).group !== name)) groups.push({ group: name, items: [] });
    } else if (groups.length) {
      for (const [, row] of table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
        const cells = [...row.matchAll(/<th[^>]*>([\s\S]*?)<\/th>|<td[^>]*>([\s\S]*?)<\/td>/g)]
          .map((c) => clean(c[1] ?? c[2])).filter(Boolean);
        if (cells.length >= 2) groups.at(-1).items.push({ label: cells[0], value: cells.slice(1).join(" ") });
      }
    }
  }
  return groups.filter((g) => g.items.length && !/^warranty/i.test(g.group));
}

writeFileSync(CACHE, `${JSON.stringify(cache, null, 1)}\n`);
