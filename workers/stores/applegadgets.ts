import { sitemapUrls } from "../lib/sitemap";
import { slugListing } from "./slug";
import type { Store } from "./types";

const ORIGIN = "https://www.applegadgetsbd.com";

export const applegadgets: Store = {
  id: "applegadgets",
  name: "Apple Gadgets",
  origin: ORIGIN,
  rendered: false,
  sample: `${ORIGIN}/product/iphone-17-pro-max`,
  promoUrl: null,
  async discover() {
    const urls = await sitemapUrls(`${ORIGIN}/product/sitemap.xml`);
    return urls.filter((url) => url.startsWith(`${ORIGIN}/product/`)).map(slugListing);
  },
};
