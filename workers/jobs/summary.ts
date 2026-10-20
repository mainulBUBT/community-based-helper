import { bn } from "../lib/bn";
import { blockedHosts } from "../lib/http";

export function blockedNote(): string {
  const hosts = blockedHosts();
  return hosts.length ? `; বন্ধ: ${hosts.map((b) => b.message).join(", ")}` : "";
}

export function count(n: number, what: string) {
  return `${bn(n)}টা ${what}`;
}
