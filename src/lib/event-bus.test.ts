import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventBus } from "@/lib/event-bus";
import { InMemoryEventStore, type DomainEventInput } from "@/lib/events";

function baseInput(overrides: Partial<DomainEventInput> = {}): DomainEventInput {
  return {
    type: "CONTRACT_SIGNED",
    actorRole: "CLIENT",
    subjectType: "Contract",
    subjectId: "c1",
    ...overrides,
  };
}

describe("EventBus", () => {
  let store: InMemoryEventStore;
  let bus: EventBus;

  beforeEach(() => {
    store = new InMemoryEventStore();
    bus = new EventBus(store);
  });

  it("persisteert het event en draait de geregistreerde handler", async () => {
    const handle = vi.fn();
    bus.register({ name: "h1", type: "CONTRACT_SIGNED", handle });

    const res = await bus.publish(baseInput());

    expect(res.created).toBe(true);
    expect(res.handlersRun).toEqual(["h1"]);
    expect(handle).toHaveBeenCalledOnce();
    expect(handle.mock.calls[0]?.[0]?.subjectId).toBe("c1");
  });

  it("draait alleen handlers van het juiste type", async () => {
    const signed = vi.fn();
    const approved = vi.fn();
    bus.register({ name: "a", type: "CONTRACT_SIGNED", handle: signed });
    bus.register({ name: "b", type: "INVOICE_APPROVED", handle: approved });

    await bus.publish(baseInput());

    expect(signed).toHaveBeenCalledOnce();
    expect(approved).not.toHaveBeenCalled();
  });

  it("dedupt op dedupeKey: tweemaal publiceren = één event, handler draait één keer", async () => {
    const handle = vi.fn();
    bus.register({ name: "h1", type: "CONTRACT_SIGNED", handle });

    const first = await bus.publish(baseInput({ dedupeKey: "contract-c1-signed" }));
    const second = await bus.publish(baseInput({ dedupeKey: "contract-c1-signed" }));

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.event.id).toBe(first.event.id);
    expect(second.handlersRun).toEqual([]);
    expect(second.handlersSkipped).toEqual(["h1"]);
    expect(handle).toHaveBeenCalledOnce();
    expect(store.all()).toHaveLength(1);
  });

  it("een onderbroken cascade herstelt: nog-niet-geclaimde handler draait bij replay", async () => {
    const ok = vi.fn();
    const flaky = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce(undefined);
    bus.register({ name: "ok", type: "CONTRACT_SIGNED", handle: ok });
    bus.register({ name: "flaky", type: "CONTRACT_SIGNED", handle: flaky });

    // Eerste publish: ok slaagt, flaky faalt -> claim teruggegeven, error doorgegooid.
    await expect(bus.publish(baseInput({ dedupeKey: "k" }))).rejects.toThrow("boom");
    expect(ok).toHaveBeenCalledOnce();

    // Replay (zelfde dedupeKey): geen dubbel event, ok wordt overgeslagen, flaky draait opnieuw.
    const replay = await bus.publish(baseInput({ dedupeKey: "k" }));
    expect(replay.created).toBe(false);
    expect(replay.handlersSkipped).toContain("ok");
    expect(replay.handlersRun).toContain("flaky");
    expect(ok).toHaveBeenCalledOnce(); // niet opnieuw
    expect(flaky).toHaveBeenCalledTimes(2);
    expect(store.all()).toHaveLength(1);
  });

  it("zonder dedupeKey zijn het losse events die elk draaien", async () => {
    const handle = vi.fn();
    bus.register({ name: "h1", type: "CONTRACT_SIGNED", handle });

    await bus.publish(baseInput());
    await bus.publish(baseInput());

    expect(handle).toHaveBeenCalledTimes(2);
    expect(store.all()).toHaveLength(2);
  });

  it("weigert dezelfde handlernaam tweemaal voor één type", () => {
    bus.register({ name: "dup", type: "CONTRACT_SIGNED", handle: vi.fn() });
    expect(() =>
      bus.register({ name: "dup", type: "CONTRACT_SIGNED", handle: vi.fn() }),
    ).toThrowError(/al geregistreerd/);
  });

  it("groepeert events van één cascade via correlationId", async () => {
    await bus.publish(baseInput({ correlationId: "corr-1", type: "CONTRACT_SIGNED" }));
    await bus.publish(
      baseInput({
        correlationId: "corr-1",
        type: "PERFORMANCE_SUBMITTED",
        subjectType: "Performance",
      }),
    );
    await bus.publish(baseInput({ correlationId: "corr-2", type: "CONTRACT_SIGNED" }));

    const chain = await store.byCorrelation("corr-1");
    expect(chain.map((e) => e.type)).toEqual(["CONTRACT_SIGNED", "PERFORMANCE_SUBMITTED"]);
  });
});
