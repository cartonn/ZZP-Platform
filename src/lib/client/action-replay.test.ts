import { describe, expect, it, vi, afterEach } from "vitest";
import { createReplayScheduler, REPLAY_DELAYS_MS } from "./action-replay";

afterEach(() => {
  vi.useRealTimers();
});

describe("createReplayScheduler", () => {
  it("plant precies één zetje per vertraging, in oplopende volgorde", () => {
    vi.useFakeTimers();
    const nudge = vi.fn();
    const scheduler = createReplayScheduler(nudge, [10, 20, 30]);

    scheduler.trigger();
    expect(nudge).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(10);
    expect(nudge).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(20);
    expect(nudge).toHaveBeenCalledTimes(3);

    // Daarna loopt er niets meer: geen permanente timer.
    vi.advanceTimersByTime(10_000);
    expect(nudge).toHaveBeenCalledTimes(3);
  });

  it("breekt een lopende reeks af bij een nieuwe interactie (geen opstapeling)", () => {
    vi.useFakeTimers();
    const nudge = vi.fn();
    const scheduler = createReplayScheduler(nudge, [10, 20]);

    scheduler.trigger();
    vi.advanceTimersByTime(5);
    scheduler.trigger();
    vi.advanceTimersByTime(25);

    expect(nudge).toHaveBeenCalledTimes(2);
  });

  it("annuleert alles bij cancel (unmount laat geen timer achter)", () => {
    vi.useFakeTimers();
    const nudge = vi.fn();
    const scheduler = createReplayScheduler(nudge, [10, 20]);

    scheduler.trigger();
    scheduler.cancel();
    vi.advanceTimersByTime(100);

    expect(nudge).not.toHaveBeenCalled();
  });

  it("gebruikt standaard een eindige, oplopende reeks binnen enkele seconden", () => {
    expect(REPLAY_DELAYS_MS.length).toBeGreaterThan(0);
    expect([...REPLAY_DELAYS_MS]).toEqual([...REPLAY_DELAYS_MS].sort((a, b) => a - b));
    expect(REPLAY_DELAYS_MS[0]).toBeGreaterThan(0);
    expect(REPLAY_DELAYS_MS[REPLAY_DELAYS_MS.length - 1]).toBeLessThanOrEqual(5000);
  });
});
