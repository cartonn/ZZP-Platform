import { describe, expect, it } from "vitest";
import { P } from "@/lib/next-actions";
import {
  rankTasks,
  contractSignTask,
  performanceApproveTask,
  invoiceSubmitTask,
  paymentConfirmTask,
  profileCompletenessTask,
  messageReplyTask,
  mandatoryDocumentTask,
  adminVerifyCredentialTask,
  adminDeletionRequestTask,
  adminResolveDisputeTask,
  applicationsReviewTask,
  draftJobsTask,
  type PendingTask,
} from "@/lib/actions/tasks";

describe("rankTasks", () => {
  it("sorteert op prioriteit aflopend, stabiel bij gelijke prioriteit", () => {
    const a = contractSignTask("c1", "Job", "Acme"); // 72
    const b = profileCompletenessTask(70, ["Uurtarief"]); // 30
    const c = adminResolveDisputeTask("c2", "Job"); // 76
    const ranked = rankTasks([a, b, c]);
    expect(ranked.map((t) => t.kind)).toEqual([
      "admin-resolve-dispute",
      "contract-sign",
      "profile-complete",
    ]);
  });

  it("lege input → lege lijst", () => {
    expect(rankTasks([])).toEqual([]);
  });

  it("muteert de invoer niet", () => {
    const input: PendingTask[] = [
      contractSignTask("c1", "J", "A"),
      paymentConfirmTask("i1", "c1", "J"),
    ];
    const snapshot = input.map((t) => t.id);
    rankTasks(input);
    expect(input.map((t) => t.id)).toEqual(snapshot);
  });
});

describe("task builders", () => {
  it("contract-sign: oneClick, attention, deep-link naar de samenwerking", () => {
    const t = contractSignTask("c1", "Senior Dev", "Acme BV");
    expect(t).toMatchObject({
      kind: "contract-sign",
      id: "contract-sign:c1",
      resolver: "oneClick",
      tone: "attention",
      priority: P.contractSign,
      href: "/samenwerkingen/c1",
      collabId: "c1",
    });
  });

  it("performance-approve: drawer-resolver (inspecteer-dan-beslis) met approve-prioriteit (65)", () => {
    const t = performanceApproveTask("p1", "c1", "Job", "Sanne");
    expect(t.kind).toBe("performance-approve");
    expect(t.resolver).toBe("drawer");
    expect(t.priority).toBe(65);
    expect(t.id).toBe("performance-approve:p1");
  });

  it("invoice-submit: afgekeurd weegt zwaarder dan een concept", () => {
    const draft = invoiceSubmitTask("i1", "c1", "Job", false);
    const rejected = invoiceSubmitTask("i2", "c1", "Job", true);
    expect(rejected.priority).toBeGreaterThan(draft.priority);
    expect(draft.title).toContain("Concept-factuur indienen");
    expect(rejected.title).toContain("opnieuw indienen");
  });

  it("profiel-compleetheid noemt de ontbrekende velden (max 3)", () => {
    const t = profileCompletenessTask(60, ["Uurtarief", "Talen", "Locatie", "Bio"]);
    expect(t.subtitle).toBe("Voeg toe: Uurtarief, Talen, Locatie");
    expect(t.resolver).toBe("drawer");
  });

  it("bericht-taak benoemt afzender + onderwerp zodat meerdere rijen onderscheidend zijn", () => {
    const withJob = messageReplyTask("conv1", "Mark Jansen", "Senior React Developer");
    expect(withJob.title).toBe("Beantwoord Mark Jansen");
    expect(withJob.subtitle).toBe("Over: Senior React Developer");
    expect(withJob.href).toBe("/berichten/conv1");

    // Twee gesprekken met verschillende afzenders leveren onderscheidende rijen op.
    const other = messageReplyTask("conv2", "Sofie Willems", "Fullstack Developer");
    expect(other.title).not.toBe(withJob.title);

    // Zonder gekoppelde opdracht valt het terug op een nette generieke subtitel.
    const noJob = messageReplyTask("conv3", "Nadia Haddad", null);
    expect(noJob.subtitle).toBe("Nieuw bericht");
  });

  it("certificaat-beoordeling benoemt de indiener zodat de wachtrij niet uit identieke rijen bestaat", () => {
    const a = adminVerifyCredentialTask("c1", "VOG", "Sanne de Vries");
    const b = adminVerifyCredentialTask("c2", "VOG", "Bram Koster");
    expect(a.title).toBe("Beoordeel het certificaat van Sanne de Vries");
    expect(a.subtitle).toBe("VOG");
    expect(a.title).not.toBe(b.title);
  });

  it("verplicht document ontbreekt: hoge prioriteit (blokkeert inzetbaarheid) + deep-link met type", () => {
    const t = mandatoryDocumentTask("INSURANCE", "Verzekering", "missing");
    expect(t).toMatchObject({
      kind: "mandatory-document",
      id: "mandatory-document:INSURANCE",
      resolver: "link",
      tone: "attention",
      priority: P.mandatoryDoc,
      href: "/certificaten/nieuw?type=INSURANCE",
    });
    expect(t.title).toBe("Verplicht document ontbreekt: Verzekering");
    // Blokkeert inzetbaarheid → weegt zwaarder dan een afgewezen (niet-verplicht) certificaat,
    // maar lichter dan identiteitsverificatie.
    expect(P.mandatoryDoc).toBeGreaterThan(P.credentialRejected);
    expect(P.mandatoryDoc).toBeLessThan(P.identity);
  });

  it("verplicht document verlopen: eigen titel, zelfde band", () => {
    const t = mandatoryDocumentTask("VOG", "VOG", "expired");
    expect(t.title).toBe("Verplicht document verlopen: VOG");
    expect(t.id).toBe("mandatory-document:VOG");
    expect(t.priority).toBe(P.mandatoryDoc);
  });

  it("AVG-verwijderverzoek blijft een link (onomkeerbaar, geen één-klik)", () => {
    const t = adminDeletionRequestTask("u1", "Jan");
    expect(t.resolver).toBe("link");
    expect(t.priority).toBe(P.blocking);
  });

  it("nieuwe reacties + concept-opdrachten zijn link-taken (pariteit met de aggregaat)", () => {
    const apps = applicationsReviewTask(3);
    expect(apps).toMatchObject({
      kind: "applications-review",
      resolver: "link",
      href: "/kandidaten",
    });
    expect(apps.priority).toBe(P.applications);
    expect(apps.title).toContain("3");

    const drafts = draftJobsTask(2);
    expect(drafts).toMatchObject({ kind: "draft-jobs", resolver: "link", href: "/opdrachten" });
    expect(drafts.priority).toBe(P.drafts);
    // Concept-opdrachten wegen lichter dan nieuwe reacties.
    expect(drafts.priority).toBeLessThan(apps.priority);
  });
});
