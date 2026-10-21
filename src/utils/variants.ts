import { AXES, type Axis, type VariantAttributes } from "@/types/catalog";

const SIZE_PATTERN = /\d+(?:\.\d+)?\s*(GB|TB)\b/gi;

export const sizeInGb = (size: string) => parseFloat(size) * (/TB/i.test(size) ? 1024 : 1);

export function variantLabel(attributes: VariantAttributes, axes: readonly Axis[] = AXES) {
  const value = (axis: Axis) => (axes.includes(axis) ? attributes[axis]?.trim() : undefined);
  const [ram, storage] = [value("ram"), value("storage")];
  const memory = ram && storage ? `${ram} / ${storage}` : ram || storage;
  const rest = axes.filter((axis) => axis !== "ram" && axis !== "storage" && axis !== "color").map(value);
  return [...rest, memory, value("color")].filter(Boolean).join(" ");
}

export function parseVariantLabel(label: string, axes: readonly Axis[]): VariantAttributes {
  const sizes = label.match(SIZE_PATTERN)?.map((s) => s.replace(/\s/g, "").toUpperCase()) ?? [];
  const attributes: VariantAttributes = {};
  if (axes.includes("storage") && sizes.length) attributes.storage = sizes.at(-1);
  if (axes.includes("ram") && sizes.length > 1) attributes.ram = sizes[0];
  if (axes.includes("size")) attributes.size = label.match(/\d+\s*mm/i)?.[0].replace(/\s/g, "");
  if (axes.includes("connectivity")) attributes.connectivity = label.match(/GPS\s*\+\s*Cellular|Cellular|GPS|Bluetooth|LTE|Wi-?Fi/i)?.[0];
  if (axes.includes("chip")) attributes.chip = label.match(/\b(M\d+(?:\s?(?:Pro|Max))?|A\d+\s?Pro|Snapdragon[\w\s]*|Core\s+i\d|Ryzen\s+\d)\b/i)?.[0];
  return Object.fromEntries(Object.entries(attributes).filter(([, v]) => v)) as VariantAttributes;
}

export function sortAxisValues(axis: Axis, values: string[]) {
  return axis === "ram" || axis === "storage" ? values.sort((a, b) => sizeInGb(a) - sizeInGb(b)) : values.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}
