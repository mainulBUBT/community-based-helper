const digits = "০১২৩৪৫৬৭৮৯";

export function bn(value: number | string): string {
  return String(value).replace(/\d/g, (d) => digits[Number(d)]);
}
