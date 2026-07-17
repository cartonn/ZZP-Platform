import { describe, expect, it } from "vitest";
import { P } from "@/lib/next-actions";
import {
  rankTasks,
  contractSignTask,
  credentialCollabExpiryTask,
  performanceSubmitTask,
  performanceApproveTask,
  invoiceSubmitTask,
  paymentConfirmTask,
  profileCompletenessTask,
  messageReplyTask,
  mandatoryDocumentTask,
  adminVerifyCredentialTask,
  adminDeletionRequestTask,
  adminResolveDisputeTask,
  adminSupportTicketTask,
  applicationsReviewTask,
  staleApplicationsTask,
  availabilityRefreshTask,
  draftJobsTask,
  franchiseCredentialExpiryTask,
  franchiseAcuteDienstTask,
  franchiseLeadFollowupTask,
  clientComplianceTask,
  reviewLeaveTask,
  vatDeadlineTask,
  type PendingTask,
} from "@/lib/actions/tasks";
import { type CredentialAlert } from "@/lib/collaboration-alerts";
import { summarizeVatDeadline } from "@/lib/administration/vat-deadline";

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

  it("performance-submit: link-resolver naar de samenwerking met submit-prioriteit (55)", () => {
    const t = performanceSubmitTask("c1", "Job");
    expect(t.kind).toBe("performance-submit");
    expect(t.resolver).toBe("link");
    expect(t.priority).toBe(P.messagesAwaiting);
    expect(t.id).toBe("performance-submit:c1");
    expect(t.href).toBe("/samenwerkingen/c1");
    expect(t.title).toContain("uren/oplevering in");
    expect(t.tone).toBe("attention");
    // Ligt onder de goedkeur-taak (65) maar boven een concept-factuur is gelijk; lager dan een
    // afgekeurde prestatie (62) — een eerste indiening is minder urgent dan een gebroken loop.
    expect(t.priority).toBeLessThan(performanceApproveTask("p1", "c1", "Job", "X").priority);
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

  it("wachtende kandidaten: attention-link naar /kandidaten, boven nieuwe reacties, benoemt de leeftijd", () => {
    const task = staleApplicationsTask({ count: 2, oldestDays: 19 });
    expect(task).toMatchObject({
      kind: "stale-applications",
      resolver: "link",
      href: "/kandidaten",
      tone: "attention",
    });
    expect(task.priority).toBe(P.staleApplications);
    expect(task.title).toContain("2 kandidaten");
    expect(task.subtitle).toContain("19 dagen");
    // Een reeds-bekeken kandidaat die blijft liggen weegt zwaarder dan een verse nieuwe reactie.
    expect(task.priority).toBeGreaterThan(applicationsReviewTask(1).priority);
  });

  it("wachtende kandidaten: enkelvoud netjes", () => {
    const task = staleApplicationsTask({ count: 1, oldestDays: 1 });
    expect(task.title).toContain("1 kandidaat wacht");
    expect(task.subtitle).toContain("1 dag ");
  });

  it("beoordelings-nudge: rustige link-taak naar de samenwerking, benoemt tegenpartij en venster", () => {
    const task = reviewLeaveTask("collab-9", "Nachtdienst verpleegkundige", "Zorggroep Noord", 10);
    expect(task).toMatchObject({
      kind: "review-leave",
      id: "review-leave:collab-9",
      resolver: "link",
      href: "/samenwerkingen/collab-9",
      tone: "info",
    });
    expect(task.priority).toBe(P.reviewPrompt);
    expect(task.title).toBe("Beoordeel Zorggroep Noord");
    expect(task.subtitle).toContain("Nachtdienst verpleegkundige");
    expect(task.subtitle).toContain("10 dagen");
    // Rustige nudge: onder de cosmetische profiel-completeness maar boven concept-opdrachten.
    expect(task.priority).toBeLessThan(P.completeness);
    expect(task.priority).toBeGreaterThan(P.drafts);
  });

  it("beoordelings-nudge: bijna gesloten venster (≤3 dagen) wordt attention", () => {
    const task = reviewLeaveTask("collab-9", "Klus", "Julia", 2);
    expect(task.tone).toBe("attention");
    expect(task.subtitle).toContain("2 dagen");
  });

  it("beoordelings-nudge: laatste dag toont 'venster sluit vandaag'", () => {
    const task = reviewLeaveTask("collab-9", "Klus", "Julia", 0);
    expect(task.tone).toBe("attention");
    expect(task.subtitle).toContain("venster sluit vandaag");
  });

  it("verlopen beschikbaarheid is een rustige link-taak naar /beschikbaarheid", () => {
    const task = availabilityRefreshTask();
    expect(task).toMatchObject({
      kind: "availability-refresh",
      resolver: "link",
      href: "/beschikbaarheid",
      tone: "info",
    });
    expect(task.priority).toBe(P.availabilityStale);
    // Findability-nudge: lichter dan een nieuwe reactie, zwaarder dan een cosmetisch compleetheidsgat.
    expect(task.priority).toBeLessThan(P.applications);
    expect(task.priority).toBeGreaterThan(P.completeness);
  });

  it("bemiddelaar: roster-certificaat-verloop is een per-ZZP'er link-taak naar het ZZP'er-detail", () => {
    const single = franchiseCredentialExpiryTask("prof-1", "Lars Bakker", 1);
    expect(single).toMatchObject({
      kind: "franchise-credential-expiry",
      profileId: "prof-1",
      resolver: "link",
      href: "/franchise/zzpers/prof-1",
      tone: "attention",
    });
    // Stabiele, per-ZZP'er-unieke id (React-key/dedupe) en enkelvoud.
    expect(single.id).toBe("franchise-credential-expiry:prof-1");
    expect(single.priority).toBe(P.franchiserCredentialExpiring);
    expect(single.title).toContain("Lars Bakker");
    expect(single.title).toContain("verloopt");

    // Meervoud telt de certificaten van die ene ZZP'er.
    const many = franchiseCredentialExpiryTask("prof-2", "Sanne de Vries", 3);
    expect(many.title).toContain("3");
    expect(many.title).toContain("verlopen");
    expect(many.id).toBe("franchise-credential-expiry:prof-2");
  });

  it("bemiddelaar: lead-opvolging is een aggregaat link-taak naar /franchise/leads", () => {
    const one = franchiseLeadFollowupTask(1);
    expect(one).toMatchObject({
      kind: "franchise-lead-followup",
      id: "franchise-lead-followup",
      resolver: "link",
      href: "/franchise/leads",
      tone: "attention",
    });
    expect(one.priority).toBe(P.franchiserLeadFollowup);
    expect(one.title).toContain("wacht");

    const many = franchiseLeadFollowupTask(4);
    expect(many.title).toContain("4");
    expect(many.title).toContain("wachten");
    // Roster-compliance weegt zwaarder dan lead-opvolging.
    expect(franchiseCredentialExpiryTask("p", "x", 1).priority).toBeGreaterThan(many.priority);
  });

  it("bemiddelaar: acute-onbezet is een aggregaat link-taak naar /franchise/diensten", () => {
    const mixed = franchiseAcuteDienstTask({ total: 3, fillableNow: 2, needsRecruiting: 1 });
    expect(mixed).toMatchObject({
      kind: "franchise-open-dienst-acute",
      id: "franchise-open-dienst-acute",
      resolver: "link",
      href: "/franchise/diensten",
      tone: "attention", // ≥1 dienst vraagt werving
    });
    expect(mixed.priority).toBe(P.franchiserServiceAcute);
    expect(mixed.title).toContain("3");
    expect(mixed.title).toContain("onbezet");
    expect(mixed.subtitle).toContain("werving");

    const one = franchiseAcuteDienstTask({ total: 1, fillableNow: 1, needsRecruiting: 0 });
    expect(one.title).toContain("dienst dreigt");
    expect(one.tone).toBe("info"); // alles vulbaar uit het roster → geen alarm
    // Acuut-onbezet weegt zwaarder dan roster-compliance én lead-opvolging.
    expect(one.priority).toBeGreaterThan(franchiseCredentialExpiryTask("p", "x", 1).priority);
    expect(one.priority).toBeGreaterThan(franchiseLeadFollowupTask(1).priority);
  });

  it("admin-support-ticket: link-taak naar de helpdesk met support-prioriteit (66)", () => {
    const t = adminSupportTicketTask("tkt-1", "Ik kan niet inloggen", "Bij de helpdesk");
    expect(t).toMatchObject({
      kind: "admin-support-ticket",
      id: "admin-support-ticket:tkt-1",
      resolver: "link",
      href: "/admin/support",
      tone: "attention",
      priority: P.supportOpen,
      ticketId: "tkt-1",
    });
    // Onderwerp + statuslabel in de subtitle, zodat elke rij onderscheidend is.
    expect(t.subtitle).toContain("Ik kan niet inloggen");
    expect(t.subtitle).toContain("Bij de helpdesk");
    // Ligt onder de verificatiewachtrij (70) maar boven pending-gebruikers (60).
    expect(t.priority).toBeLessThan(adminVerifyCredentialTask("c", "t", "n").priority);
    expect(t.priority).toBeGreaterThan(60);
  });
});

