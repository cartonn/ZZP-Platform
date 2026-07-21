import { describe, expect, it } from "vitest";
import {
  applicationSchema,
  companyProfileSchema,
  credentialSchema,
  freelancerProfileSchema,
  invoiceLineSchema,
  jobSchema,
  noShowReportSchema,
  registerSchema,
  validatePerformanceForm,
  type PerformanceFormData,
} from "@/lib/validation";

describe("invoiceLineSchema", () => {
  it("accepteert een normale regel", () => {
    const r = invoiceLineSchema.safeParse({ description: "Advies", quantity: 8, unitCents: 9500 });
    expect(r.success).toBe(true);
  });

  it("accepteert een groot bedrag net onder het int4-plafond", () => {
    // 100 × € 214.748,36 = € 21.474.836 (2.147.483.600 cent) < int4-max.
    const r = invoiceLineSchema.safeParse({
      description: "Groot project",
      quantity: 100,
      unitCents: 21_474_836,
    });
    expect(r.success).toBe(true);
  });

  it("weigert een regelbedrag boven het int4-plafond (velden elk binnen hun eigen grens)", () => {
    const r = invoiceLineSchema.safeParse({
      description: "Absurd",
      quantity: 100000,
      unitCents: 100_000_000,
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes("unitCents"))).toBe(true);
    }
  });

  it("weigert een lege omschrijving en aantal < 1", () => {
    expect(
      invoiceLineSchema.safeParse({ description: "", quantity: 1, unitCents: 100 }).success,
    ).toBe(false);
    expect(
      invoiceLineSchema.safeParse({ description: "X", quantity: 0, unitCents: 100 }).success,
    ).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepteert een geldige freelancer-registratie", () => {
    const r = registerSchema.safeParse({
      name: "Sanne",
      email: "Sanne@Example.NL",
      password: "geheim123",
      role: "FREELANCER",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("sanne@example.nl"); // genormaliseerd
  });

  it("eist een bedrijfsnaam voor CLIENT", () => {
    const r = registerSchema.safeParse({
      name: "Mark",
      email: "mark@example.nl",
      password: "geheim123",
      role: "CLIENT",
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.path).toContain("companyName");
  });

  it("weigert te kort wachtwoord en ongeldige rol", () => {
    expect(
      registerSchema.safeParse({ name: "X", email: "a@b.nl", password: "kort", role: "FREELANCER" })
        .success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        name: "Naam",
        email: "a@b.nl",
        password: "geheim123",
        role: "ADMIN",
      }).success,
    ).toBe(false);
  });
});

describe("freelancerProfileSchema", () => {
  it("coerceert tarief en defaultt arrays", () => {
    const r = freelancerProfileSchema.safeParse({
      availability: "AVAILABLE",
      workMode: "HYBRID",
      visibility: "PUBLIC",
      hourlyRate: "75",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.hourlyRate).toBe(75);
      expect(r.data.skillIds).toEqual([]);
      expect(r.data.languages).toEqual([]);
    }
  });

  it("behandelt leeg tarief als undefined", () => {
    const r = freelancerProfileSchema.safeParse({
      availability: "UNKNOWN",
      workMode: "REMOTE",
      visibility: "PRIVATE",
      hourlyRate: "",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.hourlyRate).toBeUndefined();
  });

  it("weigert ongeldige enum-waarden", () => {
    expect(
      freelancerProfileSchema.safeParse({
        availability: "ONBEKEND",
        workMode: "HYBRID",
        visibility: "PUBLIC",
      }).success,
    ).toBe(false);
  });
});

describe("companyProfileSchema", () => {
  it("accepteert geldig bedrijf en behandelt lege website/branche als undefined", () => {
    const r = companyProfileSchema.safeParse({ name: "Acme BV", website: "", industryId: "" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.website).toBeUndefined();
      expect(r.data.industryId).toBeUndefined();
    }
  });

  it("weigert ongeldige website-URL en te korte naam", () => {
    expect(companyProfileSchema.safeParse({ name: "Acme", website: "geen-url" }).success).toBe(
      false,
    );
    expect(companyProfileSchema.safeParse({ name: "A" }).success).toBe(false);
  });

  it("weigert een niet-http(s)-schema in de website (stored-XSS-vector, OWASP A03)", () => {
    // `z.string().url()` keurde deze schema's ten onrechte goed; als raw href gerenderd is dat
    // stored XSS. De schema-restrictie is de server-side bron van waarheid (regel 2), los van CSP.
    for (const website of [
      "javascript:alert(document.cookie)",
      "JavaScript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:msgbox(1)",
      "  javascript:alert(1)  ",
    ]) {
      expect(companyProfileSchema.safeParse({ name: "Acme BV", website }).success).toBe(false);
    }
  });

  it("accepteert een geldige http(s)-website", () => {
    for (const website of ["https://acme.nl", "http://acme.nl/pad?q=1"]) {
      const r = companyProfileSchema.safeParse({ name: "Acme BV", website });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.website).toBe(website.trim());
    }
  });
});

