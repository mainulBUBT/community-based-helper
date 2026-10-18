const AREA_RADIUS_KM = 2.5;

export function distanceKm(a, b) {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lng - a.lng) * rad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function nearestArea(point, areas) {
  let best = null;
  for (const area of areas) {
    const km = distanceKm(point, area);
    if (km <= AREA_RADIUS_KM && (!best || km < best.km)) best = { name: area.name, km };
  }
  return best?.name ?? null;
}