describe("vatDeadlineTask", () => {
  it("naderende deadline: link naar de boekhouding, af te dragen saldo, aftelling", () => {
    // 20 juli 2026 → Q2-deadline 31 juli (11 dagen, due-soon), saldo af te dragen.
    const summary = summarizeVatDeadline(
      [
        {
          party: "FREELANCER",
          account: "BTW_AF_TE_DRAGEN",
          debitCents: 0,
          creditCents: 42000,
          occurredAt: new Date("2026-06-15"),
        },
      ],
      "FREELANCER",
      new Date("2026-07-20"),
    );
    const t = vatDeadlineTask(summary);
    expect(t).toMatchObject({
      kind: "vat-deadline",
      id: "vat-deadline:2026-Q2",
      resolver: "link",
      href: "/administratie",
      tone: "attention",
      priority: P.vatDeadlineDueSoon,
      year: 2026,
      quarter: 2,
    });
    expect(t.title).toBe("BTW-aangifte 2e kwartaal 2026");
    expect(t.subtitle).toContain("af te dragen");
    expect(t.subtitle).toMatch(/nog \d+ dagen/);
  });

  it("verstreken deadline: hogere prioriteitsband + 'te laat'-signaal", () => {
    // 5 augustus 2026 → Q2-deadline was 31 juli (overdue).
    const summary = summarizeVatDeadline(
      [
        {
          party: "FREELANCER",
          account: "BTW_AF_TE_DRAGEN",
          debitCents: 0,
          creditCents: 30000,
          occurredAt: new Date("2026-06-15"),
        },
      ],
      "FREELANCER",
      new Date("2026-08-05"),
    );
    const t = vatDeadlineTask(summary);
    expect(t.priority).toBe(P.vatDeadlineOverdue);
    expect(t.priority).toBeGreaterThan(P.vatDeadlineDueSoon);
    expect(t.subtitle).toContain("te laat");
  });

  it("negatief saldo → 'terug te vorderen' i.p.v. 'af te dragen'", () => {
    const summary = summarizeVatDeadline(
      [
        {
          party: "CLIENT",
          account: "BTW_VOORBELASTING",
          debitCents: 18000,
          creditCents: 0,
          occurredAt: new Date("2026-06-10"),
        },
      ],
      "CLIENT",
      new Date("2026-07-20"),
    );
    const t = vatDeadlineTask(summary);
    expect(t.subtitle).toContain("terug te vorderen");
  });
});

