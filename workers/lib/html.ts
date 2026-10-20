const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function decode(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] !== "#") return ENTITIES[code.toLowerCase()] ?? whole;
    const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
    return Number.isFinite(n) ? String.fromCodePoint(n) : whole;
  });
}

export function stripTags(html: string): string {
  return decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

export function visibleText(html: string): string {
  const body = /<body[\s\S]*<\/body>/i.exec(html)?.[0] ?? html;
  return stripTags(body.replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, " "));
}

export function jsonLd(html: string): unknown[] {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  return blocks.flatMap(([, body]) => {
    try {
      return [JSON.parse(body.trim())];
    } catch {
      return [];
    }
  });
}

export function metaContent(html: string, key: string): string | null {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const name = /(?:property|name|itemprop)=["']([^"']+)["']/i.exec(tag)?.[1];
    if (name?.toLowerCase() !== key.toLowerCase()) continue;
    const content = /content=["']([^"']*)["']/i.exec(tag)?.[1];
    if (content != null) return decode(content);
  }
  return null;
}

export function title(html: string): string | null {
  const og = metaContent(html, "og:title");
  if (og) return og;
  const tag = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];
  return tag ? stripTags(tag) : null;
}
