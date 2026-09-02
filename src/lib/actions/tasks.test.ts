import { describe, expect, it } from "vitest";
import { P } from "@/lib/next-actions";
import { UNBILLED_AGING_DAYS } from "@/lib/unbilled-invoices";
import { PROPOSAL_STALL_DAYS } from "@/lib/accepted-proposal";
import {
  rankTasks,
  selectDashboardTasks,
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
  proposeCollaborationTask,
  staleApplicationsTask,
  availabilityRefreshTask,
  idleCapacityTask,
  draftJobsTask,
  staleDraftJobTask,
  jobStaffingOverdueTask,
  franchiseCredentialExpiryTask,
  franchiseCredentialExpiredTask,
  franchiseAcuteDienstTask,
  franchiseStaleDienstTask,
  franchiseStaleDienstRollupTask,
  franchiseLeadFollowupTask,
  franchiseClientReengagementTask,
  clientComplianceTask,
  reviewLeaveTask,
  respondInvitationTask,
  vatDeadlineTask,
  incomeTaxDeadlineTask,
  hoursCriterionTask,
  paymentDueSoonTask,
  overdueInvoiceTask,
  type PendingTask,
} from "@/lib/actions/tasks";
import { type CredentialAlert } from "@/lib/collaboration-alerts";
import { summarizeVatDeadline } from "@/lib/administration/vat-deadline";
import { summarizeIncomeTaxDeadline } from "@/lib/administration/income-tax-deadline";
import { hoursCriterion } from "@/lib/tax/hours-criterion";
import {
  hoursCriterionHint,
  hoursPaceFeasibility,
  type HoursCriterionSummary,
} from "@/lib/tax/hours-criterion-summary";

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

