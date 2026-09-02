import { describe, expect, it } from "vitest";
import {
  buildBadges,
  countClientCascadeWork,
  countUnreadConversations,
  startOfUtcDay,
  withActionCenterBadge,
} from "./signals";

describe("buildBadges", () => {
  it("laat items met telling 0 of ontbrekend weg", () => {
    expect(buildBadges({})).toEqual({});
    expect(buildBadges({ newApplications: 0, draftJobs: 0 })).toEqual({});
  });

  it("mapt freelancer-alerts naar /certificaten met attention-toon", () => {
    expect(buildBadges({ credentialAlerts: 2 })).toEqual({
      "/certificaten": { count: 2, tone: "attention" },
    });
  });

  it("geeft client nieuwe reacties (attention) en concepten (info) op aparte hrefs", () => {
    expect(buildBadges({ newApplications: 3, draftJobs: 1 })).toEqual({
      "/kandidaten": { count: 3, tone: "attention" },
      "/opdrachten": { count: 1, tone: "info" },
    });
  });

  it("mapt admin-wachtrij naar /admin/verificaties met attention-toon", () => {
    expect(buildBadges({ pendingVerifications: 5 })).toEqual({
      "/admin/verificaties": { count: 5, tone: "attention" },
    });
  });

  it("mapt ongelezen berichten naar /berichten met info-toon", () => {
    expect(buildBadges({ unreadMessages: 2 })).toEqual({
      "/berichten": { count: 2, tone: "info" },
    });
  });

  it("mapt verlopen facturen naar /financien (Administratie-hub) met attention-toon", () => {
    expect(buildBadges({ overdueInvoices: 1 })).toEqual({
      "/financien": { count: 1, tone: "attention" },
    });
  });

  it("mapt cascade-werkproces-acties naar /samenwerkingen met attention-toon", () => {
    expect(buildBadges({ cascadeWork: 3 })).toEqual({
      "/samenwerkingen": { count: 3, tone: "attention" },
    });
  });

  it("mapt open disputen naar /admin/disputen met attention-toon", () => {
    expect(buildBadges({ openDisputes: 2 })).toEqual({
      "/admin/disputen": { count: 2, tone: "attention" },
    });
  });

  it("combineert cascade-acties en verlopen facturen op aparte hrefs", () => {
    const badges = buildBadges({ cascadeWork: 2, overdueInvoices: 1 });
    expect(badges["/samenwerkingen"]).toEqual({ count: 2, tone: "attention" });
    expect(badges["/financien"]).toEqual({ count: 1, tone: "attention" });
  });

  it("mapt bewaarde opdrachten naar /opgeslagen met info-toon (rustige telling)", () => {
    expect(buildBadges({ savedJobs: 4 })).toEqual({
      "/opgeslagen": { count: 4, tone: "info" },
    });
    expect(buildBadges({ savedJobs: 0 })).toEqual({});
  });

  it("mapt openstaande prestaties naar /prestaties met attention-toon", () => {
    expect(buildBadges({ pendingPerformances: 4 })).toEqual({
      "/prestaties": { count: 4, tone: "attention" },
    });
  });

  it("toont prestaties-badge naast cascade-badge als beide niet-nul zijn", () => {
    const badges = buildBadges({ pendingPerformances: 2, cascadeWork: 3 });
    expect(badges["/prestaties"]).toEqual({ count: 2, tone: "attention" });
    expect(badges["/samenwerkingen"]).toEqual({ count: 3, tone: "attention" });
  });

  it("mapt verstreken leads (franchiser) naar /franchise/leads met attention-toon", () => {
    expect(buildBadges({ overdueLeads: 3 })).toEqual({
      "/franchise/leads": { count: 3, tone: "attention" },
    });
    expect(buildBadges({ overdueLeads: 0 })).toEqual({});
  });

  it("mapt open shift-overnames (franchiser) naar /franchise/shift-overnames met attention-toon", () => {
    expect(buildBadges({ openHandoffs: 2 })).toEqual({
      "/franchise/shift-overnames": { count: 2, tone: "attention" },
    });
  });

  it("mapt openstaande supporttickets (admin) naar /admin/support met attention-toon", () => {
    expect(buildBadges({ openSupportTickets: 10 })).toEqual({
      "/admin/support": { count: 10, tone: "attention" },
    });
    // Alleen tonen bij > 0 (geen lege badge).
    expect(buildBadges({ openSupportTickets: 0 })).toEqual({});
  });

  it("mapt te-beoordelen no-shows (admin) naar /admin/no-shows met attention-toon", () => {
    expect(buildBadges({ openNoShows: 2 })).toEqual({
      "/admin/no-shows": { count: 2, tone: "attention" },
    });
  });

  it("mapt open dienst-overnames (admin) naar /admin/shift-overnames met attention-toon", () => {
    expect(buildBadges({ openAdminHandoffs: 3 })).toEqual({
      "/admin/shift-overnames": { count: 3, tone: "attention" },
    });
  });

  it("toont de admin-wachtrij-badges los van elkaar op hun eigen hrefs", () => {
    const badges = buildBadges({
      pendingVerifications: 5,
      openSupportTickets: 10,
      openNoShows: 1,
      openAdminHandoffs: 2,
    });
    expect(badges["/admin/verificaties"]).toEqual({ count: 5, tone: "attention" });
    expect(badges["/admin/support"]).toEqual({ count: 10, tone: "attention" });
    expect(badges["/admin/no-shows"]).toEqual({ count: 1, tone: "attention" });
    expect(badges["/admin/shift-overnames"]).toEqual({ count: 2, tone: "attention" });
  });

  it("toont beide franchiser-signalen op aparte hrefs als ze niet-nul zijn", () => {
    const badges = buildBadges({ overdueLeads: 1, openHandoffs: 4 });
    expect(badges["/franchise/leads"]).toEqual({ count: 1, tone: "attention" });
    expect(badges["/franchise/shift-overnames"]).toEqual({ count: 4, tone: "attention" });
  });

  it("mapt aflopende plaatsingen (franchiser) naar /franchise/samenwerkingen met attention-toon", () => {
    // Badge↔/acties-pariteit: het navitem /franchise/samenwerkingen krijgt nu de vervolg-badge die
    // /acties (`franchiseCollaborationRenewalTask`) al toont — geen "signaal op één oppervlak" meer.
    expect(buildBadges({ franchiseRenewals: 2 })).toEqual({
      "/franchise/samenwerkingen": { count: 2, tone: "attention" },
    });
    // Geen aflopende plaatsing → geen badge (spiegelt "geen taak op /acties").
    expect(buildBadges({ franchiseRenewals: 0 })).toEqual({});
  });

  it("mapt stilgevallen opdrachtgevers (franchiser) naar /franchise/opdrachtgevers met attention-toon", () => {
    // Badge↔/acties-pariteit: /franchise/opdrachtgevers krijgt nu de re-engagement-badge die /acties
    // (`franchiseClientReengagementTask`) toont — het laatste bemiddeling-navitem zonder badge.
    expect(buildBadges({ attentionClients: 3 })).toEqual({
      "/franchise/opdrachtgevers": { count: 3, tone: "attention" },
    });
    // Geen stilgevallen klant → geen badge (spiegelt "geen taak op /acties").
    expect(buildBadges({ attentionClients: 0 })).toEqual({});
  });

  it("toont de vervolg-badge los van de andere franchiser-signalen op hun eigen hrefs", () => {
    const badges = buildBadges({
      overdueLeads: 1,
      openHandoffs: 4,
      rosterAlerts: 3,
      openDienstAlerts: 2,
      franchiseRenewals: 5,
      attentionClients: 6,
    });
    expect(badges["/franchise/leads"]).toEqual({ count: 1, tone: "attention" });
    expect(badges["/franchise/shift-overnames"]).toEqual({ count: 4, tone: "attention" });
    expect(badges["/franchise/zzpers"]).toEqual({ count: 3, tone: "attention" });
    expect(badges["/franchise/diensten"]).toEqual({ count: 2, tone: "attention" });
    expect(badges["/franchise/samenwerkingen"]).toEqual({ count: 5, tone: "attention" });
    expect(badges["/franchise/opdrachtgevers"]).toEqual({ count: 6, tone: "attention" });
  });
});

