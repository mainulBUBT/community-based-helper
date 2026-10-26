import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { USER_AGENT } from "./agent";
import { Disallowed, NotFound, StoreBlocked } from "./errors";
import { limited } from "./limiter";
import { isAllowed, parseRobots } from "./robots";

const robotsCache = new Map<string, Promise<ReturnType<typeof parseRobots>>>();
const blocked = new Map<string, StoreBlocked>();

const CHALLENGE = /cf-chl|challenge-platform|just a moment\.\.\.|attention required! \| cloudflare|cf-error-details/i;

// worker শুধু খোলা ইন্টারনেটের দোকান পড়ে; লোকাল নেটওয়ার্ক, রাউটার বা cloud metadata এর ঠিকানা নয়
const PRIVATE = new BlockList();
for (const [net, prefix] of [["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.168.0.0", 16], ["198.18.0.0", 15], ["224.0.0.0", 3]] as const) {
  PRIVATE.addSubnet(net, prefix, "ipv4");
}
for (const [net, prefix] of [["::", 127], ["64:ff9b::", 96], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8]] as const) PRIVATE.addSubnet(net, prefix, "ipv6");
const publicHosts = new Map<string, Promise<void>>();

// BlockList নিজেই ::ffff:127.0.0.1 ধরনের ঠিকানাকে IPv4 নিয়মে মেলায়
const isPrivate = (address: string) => PRIVATE.check(address, isIP(address) === 6 ? "ipv6" : "ipv4");

export function assertPublic(url: URL): Promise<void> {
  if (url.protocol !== "https:" && url.protocol !== "http:") return Promise.reject(new Disallowed(`${url.protocol} links are not fetched`));
  const host = url.hostname.replace(/^\[|\]$/g, "");
  let check = publicHosts.get(host);
  if (!check) {
    check = (isIP(host) ? Promise.resolve([{ address: host }]) : lookup(host, { all: true })).then((addresses) => {
      if (addresses.some(({ address }) => isPrivate(address))) throw new Disallowed(`${host} points to a private address`);
    });
    publicHosts.set(host, check);
  }
  return check;
}

// নিজের পরিচয় একই থাকে; সাধারণ ভাষা/এনকোডিং header না থাকলে কিছু দোকানের Cloudflare অনুরোধ আটকায়
const HEADERS = { "user-agent": USER_AGENT, "accept-language": "en-US,en;q=0.9,bn;q=0.8", "accept-encoding": "gzip, deflate, br" };

const MAX_REDIRECTS = 5;
// বড় দোকানের product sitemap (Beauty Booth ~৩.৩ MB) পুরোটা পড়তে
const MAX_BODY = 8 * 1024 * 1024;

const siteOf = (host: string) => host.replace(/^www\./, "");
const sameSite = (from: URL, to: URL) => to.protocol === "https:" || to.protocol === "http:" ? siteOf(to.hostname) === siteOf(from.hostname) || to.hostname.endsWith(`.${siteOf(from.hostname)}`) : false;

async function rawGet(url: URL, accept = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"): Promise<Response> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const target = current;
    await assertPublic(target);
    const res = await limited(target.host, () =>
      fetch(target, {
        headers: { ...HEADERS, accept },
        redirect: "manual",
        signal: AbortSignal.timeout(30_000),
      }),
    );
    const location = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
    if (!location) return res;
    await res.body?.cancel();
    const next = new URL(location, target);
    if (!sameSite(url, next)) throw new Error(`${url.href} redirects off-site to ${next.host}`);
    current = next;
  }
  throw new Error(`${url.href} redirects too many times`);
}

async function readCapped(res: Response): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

function block(host: string, reason: string): never {
  const error = new StoreBlocked(host, reason);
  blocked.set(host, error);
  throw error;
}

async function robotsFor(url: URL) {
  let rules = robotsCache.get(url.origin);
  if (!rules) {
    rules = rawGet(new URL("/robots.txt", url.origin)).then(async (res) => {
      if (res.status === 401 || res.status === 403 || res.status === 429) block(url.host, `robots.txt ${res.status}`);
      if (res.status >= 500) block(url.host, `robots.txt ${res.status}`);
      return res.ok ? parseRobots(await readCapped(res)) : [];
    });
    robotsCache.set(url.origin, rules);
  }
  return rules;
}

export function blockedHosts(): StoreBlocked[] {
  return [...blocked.values()];
}

export async function assertAllowed(target: string | URL): Promise<URL> {
  const url = new URL(target);
  await assertPublic(url);
  const prior = blocked.get(url.host);
  if (prior) throw prior;
  if (!isAllowed(await robotsFor(url), url)) throw new Disallowed(`robots.txt disallows ${url.pathname}`);
  return url;
}

export function checkStatus(host: string, status: number, body: string) {
  if (status === 401 || status === 403 || status === 429) block(host, `HTTP ${status}`);
  if ((status === 503 || status === 200) && CHALLENGE.test(body.slice(0, 5000)) && body.length < 50_000) block(host, "bot challenge");
}

export async function postForm(target: string | URL, form: Record<string, string>): Promise<string> {
  const url = await assertAllowed(target);
  const res = await limited(url.host, () =>
    fetch(url, {
      method: "POST",
      headers: { ...HEADERS, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(form),
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
    }),
  );
  const body = await readCapped(res);
  checkStatus(url.host, res.status, body);
  if (!res.ok) throw new Error(`${url.href} HTTP ${res.status}`);
  return body;
}

export async function getText(target: string | URL): Promise<string> {
  const url = await assertAllowed(target);
  const res = await rawGet(url);
  const body = await readCapped(res);
  checkStatus(url.host, res.status, body);
  if (res.status === 404 || res.status === 410) throw new NotFound(`${url.href} ${res.status}`);
  if (!res.ok) throw new Error(`${url.href} HTTP ${res.status}`);
  return body;
}

// কিছু API (যেমন Django REST) Accept দেখে HTML দেয়; JSON চাইলে এটা
export async function getJson(target: string | URL): Promise<unknown> {
  const url = await assertAllowed(target);
  const res = await rawGet(url, "application/json");
  const body = await readCapped(res);
  checkStatus(url.host, res.status, body);
  if (res.status === 404 || res.status === 410) throw new NotFound(`${url.href} ${res.status}`);
  if (!res.ok) throw new Error(`${url.href} HTTP ${res.status}`);
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}
