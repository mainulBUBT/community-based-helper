import type { Quote } from "../lib/price";

export interface Listing {
  title: string;
  url: string;
  price: number | null;
  oldPrice: number | null;
}

export interface Store {
  id: string;
  name: string;
  origin: string;
  rendered: boolean;
  priceSelector?: string;
  sample: string;
  promoUrl: string | null;
  parse?: (html: string) => Quote | null;
  discover: (names: string[]) => Promise<Listing[]>;
}
