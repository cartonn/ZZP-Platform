/**
 * Puntenreeks voor een sparkline (SVG-polyline). Puur: schaalt `values` naar een
 * viewBox van `width` × `height` met `pad` marge. De laatste waarde eindigt rechts;
 * een vlakke reeks tekent een middenlijn (geen deling door nul).
 */
export function sparklinePoints(values: number[], width = 96, height = 28, pad = 2): string {
  if (values.length === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  if (values.length === 1) {
    const y = span === 0 ? height / 2 : pad + innerH / 2;
    return `${pad},${round(y)} ${width - pad},${round(y)}`;
  }
  const step = innerW / (values.length - 1);
  return values
    .map((v, i) => {
      const x = pad + i * step;
      const y = span === 0 ? height / 2 : pad + innerH - ((v - min) / span) * innerH;
      return `${round(x)},${round(y)}`;
    })
    .join(" ");
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
