const KEY = "recent-searches";
const LIMIT = 6;

export function readRecent(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(value) ? value.slice(0, LIMIT) : [];
  } catch {
    return [];
  }
}

export function rememberSearch(query: string) {
  const q = query.trim();
  if (!q) return;
  try {
    const next = [q, ...readRecent().filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(0, LIMIT);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}
