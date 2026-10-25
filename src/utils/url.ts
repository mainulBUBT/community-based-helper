export function safeUrl(value: unknown, { relative = false } = {}): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const url = value.trim();
  if (relative && url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) return url;
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

export const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export const categoryPath = (prefix: string, slug: string) => `${prefix}/category/${slug}/`;
