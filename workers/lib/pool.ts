export async function pool<T>(items: T[], size: number, task: (item: T) => Promise<void>, stop: () => boolean = () => false) {
  const queue = [...items];
  const lane = async () => {
    for (let item = queue.shift(); item !== undefined && !stop(); item = queue.shift()) await task(item);
  };
  await Promise.all(Array.from({ length: size }, lane));
}

export function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) groups.set(key(item), [...(groups.get(key(item)) ?? []), item]);
  return groups;
}
