import { describe, expect, it } from "vitest";
import { clientReengagement } from "./client-reengagement";
import { type ClientActivityInput } from "./client-health";

const NOW = new Date("2026-07-20T12:00:00.000Z");

function input(overrides: Partial<ClientActivityInput> = {}): ClientActivityInput {
  return {
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    publishedJobCount: 0,
    activeCollaborationCount: 0,
    lastActivityAt: null,
    ...overrides,
  };
}

describe("clientReengagement", () => {
  it("labelt een klant met open werk als actief, met tellingen en zonder actie", () => {
    const r = clientReengagement(input({ publishedJobCount: 2, activeCollaborationCount: 1 }), NOW);
    expect(r.status).toBe("active");
    expect(r.tone).toBe("success");
    expect(r.headline).toContain("2 open opdrachten");
    expect(r.headline).toContain("1 lopende plaatsing");
    expect(r.suggestion).toBeNull();
  });

  it("toont enkel de aanwezige telling als er alleen lopende plaatsingen zijn", () => {
    const r = clientReengagement(input({ activeCollaborationCount: 3 }), NOW);
    expect(r.status).toBe("active");
    expect(r.headline).toBe("Plaatst nu werk — 3 lopende plaatsingen.");
  });

  it("markeert een stilgevallen klant (≥30 dagen) met dagentelling + concrete stap", () => {
    const r = clientReengagement(
      input({ lastActivityAt: new Date("2026-05-01T00:00:00.000Z") }),
      NOW,
    );
    expect(r.status).toBe("attention");
    expect(r.tone).toBe("warning");
    expect(r.daysIdle).toBe(80);
    expect(r.headline).toContain("80 dagen");
    expect(r.suggestion).toContain("Neem contact op");
  });

  it("gebruikt de aanmelddatum als er nooit activiteit was", () => {
    const r = clientReengagement(input({ createdAt: new Date("2026-06-01T00:00:00.000Z") }), NOW);
    expect(r.status).toBe("attention");
    expect(r.daysIdle).toBe(49);
  });

  it("houdt een recent aangemelde klant zonder activiteit rustig", () => {
    const r = clientReengagement(input({ createdAt: new Date("2026-07-10T00:00:00.000Z") }), NOW);
    expect(r.status).toBe("quiet");
    expect(r.tone).toBe("muted");
    expect(r.headline).toBe("Recent aangemeld, plaatst nog niets.");
    expect(r.suggestion).toContain("Nog geen actie nodig");
  });

  it("toont een rustige klant met recente activiteit een dagentelling", () => {
    const r = clientReengagement(
      input({
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        lastActivityAt: new Date("2026-07-15T00:00:00.000Z"),
      }),
      NOW,
    );
    expect(r.status).toBe("quiet");
    expect(r.headline).toContain("5 dagen");
  });
});
