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
const isStartech = (url) => /^https:\/\/www\.startech\.com\.bd\//.test(url);
const isDiamu = (url) => /^https:\/\/diamu\.com\.bd\//.test(url);
const isGadgetAndGear = (url) => /^https:\/\/(www\.)?gadgetandgear\.com\//.test(url);
for (const file of readdirSync(DIR).filter((f) => f.endsWith(".json") && f !== "specs.json")) {
  for (const product of JSON.parse(readFileSync(join(DIR, file), "utf8")).products ?? []) {
    const src = product.specsSource;
    if (src && (isStartech(src) || isMobiledokan(src) || isDiamu(src) || isGadgetAndGear(src))) urls.add(src);
  }
}

for (const url of urls) {
  if (cache[url]?.length) continue;
  let html;
  try {
    const res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      console.log(`skip ${url}: HTTP ${res.status}`);
      continue;
    }
    html = await res.text();
  } catch (error) {
    console.log(`skip ${url}: ${error.message}`);
    continue;
  }
  cache[url] = isMobiledokan(url) ? parseMobiledokan(html) : isDiamu(url) ? parseDiamu(html) : isGadgetAndGear(url) ? parseGadgetAndGear(html) : parse(html);
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

// Diamu একই "Specifications" শিরোনামের নিচে কোথাও <table>, কোথাও <ul><li>Label: Value</li> লেখে
function parseDiamu(page) {
  const heading = /<h2[^>]*>\s*Specifications\s*<\/h2>/i.exec(page);
  if (!heading) return [];
  let body = page.slice(heading.index + heading[0].length);
  const next = body.search(/<h2[\s>]/i);
  if (next >= 0) body = body.slice(0, next);
  const items = [];
  const end = body.indexOf("</table>");
  if (end >= 0) {
    for (const [, row] of body.slice(0, end).matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
      const cells = [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(([, cell]) => clean(cell)).filter(Boolean);
      if (cells.length >= 2) items.push({ label: cells[0], value: cells.slice(1).join(" ") });
    }
  }
  if (!items.length && body.includes("<ul")) {
    const list = body.slice(body.indexOf("<ul"), body.indexOf("</ul>") + 5);
    for (const [, li] of list.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)) {
      const text = clean(li);
      const at = text.indexOf(":");
      if (at > 0) items.push({ label: text.slice(0, at).trim(), value: text.slice(at + 1).trim() });
    }
  }
  return items.length ? [{ group: "General", items }] : [];
}

// Gadget & Gear: group heading rows (colspan) আর লেবেল/মান দুটো div-এর সারি
function parseGadgetAndGear(page) {
  const marker = page.indexOf("__specification");
  if (marker < 0) return [];
  const start = page.lastIndexOf("<table", marker);
  const end = page.indexOf("</table>", marker);
  if (start < 0 || end < 0) return [];
  const groups = [];
  for (const [, row] of page.slice(start, end).matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    if (/colspan/i.test(row)) {
      const name = clean(row);
      if (name) groups.push({ group: name, items: [] });
      continue;
    }
    const label = /class="basis-\[30%\]"[^>]*>([\s\S]*?)<\/div>/.exec(row);
    const value = /class="basis-\[70%\][^"]*"[^>]*>([\s\S]*?)<\/div>/.exec(row);
    if (label && value && groups.length) groups.at(-1).items.push({ label: clean(label[1]), value: clean(value[1]) });
  }
  return groups.filter((g) => g.items.length && !/^warranty/i.test(g.group));
}

writeFileSync(CACHE, `${JSON.stringify(cache, null, 1)}\n`);
