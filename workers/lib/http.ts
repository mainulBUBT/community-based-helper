import { USER_AGENT } from "./agent";
import { Disallowed, NotFound, StoreBlocked } from "./errors";
import { limited } from "./limiter";
import { isAllowed, parseRobots } from "./robots";

const robotsCache = new Map<string, Promise<ReturnType<typeof parseRobots>>>();
const blocked = new Map<string, StoreBlocked>();

const CHALLENGE = /cf-chl|challenge-platform|just a moment\.\.\.|attention required|captcha|access denied/i;

const MAX_REDIRECTS = 5;
const MAX_BODY = 3 * 1024 * 1024;

const siteOf = (host: string) => host.replace(/^www\./, "");
const sameSite = (from: URL, to: URL) => to.protocol === "https:" || to.protocol === "http:" ? siteOf(to.hostname) === siteOf(from.hostname) || to.hostname.endsWith(`.${siteOf(from.hostname)}`) : false;

async function rawGet(url: URL): Promise<Response> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const target = current;
    const res = await limited(target.host, () =>
      fetch(target, {
        headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
        redirect: "manual",
        signal: AbortSignal.timeout(30_000),
      }),
    );
    const location = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
    if (!location) return res;
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
      headers: { "user-agent": USER_AGENT, "content-type": "application/x-www-form-urlencoded" },
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