describe("selectDashboardTasks", () => {
  // Zeven gerankte niet-floor attentie-taken die de top-6-rail vullen, plus een sluitend
  // beoordelingsvenster onderaan (floor-taak) — precies het run-49/50-scenario.
  const nonFloor = (): PendingTask[] =>
    rankTasks([
      mandatoryDocumentTask("VOG", "VOG-verklaring", "missing"), // 84
      contractSignTask("c1", "J", "A"), // 72
      performanceApproveTask("p1", "c1", "J", "S"), // 65
      overdueInvoiceTask(2, "FREELANCER"), // 60
      messageReplyTask("m1", "Julia", "Klus"), // 55
      staleApplicationsTask({ count: 3, oldestDays: 6 }), // 52
      applicationsReviewTask(4), // 50
    ]);

  it("zonder floor-taak: gewoon de top-`max` in rank-volgorde", () => {
    const ranked = nonFloor();
    const shown = selectDashboardTasks(ranked, 6);
    expect(shown).toHaveLength(6);
    expect(shown).toEqual(ranked.slice(0, 6));
    // De laagst-gerankte taak (applications, 50) valt buiten de slice.
    expect(shown.map((t) => t.kind)).not.toContain("applications-review");
  });

  it("floor-taak buiten de top-`max` wordt gegarandeerd getoond, laagst-gerankte niet-floor wijkt", () => {
    const closingReview = reviewLeaveTask("c9", "Klus", "Julia", 1); // deadlineFloor, prio 48
    const ranked = rankTasks([...nonFloor(), closingReview]);
    // In pure rank-volgorde zou de floor-taak (48) op plek 8 staan → buiten de top-6.
    expect(ranked.slice(0, 6)).not.toContainEqual(closingReview);

    const shown = selectDashboardTasks(ranked, 6);
    expect(shown).toHaveLength(6);
    // De floor-taak zit er nu wél in...
    expect(shown).toContainEqual(closingReview);
    // ...ten koste van de laagst-gerankte niet-floor-taak (applications, 50).
    expect(shown.map((t) => t.kind)).not.toContain("applications-review");
    // De hoogst-gerankte taak (mandatoryDoc, 84) blijft de held; volgorde blijft rank-volgorde.
    expect(shown[0]?.kind).toBe("mandatory-document");
    expect(shown).toEqual(ranked.filter((t) => shown.includes(t)));
  });

  it("floor-taak binnen de top-`max`: identiek aan een gewone slice (geen dubbele reservering)", () => {
    const closingReview = reviewLeaveTask("c9", "Klus", "Julia", 1);
    const ranked = rankTasks([
      contractSignTask("c1", "J", "A"),
      messageReplyTask("m1", "Julia", "Klus"),
      closingReview,
    ]);
    // 3 taken ≤ max → alles zichtbaar, ongewijzigd.
    expect(selectDashboardTasks(ranked, 6)).toEqual(ranked);
  });

  it("meerdere floor-taken verdringen samen evenveel niet-floor-taken", () => {
    const r1 = reviewLeaveTask("c8", "Klus", "Ana", 0);
    const r2 = reviewLeaveTask("c9", "Klus", "Bo", 2);
    const ranked = rankTasks([...nonFloor(), r1, r2]);
    const shown = selectDashboardTasks(ranked, 6);
    expect(shown).toHaveLength(6);
    expect(shown).toContainEqual(r1);
    expect(shown).toContainEqual(r2);
    // De twee laagst-gerankte niet-floor-taken (applications 50, staleApplications 52) wijken.
    expect(shown.map((t) => t.kind)).not.toContain("applications-review");
    expect(shown.map((t) => t.kind)).not.toContain("stale-applications");
  });

  it("meer floor-taken dan `max`: alleen de hoogst-gerankte floor-taken, geklemd op `max`", () => {
    const floors = rankTasks([
      reviewLeaveTask("c1", "K", "A", 0),
      reviewLeaveTask("c2", "K", "B", 1),
      reviewLeaveTask("c3", "K", "C", 2),
    ]);
    const shown = selectDashboardTasks(floors, 2);
    expect(shown).toHaveLength(2);
    expect(shown).toEqual(floors.slice(0, 2));
  });

  it("randgevallen: lege lijst en max ≤ 0", () => {
    expect(selectDashboardTasks([], 6)).toEqual([]);
    expect(selectDashboardTasks(nonFloor(), 0)).toEqual([]);
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

  it("job-staffing-overdue: link-resolver, boven een koud lopende opdracht en boven een verse reactie", () => {
    const t = jobStaffingOverdueTask("j1", "Nachtdienst VVT", -3, "review_shortlist");
    expect(t).toMatchObject({
      kind: "job-staffing-overdue",
      id: "job-staffing-overdue:j1",
      title: "Nachtdienst VVT",
      resolver: "link",
      tone: "attention",
      priority: P.jobStaffingOverdue,
      href: "/opdrachten/j1",
      jobId: "j1",
    });
    // Kop + volgende-stap komen uit `summarizeStaffingRisk` (geen drift met de detailkaart).
    expect(t.subtitle).toContain("De startdatum is verstreken");
    expect(t.subtitle).toContain("shortlist");
    // Een verstreken planning-deadline weegt zwaarder dan een koude opdracht en een verse reactie,
    // maar onder de kandidaten die al te lang op een beslissing wachten.
    expect(P.jobStaffingOverdue).toBeGreaterThan(P.jobNeedsAttention);
    expect(P.jobStaffingOverdue).toBeGreaterThan(P.applications);
    expect(P.jobStaffingOverdue).toBeLessThan(P.staleApplications);
  });

  it("job-staffing-overdue: kop voor 'gisteren' wijkt af (canonieke staffing-risk-tekst)", () => {
    const t = jobStaffingOverdueTask("j2", "Dagdienst", -1, "widen_reach");
    expect(t.subtitle).toContain("De startdatum was gisteren");
  });

  it("invoice-submit: afgekeurd weegt zwaarder dan een concept", () => {
    const draft = invoiceSubmitTask("i1", "c1", "Job", false);
    const rejected = invoiceSubmitTask("i2", "c1", "Job", true);
    expect(rejected.priority).toBeGreaterThan(draft.priority);
    expect(draft.title).toContain("Concept-factuur indienen");
    expect(rejected.title).toContain("opnieuw indienen");
  });

  it("invoice-submit: een verse concept blijft op de vlakke prioriteit (geen escalatie)", () => {
    const fresh = invoiceSubmitTask("i1", "c1", "Job", false, UNBILLED_AGING_DAYS - 1);
    expect(fresh.priority).toBe(P.messagesAwaiting);
    expect(fresh.subtitle).toBe("Job");
    // Zonder leeftijd (undefined) is het gedrag identiek — gedragsbehoudend.
    const noAge = invoiceSubmitTask("i1", "c1", "Job", false);
    expect(noAge.priority).toBe(P.messagesAwaiting);
    expect(noAge.subtitle).toBe("Job");
  });

  it("invoice-submit: een verouderde concept (≥ drempel) escaleert en noemt de leeftijd", () => {
    const aged = invoiceSubmitTask("i1", "c1", "Job", false, UNBILLED_AGING_DAYS);
    expect(aged.priority).toBe(P.conceptInvoiceAging);
    expect(aged.priority).toBeGreaterThan(P.messagesAwaiting);
    // Escaleert wél boven de pre-due nudges, maar blijft onder een reeds-verstreken factuur.
    expect(aged.priority).toBeLessThan(P.overdueInvoice);
    expect(aged.subtitle).toContain("Job");
    expect(aged.subtitle).toContain(`${UNBILLED_AGING_DAYS} dagen klaar`);
    expect(aged.tone).toBe("attention");
  });

  it("invoice-submit: leeftijd telt niet voor een afgekeurde factuur (blijft de rejected-band)", () => {
    const rejectedOld = invoiceSubmitTask("i1", "c1", "Job", true, 999);
    const rejectedNew = invoiceSubmitTask("i2", "c1", "Job", true);
    expect(rejectedOld.priority).toBe(rejectedNew.priority);
    expect(rejectedOld.subtitle).toBe("Job");
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
    // Zonder credId valt de link terug op het aanmaak-formulier (geen bestaand document bekend).
    expect(t.href).toBe("/certificaten/nieuw?type=VOG");
  });

  it("verplicht document verlopen mét credId: deep-link naar VERLENGEN i.p.v. nieuw aanmaken", () => {
    const t = mandatoryDocumentTask("VOG", "VOG", "expired", "cred-vog-1");
    expect(t.href).toBe("/certificaten/cred-vog-1/bewerken");
    expect(t.subtitle).toContain("vernieuw");
  });

  it("verplicht document ontbreekt negeert een meegegeven credId (altijd nieuw aanmaken)", () => {
    const t = mandatoryDocumentTask("VOG", "VOG", "missing", "cred-vog-1");
    expect(t.href).toBe("/certificaten/nieuw?type=VOG");
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

    const stale = staleDraftJobTask("job7", "Nachtdienst ZZP'er", 21);
    expect(stale).toMatchObject({
      kind: "stale-draft-job",
      jobId: "job7",
      title: "Nachtdienst ZZP'er",
      tone: "info",
      resolver: "link",
      href: "/opdrachten/job7/bewerken",
    });
    expect(stale.subtitle).toContain("21 dagen");
    // Een vergeten concept weegt zwaarder dan de passieve concept-telling, maar blijft licht.
    expect(stale.priority).toBe(P.staleDraftJob);
    expect(stale.priority).toBeGreaterThan(drafts.priority);
    expect(stale.priority).toBeLessThan(apps.priority);
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

  it("voorstel-nudge: link-taak naar de rij, benoemt kandidaat + opdracht, ná-accept-band", () => {
    const task = proposeCollaborationTask("app-7", "Wijkverpleegkundige", "Sanne de Vries");
    expect(task).toMatchObject({
      kind: "propose-collaboration",
      id: "propose-collaboration:app-7",
      resolver: "link",
      href: "/kandidaten?open=app-7",
      tone: "attention",
      applicationId: "app-7",
    });
    expect(task.priority).toBe(P.proposeCollaboration);
    expect(task.title).toBe("Stuur Sanne de Vries een samenwerkingsvoorstel");
    expect(task.subtitle).toContain("Wijkverpleegkundige");
    // Een genomen hire-beslissing weegt zwaarder dan nieuwe reacties beoordelen, lager dan een
    // al-voorgesteld contract dat op een handtekening wacht.
    expect(task.priority).toBeGreaterThan(applicationsReviewTask(1).priority);
    expect(task.priority).toBeGreaterThan(
      staleApplicationsTask({ count: 1, oldestDays: 5 }).priority,
    );
    expect(task.priority).toBeLessThan(P.contractSign);
  });

  it("voorstel-nudge: verse acceptatie (< drempel) blijft op de vlakke ná-accept-band", () => {
    const task = proposeCollaborationTask("app-7", "Wijkverpleegkundige", "Sanne de Vries", 1);
    expect(task.priority).toBe(P.proposeCollaboration);
    expect(task.subtitle).toBe(
      "Je accepteerde de reactie op Wijkverpleegkundige — rond de samenwerking af",
    );
  });

  it("voorstel-nudge: verouderde acceptatie (≥ drempel) escaleert naar de stalled-band + leeftijd-subtitel", () => {
    const task = proposeCollaborationTask("app-7", "Wijkverpleegkundige", "Sanne de Vries", 6);
    expect(task.priority).toBe(P.proposeCollaborationStalled);
    expect(task.priority).toBeGreaterThan(P.proposeCollaboration);
    expect(task.priority).toBeLessThan(P.contractSign);
    expect(task.subtitle).toBe("Wijkverpleegkundige · al 6 dagen geaccepteerd — rond de hire af");
    // Enkelvoud op één dag boven de drempel-bewoording (defensief, al is 1 < drempel).
    expect(proposeCollaborationTask("a", "Opdracht", "X", PROPOSAL_STALL_DAYS).subtitle).toContain(
      `al ${PROPOSAL_STALL_DAYS} dagen geaccepteerd`,
    );
  });

  it("voorstel-nudge (re-voorstel): copy benoemt de annulering, id/href/priority ongewijzigd", () => {
    const base = proposeCollaborationTask("app-7", "Wijkverpleegkundige", "Sanne de Vries", 1);
    const fresh = proposeCollaborationTask(
      "app-7",
      "Wijkverpleegkundige",
      "Sanne de Vries",
      1,
      true,
    );
    // Niet-stalled re-voorstel: nieuwe titel + subtitel over de annulering.
    expect(fresh.title).toBe("Stuur Sanne de Vries een nieuw samenwerkingsvoorstel");
    expect(fresh.subtitle).toBe(
      "Je vorige voorstel voor Wijkverpleegkundige is geannuleerd — stuur een nieuw voorstel",
    );
    // Identiteit + routing + prioriteit blijven gelijk aan de niet-re-voorstel-variant.
    expect(fresh.id).toBe(base.id);
    expect(fresh.href).toBe(base.href);
    expect(fresh.priority).toBe(base.priority);
    expect(fresh.priority).toBe(P.proposeCollaboration);
    expect(fresh.kind).toBe(base.kind);
    expect(fresh.tone).toBe(base.tone);
  });

  it("voorstel-nudge (re-voorstel, stalled): leeftijd-subtitel over de annulering, stalled-band behouden", () => {
    const baseStalled = proposeCollaborationTask(
      "app-7",
      "Wijkverpleegkundige",
      "Sanne de Vries",
      6,
    );
    const stalled = proposeCollaborationTask(
      "app-7",
      "Wijkverpleegkundige",
      "Sanne de Vries",
      6,
      true,
    );
    expect(stalled.title).toBe("Stuur Sanne de Vries een nieuw samenwerkingsvoorstel");
    expect(stalled.subtitle).toBe(
      "Wijkverpleegkundige · vorige voorstel geannuleerd, al 6 dagen — rond de hire af",
    );
    expect(stalled.priority).toBe(P.proposeCollaborationStalled);
    expect(stalled.priority).toBe(baseStalled.priority);
    expect(stalled.id).toBe(baseStalled.id);
    expect(stalled.href).toBe(baseStalled.href);
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
    // Ruim venster: geen floor-slot nodig (geen naderende deadline).
    expect(task.deadlineFloor).toBeUndefined();
  });

  it("beoordelings-nudge: bijna gesloten venster (≤3 dagen) wordt attention én escaleert de prioriteit", () => {
    const task = reviewLeaveTask("collab-9", "Klus", "Julia", 2);
    expect(task.tone).toBe("attention");
    expect(task.subtitle).toContain("2 dagen");
    // Prioriteit escaleert mee met de toon: een bijna-gesloten (onherstelbaar) venster mag niet
    // onder cosmetische info-nudges van de dashboardrail vallen.
    expect(task.priority).toBe(P.reviewPromptClosing);
    expect(task.priority).toBeGreaterThan(P.completeness);
    expect(task.priority).toBeGreaterThan(P.availabilityStale);
    // Onomkeerbaar-met-deadline → floor-slot op de dashboard-rail.
    expect(task.deadlineFloor).toBe(true);
  });

  it("beoordelings-nudge: laatste dag toont 'venster sluit vandaag' met geëscaleerde prioriteit", () => {
    const task = reviewLeaveTask("collab-9", "Klus", "Julia", 0);
    expect(task.tone).toBe("attention");
    expect(task.subtitle).toContain("venster sluit vandaag");
    expect(task.priority).toBe(P.reviewPromptClosing);
    expect(task.deadlineFloor).toBe(true);
  });

  it("uitnodiging-respons: link-taak naar de opdracht, benoemt opdrachtgever + leeftijd", () => {
    const task = respondInvitationTask(
      "job-7",
      "Nachtdienst verpleegkundige",
      "Zorggroep Noord",
      1,
    );
    expect(task).toMatchObject({
      kind: "respond-invitation",
      id: "respond-invitation:job-7",
      resolver: "link",
      href: "/opdrachten/job-7",
      tone: "info",
    });
    expect(task.priority).toBe(P.respondInvitation);
    expect(task.title).toBe("Reageer op de uitnodiging van Zorggroep Noord");
    expect(task.subtitle).toContain("Nachtdienst verpleegkundige");
    expect(task.subtitle).toContain("gisteren uitgenodigd");
    // Onder een lopend gesprek (messagesAwaiting), boven een client-side reactie-band.
    expect(task.priority).toBeLessThan(P.messagesAwaiting);
    expect(task.priority).toBeGreaterThan(P.staleApplications);
  });

  it("uitnodiging-respons: verse uitnodiging (vandaag) is rustig (info)", () => {
    const task = respondInvitationTask("job-7", "Klus", "Bakkerij Jansen", 0);
    expect(task.tone).toBe("info");
    expect(task.subtitle).toContain("vandaag uitgenodigd");
  });

  it("uitnodiging-respons: langer stil (≥5 dagen) wordt attention", () => {
    const task = respondInvitationTask("job-7", "Klus", "Bakkerij Jansen", 5);
    expect(task.tone).toBe("attention");
    expect(task.subtitle).toContain("5 dagen geleden uitgenodigd");
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

  it("onbenutte capaciteit is een rustige link-taak naar de marktplaats", () => {
    const task = idleCapacityTask(3);
    expect(task).toMatchObject({
      kind: "idle-capacity",
      id: "idle-capacity",
      resolver: "link",
      href: "/opdrachten",
      tone: "info",
      priority: P.openCapacity,
    });
    expect(task.title).toContain("3 open dagen");
    // Zachte inkomstenkans: boven de verlopen-beschikbaarheid-nudge, onder een koud lopende opdracht.
    expect(P.openCapacity).toBeGreaterThan(P.availabilityStale);
    expect(P.openCapacity).toBeLessThan(P.jobNeedsAttention);
  });

  it("onbenutte capaciteit: enkelvoud netjes", () => {
    const task = idleCapacityTask(1);
    expect(task.title).toContain("1 open dag");
    expect(task.title).not.toContain("open dagen");
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

  it("bemiddelaar: reeds-verlopen roster-certificaat is een urgentere per-ZZP'er link-taak", () => {
    const single = franchiseCredentialExpiredTask("prof-1", "Lars Bakker", 1);
    expect(single).toMatchObject({
      kind: "franchise-credential-expired",
      profileId: "prof-1",
      resolver: "link",
      href: "/franchise/zzpers/prof-1",
      tone: "attention",
    });
    expect(single.id).toBe("franchise-credential-expired:prof-1");
    expect(single.priority).toBe(P.franchiserCredentialExpired);
    expect(single.title).toContain("Lars Bakker");
    expect(single.title).toContain("verlopen");

    const many = franchiseCredentialExpiredTask("prof-2", "Sanne de Vries", 3);
    expect(many.title).toContain("3");
    expect(many.id).toBe("franchise-credential-expired:prof-2");

    // Reeds verlopen is urgenter dan "verloopt binnenkort": de compliance-gap is nu actief.
    expect(single.priority).toBeGreaterThan(
      franchiseCredentialExpiryTask("prof-1", "Lars Bakker", 1).priority,
    );
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

  it("bemiddelaar: stilgevallen opdrachtgever is een link-taak naar het klantdetail", () => {
    const t = franchiseClientReengagementTask("co-1", "Stille Zorg BV", 45);
    expect(t).toMatchObject({
      kind: "franchise-client-reengagement",
      id: "franchise-client-reengagement:co-1",
      companyId: "co-1",
      resolver: "link",
      href: "/franchise/opdrachtgevers/co-1",
      tone: "attention",
    });
    expect(t.priority).toBe(P.franchiserClientReengagement);
    expect(t.title).toContain("Stille Zorg BV");
    expect(t.subtitle).toContain("45");
    // Warmer dan koude lead-acquisitie, maar onder een aflopende plaatsing (daar loopt nog omzet).
    expect(t.priority).toBeGreaterThan(franchiseLeadFollowupTask(1).priority);
    expect(t.priority).toBeLessThan(P.franchiserCollaborationRenewal);
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

describe("incomeTaxDeadlineTask", () => {
  it("naderende deadline: link naar het aangifte-scherm, aftelling, forward-looking prioriteit", () => {
    // 15 apr 2027 → 16 dagen tot 1 mei 2027 (due-soon), belastingjaar 2026.
    const summary = summarizeIncomeTaxDeadline(new Date("2027-04-15T00:00:00Z"));
    const t = incomeTaxDeadlineTask(summary);
    expect(t).toMatchObject({
      kind: "income-tax-deadline",
      id: "income-tax-deadline:2026",
      resolver: "link",
      href: "/ontzorgd/aangifte",
      tone: "attention",
      priority: P.incomeTaxDeadlineDueSoon,
      taxYear: 2026,
    });
    expect(t.title).toBe("Aangifte inkomstenbelasting 2026");
    expect(t.subtitle).toMatch(/nog \d+ dagen/);
    expect(t.subtitle).toContain("jaaroverzicht staat klaar");
  });

  it("op de deadline-dag toont 'uiterlijk vandaag' (nooit 'te laat' — forward-looking)", () => {
    const summary = summarizeIncomeTaxDeadline(new Date("2027-05-01T09:00:00Z"));
    const t = incomeTaxDeadlineTask(summary);
    expect(t.subtitle).toContain("uiterlijk vandaag");
    expect(t.subtitle).not.toContain("te laat");
  });

  it("staat onder de BTW-deadline maar boven een naderende factuurbetaling", () => {
    expect(P.incomeTaxDeadlineDueSoon).toBeLessThan(P.vatDeadlineDueSoon);
    expect(P.incomeTaxDeadlineDueSoon).toBeGreaterThan(P.paymentDueSoon);
  });
});

describe("hoursCriterionTask", () => {
  function buildSummary(
    directHours: number,
    indirectHours: number,
    now: Date,
  ): HoursCriterionSummary {
    const criterion = hoursCriterion({ directHours, indirectHours, now });
    return {
      ...criterion,
      year: now.getUTCFullYear(),
      noActivity: directHours + indirectHours === 0,
      feasibility: hoursPaceFeasibility(criterion),
      hint: hoursCriterionHint(criterion),
    };
  }

  it("achterstand bijstuurbaar: link naar de uren-registratie, resterende uren + weektempo, forward-looking prioriteit", () => {
    const now = new Date("2026-07-02T12:00:00Z");
    const summary = buildSummary(600, 0, now);
    const t = hoursCriterionTask(summary);
    expect(t).toMatchObject({
      kind: "hours-criterion",
      id: "hours-criterion:2026",
      resolver: "link",
      href: "/ontzorgd/uren",
      tone: "attention",
      priority: P.hoursCriterionDueSoon,
      year: 2026,
    });
    expect(t.title).toBe(`Urencriterium 2026: nog ${summary.remainingHours} uur`);
    expect(t.subtitle).toContain(`${summary.hoursPerWeekNeeded} uur/week`);
    expect(t.subtitle).toContain("indirecte uren");
  });

  it("staat onder de concrete fiscale deadlines maar boven een generieke nieuwe reactie", () => {
    expect(P.hoursCriterionDueSoon).toBeLessThan(P.incomeTaxDeadlineDueSoon);
    expect(P.hoursCriterionDueSoon).toBeLessThan(P.vatDeadlineDueSoon);
    expect(P.hoursCriterionDueSoon).toBeGreaterThan(P.applications);
  });
});

describe("clientComplianceTask", () => {
  const emptyAlert: CredentialAlert = {
    status: "COMPLIANT",
    missing: [],
    expired: [],
    expiringSoon: [],
    expiringDuringPlacement: [],
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

  it("verloopt tijdens de opdracht = waarschuwing: einddatum-verankerde titel, expiring-band", () => {
    const t = clientComplianceTask("c5", "Nadia", "Langlopend project", {
      ...emptyAlert,
      status: "WARNING",
      expiringDuringPlacement: ["VOG"],
    });
    expect(t.title).toBe("Certificaat van Nadia verloopt vóór het einde van de opdracht (VOG)");
    expect(t.subtitle).toContain("vóór het certificaat vervalt");
    expect(t.priority).toBe(P.credentialExpiring);
    expect(t.priority).toBeLessThan(P.complianceRipple);
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

describe("paymentDueSoonTask", () => {
  it("pre-due nudge: info-toon, betaalreputatie-framing, link naar /facturen", () => {
    const t = paymentDueSoonTask(2);
    expect(t.kind).toBe("payment-due-soon");
    expect(t.id).toBe("payment-due-soon:CLIENT");
    expect(t.title).toBe("2 facturen vervallen binnenkort");
    expect(t.subtitle).toContain("Betaal op tijd");
    expect(t.subtitle).toContain("betaalreputatie");
    expect(t.tone).toBe("info");
    expect(t.priority).toBe(P.paymentDueSoon);
    expect(t.resolver).toBe("link");
    expect(t.href).toBe("/facturen");
  });

  it("enkelvoud vervoegt correct", () => {
    expect(paymentDueSoonTask(1).title).toBe("1 factuur vervalt binnenkort");
  });

  it("rangschikt onder de post-due roll-up (zachter dan te laat)", () => {
    expect(P.paymentDueSoon).toBeLessThan(P.overdueInvoice);
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

  it("rangschikt onder een reeds-verstreken BTW-aangifte (post-due > pre-due)", () => {
    // Een pre-due certificaat-vervalnudge (nog geldig) mag niet boven een reeds-
    // verstreken, boete-dragende BTW-aangifte staan. Boven contractSign blijft behouden.
    expect(P.credentialExpiringForCollab).toBeLessThan(P.vatDeadlineOverdue);
    expect(P.credentialExpiringForCollab).toBeGreaterThan(P.contractSign);
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

describe("overdueInvoiceTask", () => {
  it("ZZP'er zonder variant (chase/legacy): volgt op bij de opdrachtgever", () => {
    const t = overdueInvoiceTask(2, "FREELANCER");
    expect(t.id).toBe("overdue-invoice:FREELANCER");
    expect(t.subtitle).toBe("Volg op bij de opdrachtgever");
    expect(t.title).toContain("2");
    expect(t.priority).toBe(P.overdueInvoice);
  });

  it("ZZP'er cascade-variant (confirm): markeert zelf de betaling — eigen id", () => {
    const t = overdueInvoiceTask(1, "FREELANCER", "confirm");
    expect(t.id).toBe("overdue-invoice:FREELANCER:cascade");
    expect(t.subtitle).toBe("Markeer de betaling zodra je bent betaald");
    // Distinct id t.o.v. de chase-variant zodat beide rollups naast elkaar kunnen bestaan.
    expect(t.id).not.toBe(overdueInvoiceTask(1, "FREELANCER").id);
  });

  it("opdrachtgever: markeer als betaald (alleen legacy-facturen)", () => {
    const t = overdueInvoiceTask(3, "CLIENT");
    expect(t.id).toBe("overdue-invoice:CLIENT");
    expect(t.subtitle).toBe("Markeer als betaald");
  });
});

describe("franchise stale-dienst rollup vs. per-dienst prioriteit", () => {
  it("de rollup staat strikt onder de per-dienst-taak (specifieke, oudste diensten voorop — niet afhankelijk van de push-volgorde)", () => {
    const perDienst = franchiseStaleDienstTask("job-1", "Wijkverpleging", 12);
    const rollup = franchiseStaleDienstRollupTask(4);
    expect(rollup.priority).toBeLessThan(perDienst.priority);
    // rankTasks sorteert op prioriteit aflopend → de per-dienst-taak komt vóór de rollup, ongeacht
    // de invoervolgorde (hier bewust omgekeerd ingevoerd).
    const ranked = rankTasks([rollup, perDienst]);
    expect(ranked.map((t) => t.id)).toEqual([perDienst.id, rollup.id]);
  });
});
