export function deadline(minutes: number) {
  const end = Date.now() + minutes * 60_000;
  return () => Date.now() > end;
}
