export const HERO_QUOTE_DURATION = 2800;
export const HERO_QUOTE_HOLD = 400;
export const bound = (value) => Math.min(1, Math.max(0, value));
const mix = (a, b, t) => a + (b - a) * t;
const point = (a, b, t) => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) });

export function quoteAnchors(first, last, handWidth, gap, type) {
  const unit = handWidth / 21;
  return {
    // The lower path ends 16 units down from its tight SVG bounds.
    lower: {
      x: first.x - handWidth - gap,
      y: first.y + type.baseline + type.firstCenterOffset - 16 * unit,
    },
    // The upper path begins 2 units below its tight SVG bounds.
    upper: {
      x: last.x + last.width + gap,
      y: last.y + type.baseline + type.dotCenterOffset - 2 * unit,
    },
  };
}

// Measured layouts: intact logo, then each growing word group.
export function quoteFrame(progress, layouts, handWidth) {
  const p = bound(progress);
  const count = layouts.length - 1;
  const phase = p * count;
  const index = Math.min(count - 1, Math.floor(phase));
  const t = p === 1 ? 1 : phase - index;
  const a = layouts[index];
  const b = layouts[index + 1];
  const lower = point(a.lower, b.lower, t);
  const upper = point(a.upper, b.upper, t);
  const clip = {
    left: mix(a.bounds.left, b.bounds.left, t),
    right: mix(a.bounds.right, b.bounds.right, t),
    top: mix(a.bounds.top, b.bounds.top, t),
    bottom: mix(a.bounds.bottom, b.bounds.bottom, t),
  };
  // During the first opening, no letter may appear outside the moving hands.
  if (index === 0 && p < 1) {
    clip.left = Math.max(clip.left, lower.x + handWidth);
    clip.right = Math.max(clip.left, Math.min(clip.right, upper.x + handWidth * 0.2));
  }
  return {
    lower,
    upper,
    clip,
    words: layouts[count].words.map((final, i) => {
      if (i > index) return { ...final, opacity: 0 };
      if (i < index) return { ...point(a.words[i], b.words[i], t), opacity: 1 };
      const alpha = bound((t - 0.2) / 0.8);
      return { ...b.words[i], opacity: alpha * alpha * (3 - 2 * alpha) };
    }),
  };
}
