import { applegadgets } from "./applegadgets";
import { gadgetandgear } from "./gadgetandgear";
import { pickaboo } from "./pickaboo";
import { startech } from "./startech";
import type { Store } from "./types";

export const stores: Store[] = [startech, pickaboo, applegadgets, gadgetandgear];

export function storeFor(url: string): Store | undefined {
  const host = new URL(url).host.replace(/^www\./, "");
  return stores.find((store) => new URL(store.origin).host.replace(/^www\./, "") === host);
}
