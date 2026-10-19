import type { Area, AreaHit } from "@/types/area";
import { distanceKm } from "./geo";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const CONTEXT_KM = 5;
const MAX_HITS = 8;

export interface IndexedArea {
  area: Area;
  names: string[][];
  container: boolean;
}

interface Candidate {
  entry: IndexedArea;
  parent?: Area;
  rank: number;
}

export function tokenize(text: string) {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[​-‍]/g, "")
    .replace(/[০-৯]/g, (digit) => String(BN_DIGITS.indexOf(digit)))
    .replace(/(\p{N})(?=[\p{L}\p{M}])|([\p{L}\p{M}])(?=\p{N})/gu, "$1$2 ")
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter(Boolean);
}

export const indexAreas = (areas: Area[]): IndexedArea[] =>
  areas.map((area) => ({
    area,
    names: [tokenize(area.name), tokenize(area.en ?? "")],
    container: area.kind === "suburb",
  }));

function score(query: string[], tokens: string[]) {
  let partial = 0;
  for (const word of query) {
    if (tokens.includes(word)) continue;
    if (!tokens.some((token) => token.startsWith(word))) return Infinity;
    partial++;
  }
  return partial * 100 + tokens.length;
}

const bestScore = (query: string[], entry: IndexedArea) => Math.min(...entry.names.map((tokens) => score(query, tokens)));

const contains = (parent: IndexedArea, context: string[]) =>
  parent.container && parent.names.some((tokens) => context.every((word) => tokens.includes(word)));

function splits(query: string[]) {
  return query.slice(1).flatMap((_, i) => [
    { context: query.slice(0, i + 1), rest: query.slice(i + 1) },
    { context: query.slice(query.length - i - 1), rest: query.slice(0, query.length - i - 1) },
  ]);
}

function directMatches(index: IndexedArea[], query: string[]): Candidate[] {
  return index.map((entry) => ({ entry, rank: bestScore(query, entry) })).filter((c) => c.rank < Infinity);
}

function contextMatches(index: IndexedArea[], query: string[]): Candidate[] {
  return splits(query).flatMap(({ context, rest }) =>
    index
      .filter((parent) => contains(parent, context))
      .flatMap((parent) =>
        index
          .filter((entry) => entry !== parent)
          .map((entry) => ({ entry, km: distanceKm(entry.area, parent.area) }))
          .filter(({ km }) => km <= CONTEXT_KM)
          .map(({ entry, km }) => ({ entry, parent: parent.area, rank: bestScore(rest, entry) + km / CONTEXT_KM }))
          .filter((c) => c.rank < Infinity),
      ),
  );
}

const byRank = (a: Candidate, b: Candidate) =>
  a.rank - b.rank || a.entry.area.name.localeCompare(b.entry.area.name, "bn", { numeric: true });

function toHit({ entry: { area }, parent }: Candidate): AreaHit {
  const detail = parent
    ? [area.en, parent.en].filter(Boolean).join(", ")
    : [area.en, area.near && `কাছে: ${area.near}`].filter(Boolean).join(" · ");
  return {
    key: `${area.name}:${area.lat}:${area.lng}`,
    label: parent ? `${area.name}, ${parent.name}` : area.name,
    detail,
    lat: area.lat,
    lng: area.lng,
  };
}

export function searchAreas(index: IndexedArea[], text: string): AreaHit[] {
  const query = tokenize(text);
  if (!query.length) return [];
  const ranked = [...directMatches(index, query).sort(byRank), ...contextMatches(index, query).sort(byRank)];
  const seen = new Set<Area>();
  const unique = ranked.filter(({ entry }) => {
    if (seen.has(entry.area)) return false;
    seen.add(entry.area);
    return true;
  });
  return unique.slice(0, MAX_HITS).map(toHit);
}
