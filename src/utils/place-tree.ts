import type { Place } from "@/types/place";

export interface PlaceTree {
  byId: Map<string, Place>;
  children: Map<string, Place[]>;
}

export function buildTree(places: Place[]): PlaceTree {
  const byId = new Map(places.map((p) => [p.id, p]));
  const children = new Map<string, Place[]>();
  for (const place of places) {
    if (place.parentId) children.set(place.parentId, [...(children.get(place.parentId) ?? []), place]);
  }
  return { byId, children };
}

export function ancestorsOf(tree: PlaceTree, place: Place): Place[] {
  const chain: Place[] = [];
  let parent = place.parentId ? tree.byId.get(place.parentId) : undefined;
  while (parent && !chain.includes(parent)) {
    chain.unshift(parent);
    parent = parent.parentId ? tree.byId.get(parent.parentId) : undefined;
  }
  return chain;
}

export function childMarkets(tree: PlaceTree, id: string): Place[] {
  return (tree.children.get(id) ?? []).filter((p) => p.kind === "market");
}

export function shopsUnder(tree: PlaceTree, id: string): Place[] {
  const shops: Place[] = [];
  const seen = new Set<string>();
  const stack = [...(tree.children.get(id) ?? [])];
  while (stack.length) {
    const place = stack.pop()!;
    if (seen.has(place.id)) continue;
    seen.add(place.id);
    if (place.kind === "shop") shops.push(place);
    stack.push(...(tree.children.get(place.id) ?? []));
  }
  return shops;
}
