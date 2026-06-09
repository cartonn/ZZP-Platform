/**
 * Segmentlogica voor de matchmeter (DESIGN.md — Vakwerk-signatuur): een score 0–100
 * wordt afgebeeld op `total` segmenten. Puur en deterministisch; afronden op het
 * dichtstbijzijnde segment zodat 92% → 9 van 10 en 5% → 1 segment (niet leeg bij >0).
 */
export function meterSegments(score: number, total = 10): boolean[] {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  const filled =
    clamped === 0 ? 0 : Math.max(1, Math.min(total, Math.round((clamped / 100) * total)));
  return Array.from({ length: total }, (_, i) => i < filled);
}
