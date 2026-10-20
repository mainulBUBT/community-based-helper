import { USER_AGENT } from "./agent";
import { Disallowed, NotFound, StoreBlocked } from "./errors";
import { limited } from "./limiter";
import { isAllowed, parseRobots } from "./robots";

const robotsCache = new Map<string, Promise<ReturnType<typeof parseRobots>>>();
const blocked = new Map<string, StoreBlocked>();

const CHALLENGE = /cf-chl|challenge-platform|just a moment\.\.\.|attention required|captcha|access denied/i;

async function rawGet(url: URL): Promise<Response> {
  return limited(url.host, () =>
    fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
      redirect: "follow",
      signal: AbortSignal.timeout(30_000),
    }),
  );
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
      return res.ok ? parseRobots(await res.text()) : [];
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

export async function getText(target: string | URL): Promise<string> {
  const url = await assertAllowed(target);
  const res = await rawGet(url);
  const body = await res.text();
  checkStatus(url.host, res.status, body);
  if (res.status === 404 || res.status === 410) throw new NotFound(`${url.href} ${res.status}`);
  if (!res.ok) throw new Error(`${url.href} HTTP ${res.status}`);
  return body;
}