describe("jobSchema", () => {
  const base = {
    title: "Frontend Developer",
    description: "Bouw onze nieuwe app.",
    workMode: "HYBRID",
  };

  it("accepteert een geldige opdracht en defaultt arrays", () => {
    const r = jobSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.requiredSkillIds).toEqual([]);
      expect(r.data.requiredCredentialTypes).toEqual([]);
    }
  });

  it("weigert te korte titel/omschrijving", () => {
    expect(jobSchema.safeParse({ ...base, title: "X" }).success).toBe(false);
    expect(jobSchema.safeParse({ ...base, description: "kort" }).success).toBe(false);
  });

  it("weigert rateMin > rateMax", () => {
    const r = jobSchema.safeParse({ ...base, rateMin: "90", rateMax: "50" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.path).toContain("rateMax");
  });

  it("coerceert startDate en lege rate naar undefined", () => {
    const r = jobSchema.safeParse({ ...base, rateMin: "", startDate: "2026-09-01" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.rateMin).toBeUndefined();
      expect(r.data.startDate).toBeInstanceOf(Date);
    }
  });
});

describe("applicationSchema", () => {
  it("accepteert een geldige reactie", () => {
    const r = applicationSchema.safeParse({
      motivation: "Ik pas hier goed bij omdat...",
      proposedRate: "80",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.proposedRate).toBe(80);
  });

  it("weigert een te korte motivatie", () => {
    expect(applicationSchema.safeParse({ motivation: "kort" }).success).toBe(false);
  });
});

describe("noShowReportSchema", () => {
  it("accepteert een no-show in het verleden", () => {
    const r = noShowReportSchema.safeParse({
      reason: "Niet komen opdagen zonder bericht.",
      occurredOn: "2020-01-01",
    });
    expect(r.success).toBe(true);
  });

  it("accepteert een no-show van vandaag", () => {
    const today = new Date().toISOString().slice(0, 10);
    const r = noShowReportSchema.safeParse({
      reason: "Niet komen opdagen zonder bericht.",
      occurredOn: today,
    });
    expect(r.success).toBe(true);
  });

  it("weigert een no-show in de toekomst", () => {
    const r = noShowReportSchema.safeParse({
      reason: "Niet komen opdagen zonder bericht.",
      occurredOn: "3000-01-01",
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.message).toContain("toekomst");
  });

  it("weigert een te korte reden", () => {
    const r = noShowReportSchema.safeParse({ reason: "x", occurredOn: "2020-01-01" });
    expect(r.success).toBe(false);
  });
});

describe("credentialSchema", () => {
  const base = { type: "VOG", title: "Verklaring Omtrent Gedrag", visibility: "PRIVATE" };

  it("accepteert geldige metadata en coerceert datums", () => {
    const r = credentialSchema.safeParse({
      ...base,
      issuedAt: "2025-01-01",
      expiresAt: "2026-01-01",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.issuedAt).toBeInstanceOf(Date);
      expect(r.data.expiresAt).toBeInstanceOf(Date);
    }
  });

  it("weigert vervaldatum vóór uitgiftedatum", () => {
    const r = credentialSchema.safeParse({
      ...base,
      issuedAt: "2026-01-01",
      expiresAt: "2025-01-01",
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.path).toContain("expiresAt");
  });

  it("weigert onbekend type en te korte titel", () => {
    expect(credentialSchema.safeParse({ ...base, type: "ONZIN" }).success).toBe(false);
    expect(credentialSchema.safeParse({ ...base, title: "X" }).success).toBe(false);
  });
});

describe("validatePerformanceForm", () => {
  const hoursBase: PerformanceFormData = {
    type: "HOURS",
    hours: 8,
    ortTotal: 0,
    hasOrt: false,
    amount: 0,
    milestoneTitle: "",
    periodStartRaw: "",
    periodEndRaw: "",
    rateCents: 8500,
  };

  const milestoneBase: PerformanceFormData = {
    type: "MILESTONE",
    hours: 0,
    ortTotal: 0,
    hasOrt: false,
    amount: 2500,
    milestoneTitle: "Mijlpaal 1",
    periodStartRaw: "",
    periodEndRaw: "",
    rateCents: null,
  };

  it("HOURS: hours=0 geeft een fout", () => {
    const result = validatePerformanceForm({ ...hoursBase, hours: 0 });
    expect(result).not.toBeNull();
    expect(result).toContain("uren");
  });

  it("HOURS: rateCents=null geeft een fout over ontbrekend uurtarief", () => {
    const result = validatePerformanceForm({ ...hoursBase, rateCents: null });
    expect(result).not.toBeNull();
    expect(result).toContain("uurtarief");
  });

  it("HOURS: geldige uren + rateCents geeft null", () => {
    expect(validatePerformanceForm(hoursBase)).toBeNull();
  });

  it("HOURS: absurd veel uren (> max) geeft een fout — voorkomt int-overflow op de factuur", () => {
    const result = validatePerformanceForm({ ...hoursBase, hours: 999999 });
    expect(result).not.toBeNull();
    expect(result).toContain("onrealistisch hoog");
  });

  it("HOURS: precies op de bovengrens (1000 uur) is toegestaan", () => {
    expect(validatePerformanceForm({ ...hoursBase, hours: 1000 })).toBeNull();
  });

  it("HOURS ORT: absurd ortTotal (> max) geeft een fout", () => {
    const result = validatePerformanceForm({
      ...hoursBase,
      hasOrt: true,
      ortTotal: 999999,
      hours: 999999,
    });
    expect(result).not.toBeNull();
    expect(result).toContain("onrealistisch hoog");
  });

  it("HOURS: ORT met ortTotal=0 geeft een fout", () => {
    const result = validatePerformanceForm({ ...hoursBase, hasOrt: true, ortTotal: 0 });
    expect(result).not.toBeNull();
    expect(result).toContain("ORT");
  });

  it("HOURS: ORT met ortTotal>0 geeft null", () => {
    expect(
      validatePerformanceForm({ ...hoursBase, hasOrt: true, ortTotal: 4, hours: 4 }),
    ).toBeNull();
  });

  it("HOURS: periodStart > periodEnd geeft een fout", () => {
    const result = validatePerformanceForm({
      ...hoursBase,
      periodStartRaw: "2026-05-31",
      periodEndRaw: "2026-05-01",
    });
    expect(result).not.toBeNull();
    expect(result).toContain("begindatum");
  });

  it("HOURS: periodStart <= periodEnd geeft null", () => {
    expect(
      validatePerformanceForm({
        ...hoursBase,
        periodStartRaw: "2026-05-01",
        periodEndRaw: "2026-05-31",
      }),
    ).toBeNull();
  });

  it("HOURS: ongeldige periodStart (geknutselde POST) geeft een fout, niet null", () => {
    const result = validatePerformanceForm({
      ...hoursBase,
      periodStartRaw: "not-a-date",
      periodEndRaw: "2026-05-31",
    });
    expect(result).not.toBeNull();
    expect(result).toContain("geldige periode");
  });

  it("HOURS: ongeldige periodEnd alléén (periodStart leeg) geeft een fout", () => {
    // Regressie: de oude cross-veld-check draaide alleen als BEIDE ruwe waarden aanwezig waren,
    // dus één losse ongeldige datum viel door naar Prisma (Invalid Date → generieke catch-all).
    const result = validatePerformanceForm({
      ...hoursBase,
      periodStartRaw: "",
      periodEndRaw: "junk",
    });
    expect(result).not.toBeNull();
    expect(result).toContain("geldige periode");
  });

  it("MILESTONE: amount=0 geeft een fout", () => {
    const result = validatePerformanceForm({ ...milestoneBase, amount: 0 });
    expect(result).not.toBeNull();
    expect(result).toContain("bedrag");
  });

  it("MILESTONE: lege titel geeft een fout", () => {
    const result = validatePerformanceForm({ ...milestoneBase, milestoneTitle: "" });
    expect(result).not.toBeNull();
    expect(result).toContain("titel");
  });

  it("MILESTONE: geldig bedrag en titel geeft null", () => {
    expect(validatePerformanceForm(milestoneBase)).toBeNull();
  });

  it("MILESTONE: absurd bedrag (> €1 mln) geeft een fout", () => {
    const result = validatePerformanceForm({ ...milestoneBase, amount: 2_000_000 });
    expect(result).not.toBeNull();
    expect(result).toContain("onrealistisch hoog");
  });

  it("HOURS ORT: geldige ORT + periodedata geeft null", () => {
    expect(
      validatePerformanceForm({
        ...hoursBase,
        hasOrt: true,
        ortTotal: 8,
        hours: 8,
        periodStartRaw: "2026-05-01",
        periodEndRaw: "2026-05-31",
      }),
    ).toBeNull();
  });

  it("HOURS ORT: periodStart > periodEnd geeft een fout (ook bij ORT)", () => {
    const result = validatePerformanceForm({
      ...hoursBase,
      hasOrt: true,
      ortTotal: 8,
      hours: 8,
      periodStartRaw: "2026-05-31",
      periodEndRaw: "2026-05-01",
    });
    expect(result).not.toBeNull();
    expect(result).toContain("begindatum");
  });

  it("HOURS: alleen periodStart zonder periodEnd: geen fout (gedeeltelijke invoer toegestaan)", () => {
    expect(
      validatePerformanceForm({ ...hoursBase, periodStartRaw: "2026-05-01", periodEndRaw: "" }),
    ).toBeNull();
  });

  // NaN/Infinity glippen anders door `<= 0` én `> MAX` (beide vergelijkingen zijn false voor NaN):
  // een geknutselde POST met `hours=abc` levert `Number("abc") = NaN`, dat als Float persisteert en
  // bij factuurafleiding (uren × tarief → Int `totalCents`) een NaN oplevert → Prisma-conversiefout
  // → 500 i.p.v. een nette weigering. Server-side waarheid (CLAUDE.md regel 1); DOEL 2 robuustheid.
  it("HOURS: hours=NaN wordt geweigerd (niet-eindig getal glipt niet door de grenzen)", () => {
    const result = validatePerformanceForm({ ...hoursBase, hours: NaN });
    expect(result).not.toBeNull();
    expect(result).toContain("uren");
  });

  it("HOURS: hours=Infinity wordt geweigerd", () => {
    const result = validatePerformanceForm({ ...hoursBase, hours: Infinity });
    expect(result).not.toBeNull();
  });

  it("HOURS ORT: ortTotal=NaN wordt geweigerd", () => {
    const result = validatePerformanceForm({ ...hoursBase, hasOrt: true, ortTotal: NaN });
    expect(result).not.toBeNull();
  });

  it("MILESTONE: amount=NaN wordt geweigerd", () => {
    const result = validatePerformanceForm({ ...milestoneBase, amount: NaN });
    expect(result).not.toBeNull();
    expect(result).toContain("bedrag");
  });
});
