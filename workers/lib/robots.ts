import { BOT_NAME } from "./agent";

interface Rule {
  allow: boolean;
  pattern: RegExp;
  length: number;
}

function toRegExp(path: string): RegExp {
  const anchored = path.endsWith("$");
  const body = (anchored ? path.slice(0, -1) : path)
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`);
}

export function parseRobots(text: string): Rule[] {
  const groups: { agents: string[]; rules: Rule[] }[] = [];
  let current: { agents: string[]; rules: Rule[] } | null = null;
  let collectingAgents = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const match = /^([a-z-]+)\s*:\s*(.*)$/i.exec(line);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (key === "user-agent") {
      if (!current || !collectingAgents) groups.push((current = { agents: [], rules: [] }));
      current.agents.push(value.toLowerCase());
      collectingAgents = true;
    } else if ((key === "allow" || key === "disallow") && current) {
      collectingAgents = false;
      if (value) current.rules.push({ allow: key === "allow", pattern: toRegExp(value), length: value.length });
    } else {
      collectingAgents = false;
    }
  }
  const name = BOT_NAME.toLowerCase();
  const own = groups.filter((g) => g.agents.some((a) => a !== "*" && name.includes(a)));
  const chosen = own.length ? own : groups.filter((g) => g.agents.includes("*"));
  return chosen.flatMap((g) => g.rules);
}

export function isAllowed(rules: Rule[], url: URL): boolean {
  const path = url.pathname + url.search;
  let best: Rule | null = null;
  for (const rule of rules) {
    if (!rule.pattern.test(path)) continue;
    if (!best || rule.length > best.length || (rule.length === best.length && rule.allow)) best = rule;
  }
  return best ? best.allow : true;
}