describe("countClientCascadeWork", () => {
  it("telt een PROPOSED samenwerking (contract ondertekenen) mee — mag niet uit de badge vallen", () => {
    // Regressie: de CLIENT-badge (cascadeWork) telde alléén SUBMITTED-prestaties + SUBMITTED-facturen
    // en negeerde de contract-onderteken-taak, terwijl /acties (contractSignTask) én de cascade-fase
    // (stage.ts youAreUp) 'm wél tonen — de sidebar sprak de andere twee surfaces tegen.
    expect(
      countClientCascadeWork({
        proposedCollaborations: 1,
        submittedPerformances: 0,
        submittedInvoices: 0,
        complianceActions: 0,
        overduePaymentNudges: 0,
        dueSoonPaymentNudges: 0,
      }),
    ).toBe(1);
  });

  it("sommeert contract-onderteken, prestatie-goedkeuren, factuur-goedkeuren en compliance-acties", () => {
    expect(
      countClientCascadeWork({
        proposedCollaborations: 2,
        submittedPerformances: 3,
        submittedInvoices: 1,
        complianceActions: 2,
        overduePaymentNudges: 0,
        dueSoonPaymentNudges: 0,
      }),
    ).toBe(8);
  });

  it("telt een compliance-ripple-actie mee — mag niet uit de badge vallen", () => {
    // Regressie: de CLIENT-badge negeerde de compliance-taak (clientComplianceTask, href
    // /samenwerkingen/{id}), terwijl /acties + de dashboard-rail 'm wél tonen.
    expect(
      countClientCascadeWork({
        proposedCollaborations: 0,
        submittedPerformances: 0,
        submittedInvoices: 0,
        complianceActions: 1,
        overduePaymentNudges: 0,
        dueSoonPaymentNudges: 0,
      }),
    ).toBe(1);
  });

  it("is 0 wanneer de opdrachtgever nergens aan zet is", () => {
    expect(
      countClientCascadeWork({
        proposedCollaborations: 0,
        submittedPerformances: 0,
        submittedInvoices: 0,
        complianceActions: 0,
        overduePaymentNudges: 0,
        dueSoonPaymentNudges: 0,
      }),
    ).toBe(0);
  });

  it("telt een cascade-factuur over de vervaldatum (betaal-nudge) mee — mag niet uit de badge vallen", () => {
    // Regressie/nieuw: de opdrachtgever ziet op /acties + de dashboard-rail de
    // clientCascadeOverduePaymentTask (cascade-factuur OVERDUE, betaal 'm / laat bevestigen), dus moet
    // de /samenwerkingen-badge die actie ook tellen — anders is de badge stiller dan /acties.
    expect(
      countClientCascadeWork({
        proposedCollaborations: 0,
        submittedPerformances: 0,
        submittedInvoices: 0,
        complianceActions: 0,
        overduePaymentNudges: 2,
        dueSoonPaymentNudges: 0,
      }),
    ).toBe(2);
  });

  it("telt een binnenkort-vervallende cascade-factuur (pre-due betaal-nudge) mee — badge-pariteit met /acties", () => {
    // Nieuw: de opdrachtgever ziet op /acties + de dashboard-rail de pre-due
    // clientCascadePaymentDueSoonTask (goedgekeurde cascade-factuur die binnenkort vervalt), dus moet
    // de /samenwerkingen-badge die actie ook tellen. Disjunct van de OVERDUE-telling (andere
    // lifecycleStatus + dueAt>=now), dus geen dubbeltelling wanneer beide voorkomen.
    expect(
      countClientCascadeWork({
        proposedCollaborations: 0,
        submittedPerformances: 0,
        submittedInvoices: 0,
        complianceActions: 0,
        overduePaymentNudges: 1,
        dueSoonPaymentNudges: 3,
      }),
    ).toBe(4);
  });
});