describe("clientComplianceTask", () => {
  const emptyAlert: CredentialAlert = {
    status: "COMPLIANT",
    missing: [],
    expired: [],
    expiringSoon: [],
    inReview: [],
  };

  it("ontbrekend certificaat = acuut gat: attention + complianceRipple-band", () => {
    const t = clientComplianceTask("collab-1", "Sanne", "Verpleegkundige", {
      ...emptyAlert,
      status: "NON_COMPLIANT",
      missing: ["VOG"],
    });
    expect(t.kind).toBe("client-compliance");
    expect(t.id).toBe("client-compliance:collab-1");
    expect(t.href).toBe("/samenwerkingen/collab-1");
    expect(t.title).toBe("Sanne mist een vereist certificaat (VOG)");
    expect(t.subtitle).toContain("Verpleegkundige");
    expect(t.subtitle).toContain("vernieuwen");
    expect(t.tone).toBe("attention");
    expect(t.priority).toBe(P.complianceRipple);
  });

  it("verlopen certificaat = acuut gat: complianceRipple-band", () => {
    const t = clientComplianceTask("c2", "Bram", "Nachtdienst", {
      ...emptyAlert,
      status: "NON_COMPLIANT",
      expired: ["INSURANCE"],
    });
    expect(t.title).toBe("Certificaat van Bram is verlopen (Verzekering)");
    expect(t.priority).toBe(P.complianceRipple);
  });

  it("binnenkort verlopend = waarschuwing: lagere expiring-band, handel-vóór-vervalt-subtitle", () => {
    const t = clientComplianceTask("c3", "Iris", "Dagdienst", {
      ...emptyAlert,
      status: "WARNING",
      expiringSoon: ["DIPLOMA"],
    });
    expect(t.title).toBe("Certificaat van Iris verloopt binnenkort (Diploma)");
    expect(t.subtitle).toContain("vóór het certificaat vervalt");
    expect(t.priority).toBe(P.credentialExpiring);
    expect(t.priority).toBeLessThan(P.complianceRipple);
  });

  it("in beoordeling = waarschuwing: expiring-band", () => {
    const t = clientComplianceTask("c4", "Youssef", "Weekenddienst", {
      ...emptyAlert,
      status: "WARNING",
      inReview: ["CERTIFICATE"],
    });
    expect(t.title).toBe("Certificaat van Youssef in beoordeling (Certificaat)");
    expect(t.priority).toBe(P.credentialExpiring);
  });

  it("gap (ontbrekend) rangschikt vóór warning (verlopend) via rankTasks", () => {
    const warning = clientComplianceTask("c-warn", "A", "Job A", {
      ...emptyAlert,
      status: "WARNING",
      expiringSoon: ["VOG"],
    });
    const gap = clientComplianceTask("c-gap", "B", "Job B", {
      ...emptyAlert,
      status: "NON_COMPLIANT",
      missing: ["VOG"],
    });
    const ranked = rankTasks([warning, gap]);
    expect(ranked.map((t) => t.id)).toEqual([
      "client-compliance:c-gap",
      "client-compliance:c-warn",
    ]);
  });
});

