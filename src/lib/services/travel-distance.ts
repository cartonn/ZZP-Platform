// Reistijd-schatting (ADR-0006, blok A). Deterministische OFFLINE stub: haversine over een kleine
// statische NL-stad-tabel → grove reistijd in minuten. Geen externe API, geen I/O, getest.
//
// Dit is bewust een benadering: `estimateTravelMinutes` is het ene aangrijpingspunt dat later
// vervangen wordt door een echte geocoding/routing-provider (OpenRouteService/Google/Mapbox) —
// dat is mensenwerk (API-key + kosten). De matching-integratie en het profielveld blijven dan gelijk.

interface Coord {
  lat: number;
  lon: number;
}

// Coördinaten van de plaatsen die in de seed/demo voorkomen (en de grootste NL-steden). Sleutels zijn
// genormaliseerd (lowercase). Onbekende plaatsen → geen schatting (null) → de matching valt terug op
// de stad-naam-vergelijking.
const NL_CITY_COORDS: Record<string, Coord> = {
  amsterdam: { lat: 52.3676, lon: 4.9041 },
  rotterdam: { lat: 51.9225, lon: 4.4792 },
  "den haag": { lat: 52.0705, lon: 4.3007 },
  utrecht: { lat: 52.0907, lon: 5.1214 },
  eindhoven: { lat: 51.4416, lon: 5.4697 },
  groningen: { lat: 53.2194, lon: 6.5665 },
  tilburg: { lat: 51.5555, lon: 5.0913 },
  "den bosch": { lat: 51.6978, lon: 5.3037 },
  "'s-hertogenbosch": { lat: 51.6978, lon: 5.3037 },
  zwolle: { lat: 52.5168, lon: 6.083 },
  arnhem: { lat: 51.9851, lon: 5.8987 },
  venlo: { lat: 51.3704, lon: 6.1724 },
  amersfoort: { lat: 52.1561, lon: 5.3878 },
  haarlem: { lat: 52.3874, lon: 4.6462 },
  almere: { lat: 52.3508, lon: 5.2647 },
};

const EARTH_RADIUS_KM = 6371;
// Grove omrekening hemelsbrede km → reistijd in minuten: ~1,5 (weg-omweg + gemiddelde NL-snelheid).
const KM_TO_MINUTES = 1.5;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Hemelsbrede afstand (km) tussen twee coördinaten (great-circle / haversine). */
export function haversineKm(a: Coord, b: Coord): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function normalizeCity(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Geschatte reistijd in minuten tussen twee plaatsen (op plaatsnaam). `null` als één van beide
 * plaatsen onbekend is — de aanroeper valt dan terug op een grovere heuristiek.
 */
export function estimateTravelMinutes(
  from: string | null | undefined,
  to: string | null | undefined,
): number | null {
  if (!from || !to) return null;
  const a = NL_CITY_COORDS[normalizeCity(from)];
  const b = NL_CITY_COORDS[normalizeCity(to)];
  if (!a || !b) return null;
  return Math.round(haversineKm(a, b) * KM_TO_MINUTES);
}
