import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { collaborationsWithActiveDisputeOpenedBy } from "./dispute-ownership";

// Injecteerbare fake Prisma-client: de eerste domainEvent.findMany (kandidaten, gefilterd op
// actorId) en de tweede (alle open/opgelost-events van die kandidaten) worden apart bediend zodat we
// de replay-logica realistisch testen zonder database. `type`/`actorId` van de kandidaat-query zijn
// irrelevant (de helper leest daar alleen subjectId).

interface Event {
  subjectId: string;
  type: string;
  actorId: string | null;
}

function fakeDb(opts: { openedByActor: Event[]; allEvents: Event[] }) {
  let call = 0;
  const db = {
    domainEvent: {
      findMany: (_args: unknown) => {
        call += 1;
        // Eerste aanroep: kandidaten (DISPUTE_OPENED van de actor). Tweede: alle relevante events.
        return Promise.resolve(call === 1 ? opts.openedByActor : opts.allEvents);
      },
    },
  };
  return db as unknown as PrismaClient;
}

const ACTOR = "user-A";
const OTHER = "user-B";

describe("collaborationsWithActiveDisputeOpenedBy", () => {
  it("neemt een samenwerking mee waar de actor het enige, nog-open dispuut opende", async () => {
    const db = fakeDb({
      openedByActor: [{ subjectId: "c1", type: "DISPUTE_OPENED", actorId: ACTOR }],
      allEvents: [{ subjectId: "c1", type: "DISPUTE_OPENED", actorId: ACTOR }],
    });
    expect(await collaborationsWithActiveDisputeOpenedBy(db, ACTOR)).toEqual(["c1"]);
  });

  it("sluit een samenwerking uit waar de tegenpartij ná een oplossing een nieuw dispuut opende", async () => {
    // Kern van de bevinding: de actor opende ooit, admin loste op, tegenpartij heropende → de live
    // reden is nu van de tegenpartij. De actor mag die niet in zijn export/erasure-scope krijgen.
    const db = fakeDb({
      openedByActor: [{ subjectId: "c1", type: "DISPUTE_OPENED", actorId: ACTOR }],
      allEvents: [
        { subjectId: "c1", type: "DISPUTE_OPENED", actorId: ACTOR },
        { subjectId: "c1", type: "DISPUTE_RESOLVED", actorId: "admin" },
        { subjectId: "c1", type: "DISPUTE_OPENED", actorId: OTHER },
      ],
    });
    expect(await collaborationsWithActiveDisputeOpenedBy(db, ACTOR)).toEqual([]);
  });

  it("sluit een opgelost (en niet-heropend) dispuut uit — er is geen live opener meer", async () => {
    const db = fakeDb({
      openedByActor: [{ subjectId: "c1", type: "DISPUTE_OPENED", actorId: ACTOR }],
      allEvents: [
        { subjectId: "c1", type: "DISPUTE_OPENED", actorId: ACTOR },
        { subjectId: "c1", type: "DISPUTE_RESOLVED", actorId: "admin" },
      ],
    });
    expect(await collaborationsWithActiveDisputeOpenedBy(db, ACTOR)).toEqual([]);
  });

  it("neemt een samenwerking mee waar de actor ná een tegenpartij-dispuut zélf het huidige opende", async () => {
    const db = fakeDb({
      openedByActor: [{ subjectId: "c1", type: "DISPUTE_OPENED", actorId: ACTOR }],
      allEvents: [
        { subjectId: "c1", type: "DISPUTE_OPENED", actorId: OTHER },
        { subjectId: "c1", type: "DISPUTE_RESOLVED", actorId: "admin" },
        { subjectId: "c1", type: "DISPUTE_OPENED", actorId: ACTOR },
      ],
    });
    expect(await collaborationsWithActiveDisputeOpenedBy(db, ACTOR)).toEqual(["c1"]);
  });

  it("scheidt meerdere samenwerkingen onafhankelijk", async () => {
    const db = fakeDb({
      openedByActor: [
        { subjectId: "c1", type: "DISPUTE_OPENED", actorId: ACTOR },
        { subjectId: "c2", type: "DISPUTE_OPENED", actorId: ACTOR },
      ],
      allEvents: [
        // c1: actor is de huidige opener.
        { subjectId: "c1", type: "DISPUTE_OPENED", actorId: ACTOR },
        // c2: door tegenpartij overgenomen → uitgesloten.
        { subjectId: "c2", type: "DISPUTE_OPENED", actorId: ACTOR },
        { subjectId: "c2", type: "DISPUTE_RESOLVED", actorId: "admin" },
        { subjectId: "c2", type: "DISPUTE_OPENED", actorId: OTHER },
      ],
    });
    expect(await collaborationsWithActiveDisputeOpenedBy(db, ACTOR)).toEqual(["c1"]);
  });

  it("geeft een lege lijst als de actor nooit een dispuut opende", async () => {
    const db = fakeDb({ openedByActor: [], allEvents: [] });
    expect(await collaborationsWithActiveDisputeOpenedBy(db, ACTOR)).toEqual([]);
  });
});