describe("startOfUtcDay", () => {
  it("kapt naar middernacht UTC van dezelfde kalenderdag", () => {
    expect(startOfUtcDay(new Date("2026-06-23T14:37:11Z")).toISOString()).toBe(
      "2026-06-23T00:00:00.000Z",
    );
  });

  it("een opvolgdatum op een eerdere dag valt vóór de grens (te laat)", () => {
    const boundary = startOfUtcDay(new Date("2026-06-23T08:00:00Z"));
    expect(new Date("2026-06-22T23:00:00Z").getTime()).toBeLessThan(boundary.getTime());
  });

  it("een opvolgdatum van vandaag valt niet vóór de grens (niet te laat)", () => {
    const boundary = startOfUtcDay(new Date("2026-06-23T08:00:00Z"));
    expect(new Date("2026-06-23T00:00:00Z").getTime()).toBeGreaterThanOrEqual(boundary.getTime());
  });
});

describe("withActionCenterBadge", () => {
  it("zet de exacte takentelling op /acties (zoals de pagina toont)", () => {
    const badges = withActionCenterBadge(
      { "/kandidaten": { count: 3, tone: "attention" }, "/berichten": { count: 5, tone: "info" } },
      6,
    );
    expect(badges["/acties"]).toEqual({ count: 6, tone: "attention" });
    // de per-nav-badges blijven onveranderd
    expect(badges["/berichten"]).toEqual({ count: 5, tone: "info" });
  });

  it("geen /acties-badge bij 0 openstaande taken", () => {
    const badges = withActionCenterBadge({ "/berichten": { count: 4, tone: "info" } }, 0);
    expect(badges["/acties"]).toBeUndefined();
  });

  it("lege badges + 0 taken → geen /acties", () => {
    expect(withActionCenterBadge({}, 0)["/acties"]).toBeUndefined();
  });
});

describe("countUnreadConversations", () => {
  const t = (iso: string) => new Date(iso);

  it("telt een gesprek als er een vreemd bericht ná lastReadAt is", () => {
    const participants = [{ conversationId: "a", lastReadAt: t("2026-05-01T10:00:00Z") }];
    const latest = new Map([["a", t("2026-05-01T12:00:00Z")]]);
    expect(countUnreadConversations(participants, latest)).toBe(1);
  });

  it("telt niet als het laatste vreemde bericht al gelezen is", () => {
    const participants = [{ conversationId: "a", lastReadAt: t("2026-05-01T12:00:00Z") }];
    const latest = new Map([["a", t("2026-05-01T10:00:00Z")]]);
    expect(countUnreadConversations(participants, latest)).toBe(0);
  });

  it("telt een nooit-gelezen gesprek met een vreemd bericht", () => {
    const participants = [{ conversationId: "a", lastReadAt: null }];
    const latest = new Map([["a", t("2026-05-01T10:00:00Z")]]);
    expect(countUnreadConversations(participants, latest)).toBe(1);
  });

  it("negeert gesprekken zonder bericht van de andere partij", () => {
    const participants = [
      { conversationId: "a", lastReadAt: null },
      { conversationId: "b", lastReadAt: null },
    ];
    const latest = new Map<string, Date | null>([["a", null]]);
    expect(countUnreadConversations(participants, latest)).toBe(0);
  });
});