describe("credentialCollabExpiryTask", () => {
  const base = {
    credId: "cred-1",
    credentialTitle: "VOG",
    collabId: "collab-1",
    companyName: "Zorggroep Noord",
    jobTitle: "Wijkverpleegkundige",
    extraCollabCount: 0,
  };

  it("noemt de samenwerking en linkt naar het vernieuw-formulier", () => {
    const t = credentialCollabExpiryTask({ ...base, daysUntilExpiry: 12 });
    expect(t.kind).toBe("credential-collab-expiry");
    expect(t.id).toBe("credential-collab-expiry:cred-1");
    expect(t.title).toBe("VOG verloopt tijdens je opdracht");
    expect(t.subtitle).toBe(
      "Verloopt over 12 dagen · vernieuw het voor je opdracht bij Zorggroep Noord (Wijkverpleegkundige)",
    );
    expect(t.href).toBe("/certificaten/cred-1/bewerken");
    expect(t.resolver).toBe("link");
    expect(t.tone).toBe("attention");
  });

  it("staat urgenter dan de generieke verval-taak maar onder afgewezen", () => {
    const t = credentialCollabExpiryTask({ ...base, daysUntilExpiry: 5 });
    expect(t.priority).toBe(P.credentialExpiringForCollab);
    expect(t.priority).toBeGreaterThan(P.credentialExpiring);
    expect(t.priority).toBeLessThan(P.credentialRejected);
  });

  it("gebruikt vandaag/morgen bij 0 en 1 dag", () => {
    expect(credentialCollabExpiryTask({ ...base, daysUntilExpiry: 0 }).subtitle).toContain(
      "Verloopt vandaag",
    );
    expect(credentialCollabExpiryTask({ ...base, daysUntilExpiry: 1 }).subtitle).toContain(
      "Verloopt morgen",
    );
  });

  it("toont het aantal extra samenwerkingen", () => {
    const t = credentialCollabExpiryTask({ ...base, daysUntilExpiry: 7, extraCollabCount: 2 });
    expect(t.subtitle).toContain("(+2 andere)");
  });
});
