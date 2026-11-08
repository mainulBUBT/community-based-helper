import { AXES, type Axis, type VariantAttributes } from "@/types/catalog";

const SIZE_PATTERN = /\d+(?:\.\d+)?\s*(GB|TB)\b/gi;
// ওজন/আয়তন; বড় হাতের "5G"/"4G" নেটওয়ার্ক, ওজন নয় (ছোট হাতের "5g" ওজনই)
const CAPACITY_PATTERN = /(?<![\d.])(?![2-5]G\b)\d+(?:\.\d+)?\s*(?:[kK][gG]|[gG]|[mM][lL]|[lL]|[lL](?:itre|iter|ITRE|ITER))\b/;

export const capacityIn = (label: string) => label.match(CAPACITY_PATTERN)?.[0].replace(/\s/g, "");

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
  if (axes.includes("size")) attributes.size = label.match(/\d+(?:\.\d+)?\s*(mm|inch|in|")/i)?.[0].replace(/\s/g, "");
  if (axes.includes("connectivity")) attributes.connectivity = label.match(/GPS\s*\+\s*Cellular|Cellular|GPS|Bluetooth|LTE|Wi-?Fi|4G|5G/i)?.[0];
  if (axes.includes("chip")) attributes.chip = label.match(/\b(M\d+(?:\s?(?:Pro|Max))?|A\d+\s?Pro|Snapdragon[\w\s]*|Core\s+i\d|Ryzen\s+\d)\b/i)?.[0];
  if (axes.includes("gpu")) attributes.gpu = label.match(/\d+C\s*GPU|\d+\s*-?\s*core\s*GPU/i)?.[0];
  if (axes.includes("cpu")) attributes.cpu = label.match(/\d+C\s*CPU|\d+\s*-?\s*core\s*CPU/i)?.[0];
  if (axes.includes("resolution")) attributes.resolution = label.match(/\b(8K|4K|UHD|FHD|QHD|HD)\b/i)?.[0].toUpperCase();
  if (axes.includes("battery")) attributes.battery = label.match(/\d+\s*mAh/i)?.[0].replace(/\s/g, "");
  if (axes.includes("capacity")) attributes.capacity = capacityIn(label);
  if (axes.includes("wattage")) attributes.wattage = label.match(/\d+(?:\.\d+)?\s*W\b/i)?.[0].replace(/\s/g, "").toUpperCase();
  return Object.fromEntries(Object.entries(attributes).filter(([, v]) => v)) as VariantAttributes;
}

export const numericValue = (value: string) => {
  const num = Number.parseFloat(value.replace(",", "."));
  return Number.isNaN(num) ? 0 : num;
};

export function sortAxisValues(axis: Axis, values: string[]) {
  if (axis === "ram" || axis === "storage") return values.sort((a, b) => sizeInGb(a) - sizeInGb(b));
  if (axis === "battery" || axis === "capacity" || axis === "wattage") return values.sort((a, b) => numericValue(a) - numericValue(b));
  return values.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}
