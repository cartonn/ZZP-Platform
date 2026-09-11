export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smoothstep = (value) => value * value * (3 - 2 * value);

// Each card has a reading interval before the next continuous transition.
export function deckPosition(progress) {
  const timeline = clamp(progress) * 3;
  const stage = Math.floor(timeline);
  return Math.min(2, stage + smoothstep(clamp((timeline - stage - 0.62) / 0.38)));
}

export function cardPose(position, index) {
  const distance = index - position;
  const leaving = clamp(-distance);
  return {
    y: distance >= 0 ? distance * 17 : -42 * leaving,
    scale: distance >= 0 ? 1 - distance * 0.035 : 1 + leaving * 0.012,
    rotate: distance >= 0 ? distance * 0.45 : -0.8 * leaving,
    opacity: 1 - leaving,
    zIndex: 3 - index,
  };
}

export function storyMode({ width, viewport, header, content, tallestCard, reduced }) {
  if (reduced) return "flow";
  if (width >= 900 && content + header + 36 <= viewport) return "pinned";
  return tallestCard + header + 76 <= viewport ? "stack" : "flow";
}
