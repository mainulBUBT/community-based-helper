import type { Listing } from "./types";

export function slugListing(url: string): Listing {
  const slug = new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
  return { title: decodeURIComponent(slug).replace(/[-_]+/g, " "), url, price: null, oldPrice: null };
}
