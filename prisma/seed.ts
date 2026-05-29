import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "demo1234";
const DAY = 86_400_000;
const daysFromNow = (n: number) => new Date(Date.now() + n * DAY);

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // --- Referentiedata: plannen ---
  const plans = [
    { key: "FREE", name: "Gratis", maxApplications: 5, maxJobs: 1, priceCents: 0 },
    { key: "PRO", name: "Pro", maxApplications: 50, maxJobs: 10, priceCents: 2900 },
    { key: "BUSINESS", name: "Business", maxApplications: -1, maxJobs: -1, priceCents: 9900 },
  ];
  for (const plan of plans) {
    await prisma.plan.upsert({ where: { key: plan.key }, update: plan, create: plan });
  }

  // --- Referentiedata: branches & skills ---
  const industries = [
    { name: "ICT", slug: "ict" },
    { name: "Bouw", slug: "bouw" },
    { name: "Zorg", slug: "zorg" },
    { name: "Logistiek", slug: "logistiek" },
  ];
  for (const ind of industries) {
    await prisma.industry.upsert({ where: { slug: ind.slug }, update: { name: ind.name }, create: ind });
  }
  const skills: [string, string][] = [
    ["React", "react"], ["TypeScript", "typescript"], ["Node.js", "nodejs"], ["Python", "python"],
    ["AWS", "aws"], ["Scrum", "scrum"], ["Projectmanagement", "projectmanagement"],
    ["Elektrotechniek", "elektrotechniek"], ["VCA", "vca"], ["Verpleegkunde", "verpleegkunde"],
  ];
  for (const [name, slug] of skills) {
    await prisma.skill.upsert({ where: { slug }, update: { name }, create: { name, slug } });
  }
  const skillRows = await prisma.skill.findMany();
  const skillId = Object.fromEntries(skillRows.map((s) => [s.slug, s.id])) as Record<string, string>;
  const industryRows = await prisma.industry.findMany();
  const industryId = Object.fromEntries(industryRows.map((i) => [i.slug, i.id])) as Record<string, string>;

  // --- ADMIN ---
  await prisma.user.upsert({
    where: { email: "admin@zzp-platform.local" },
    update: {},
    create: { email: "admin@zzp-platform.local", name: "Admin Beheerder", role: "ADMIN", status: "ACTIVE", emailVerified: new Date(), passwordHash },
  });

  // --- ZZP'ers (data-gedreven) ---
  type Cred = { type: string; title: string; issuer: string; status: "VERIFIED" | "SUBMITTED" | "EXPIRED" | "REJECTED"; expiresInDays?: number; reason?: string };
  type Freelancer = {
    key: string; email: string; name: string; headline: string; bio: string; rate: number;
    availability: "AVAILABLE" | "LIMITED" | "UNAVAILABLE"; location: string; workMode: "REMOTE" | "ONSITE" | "HYBRID";
    industry: string; skills: string[]; identityVerified: boolean; completeness: number; creds: Cred[];
  };
  const freelancers: Freelancer[] = [
    { key: "sanne", email: "zzp@zzp-platform.local", name: "Sanne de Vries", headline: "Senior Frontend Developer", bio: "Tien jaar ervaring met React en TypeScript; bouwt toegankelijke, geteste interfaces.", rate: 85, availability: "AVAILABLE", location: "Amsterdam", workMode: "HYBRID", industry: "ict", skills: ["react", "typescript"], identityVerified: true, completeness: 100, creds: [{ type: "VOG", title: "VOG Verklaring Omtrent Gedrag", issuer: "Justis", status: "VERIFIED", expiresInDays: 300 }, { type: "DIPLOMA", title: "HBO Informatica", issuer: "Hogeschool van Amsterdam", status: "SUBMITTED" }] },
    { key: "youssef", email: "youssef@zzp-platform.local", name: "Youssef Bakker", headline: "Backend Developer (Node.js)", bio: "Bouwt schaalbare API's en integraties. Per direct beschikbaar.", rate: 78, availability: "AVAILABLE", location: "Utrecht", workMode: "REMOTE", industry: "ict", skills: ["nodejs", "typescript", "aws"], identityVerified: true, completeness: 100, creds: [{ type: "VOG", title: "VOG Verklaring Omtrent Gedrag", issuer: "Justis", status: "VERIFIED", expiresInDays: 280 }, { type: "DIPLOMA", title: "WO Informatica", issuer: "Universiteit Utrecht", status: "VERIFIED" }] },
    { key: "lisa", email: "lisa@zzp-platform.local", name: "Lisa Smit", headline: "Projectmanager ICT", bio: "Leidt multidisciplinaire teams; PMP-gecertificeerd.", rate: 95, availability: "LIMITED", location: "Rotterdam", workMode: "HYBRID", industry: "ict", skills: ["projectmanagement", "scrum"], identityVerified: false, completeness: 90, creds: [{ type: "CERTIFICATE", title: "PMP — Project Management Professional", issuer: "PMI", status: "VERIFIED", expiresInDays: 600 }, { type: "VOG", title: "VOG Verklaring Omtrent Gedrag", issuer: "Justis", status: "VERIFIED", expiresInDays: 200 }] },
    { key: "daan", email: "daan@zzp-platform.local", name: "Daan Visser", headline: "Elektromonteur", bio: "Allround monteur, VCA-VOL, werkt veilig en snel.", rate: 55, availability: "AVAILABLE", location: "Eindhoven", workMode: "ONSITE", industry: "bouw", skills: ["elektrotechniek", "vca"], identityVerified: true, completeness: 100, creds: [{ type: "CERTIFICATE", title: "VCA VOL", issuer: "VCA Infra", status: "VERIFIED", expiresInDays: 700 }, { type: "VOG", title: "VOG Verklaring Omtrent Gedrag", issuer: "Justis", status: "VERIFIED", expiresInDays: 25 }] },
    { key: "fatima", email: "fatima@zzp-platform.local", name: "Fatima El Amrani", headline: "Verpleegkundige (BIG)", bio: "Gediplomeerd verpleegkundige, BIG-geregistreerd. Flexibel inzetbaar.", rate: 52, availability: "AVAILABLE", location: "Den Haag", workMode: "ONSITE", industry: "zorg", skills: ["verpleegkunde"], identityVerified: true, completeness: 100, creds: [{ type: "LICENSE", title: "BIG-registratie Verpleegkundige", issuer: "CIBG", status: "VERIFIED", expiresInDays: 900 }, { type: "VOG", title: "VOG Verklaring Omtrent Gedrag", issuer: "Justis", status: "VERIFIED", expiresInDays: 320 }, { type: "DIPLOMA", title: "HBO-V Verpleegkunde", issuer: "Haagse Hogeschool", status: "VERIFIED" }] },
    { key: "peter", email: "peter@zzp-platform.local", name: "Peter Jansen", headline: "Logistiek planner", bio: "Plant en optimaliseert transport- en magazijnstromen.", rate: 60, availability: "UNAVAILABLE", location: "Tilburg", workMode: "HYBRID", industry: "logistiek", skills: ["projectmanagement"], identityVerified: false, completeness: 80, creds: [{ type: "VOG", title: "VOG Verklaring Omtrent Gedrag", issuer: "Justis", status: "SUBMITTED" }] },
    { key: "anna", email: "anna@zzp-platform.local", name: "Anna Mulder", headline: "Frontend Developer", bio: "React-specialist met oog voor design en performance.", rate: 72, availability: "AVAILABLE", location: "Amsterdam", workMode: "REMOTE", industry: "ict", skills: ["react", "typescript"], identityVerified: false, completeness: 95, creds: [{ type: "DIPLOMA", title: "HBO Communication & Multimedia Design", issuer: "Hogeschool Rotterdam", status: "SUBMITTED" }] },
  ];

  const pid: Record<string, string> = {};
  const uid: Record<string, string> = {};
  for (const f of freelancers) {
    const idFields = f.identityVerified ? { identityVerifiedAt: daysFromNow(-40), verifiedLegalName: f.name } : {};
    const user = await prisma.user.upsert({
      where: { email: f.email },
      update: idFields,
      create: {
        email: f.email, name: f.name, role: "FREELANCER", status: "ACTIVE", emailVerified: new Date(), passwordHash, ...idFields,
        freelancerProfile: {
          create: { headline: f.headline, bio: f.bio, hourlyRate: f.rate, availability: f.availability, location: f.location, workMode: f.workMode, languages: JSON.stringify(["nl", "en"]), visibility: "PUBLIC", completeness: f.completeness },
        },
      },
      include: { freelancerProfile: true },
    });
    const profileId = user.freelancerProfile!.id;
    pid[f.key] = profileId;
    uid[f.key] = user.id;
    for (const slug of f.skills) {
      await prisma.freelancerSkill.upsert({ where: { freelancerProfileId_skillId: { freelancerProfileId: profileId, skillId: skillId[slug]! } }, update: {}, create: { freelancerProfileId: profileId, skillId: skillId[slug]! } });
    }
    await prisma.freelancerIndustry.upsert({ where: { freelancerProfileId_industryId: { freelancerProfileId: profileId, industryId: industryId[f.industry]! } }, update: {}, create: { freelancerProfileId: profileId, industryId: industryId[f.industry]! } });
    for (const c of f.creds) {
      const id = `cred-${f.key}-${c.type}`;
      await prisma.credential.upsert({
        where: { id }, update: {},
        create: {
          id, freelancerProfileId: profileId, type: c.type, title: c.title, issuer: c.issuer, status: c.status, visibility: "PUBLIC",
          issuedAt: daysFromNow(-400), expiresAt: c.expiresInDays ? daysFromNow(c.expiresInDays) : null,
          verifiedAt: c.status === "VERIFIED" ? daysFromNow(-30) : null,
          rejectionReason: c.status === "REJECTED" ? (c.reason ?? "Onleesbaar document.") : null,
        },
      });
    }
  }

  // --- Opdrachtgever + bedrijf ---
  const client = await prisma.user.upsert({
    where: { email: "opdrachtgever@zzp-platform.local" },
    update: {},
    create: {
      email: "opdrachtgever@zzp-platform.local", name: "Mark Jansen", role: "CLIENT", status: "ACTIVE", emailVerified: new Date(), passwordHash,
      company: { create: { name: "Jansen Software B.V.", industryId: industryId.ict, description: "Productbureau voor web- en mobiele applicaties in zorg en overheid.", website: "https://jansensoftware.nl", location: "Utrecht" } },
    },
    include: { company: true },
  });
  const companyId = client.company!.id;

  // --- Opdrachten ---
  type Job = { id: string; title: string; description: string; status: string; workMode: string; rateMin: number; rateMax: number; location?: string; industry: string; req: string[]; opt?: string[]; reqCreds?: string[]; dbaRisk?: string };
  const jobs: Job[] = [
    { id: "job-1", title: "Senior React Developer", description: "Bouw mee aan ons zorgplatform. Focus op toegankelijkheid, kwaliteit en geteste code.", status: "PUBLISHED", workMode: "HYBRID", rateMin: 80, rateMax: 110, location: "Utrecht", industry: "ict", req: ["react", "typescript"], reqCreds: ["VOG"], dbaRisk: "LAAG" },
    { id: "job-2", title: "Node.js Backend Developer", description: "Ontwerp en bouw robuuste API's en integraties voor een langlopend project.", status: "PUBLISHED", workMode: "REMOTE", rateMin: 75, rateMax: 100, industry: "ict", req: ["nodejs"], opt: ["typescript", "aws"] },
    { id: "job-3", title: "Projectmanager ICT", description: "Leid een multidisciplinair team voor een overheidsopdracht.", status: "PUBLISHED", workMode: "ONSITE", rateMin: 90, rateMax: 120, location: "Den Haag", industry: "ict", req: ["projectmanagement"], dbaRisk: "MIDDEN" },
    { id: "job-4", title: "Verpleegkundige (detachering)", description: "Tijdelijke inzet op een somatische afdeling. BIG-registratie vereist.", status: "PUBLISHED", workMode: "ONSITE", rateMin: 45, rateMax: 65, location: "Den Haag", industry: "zorg", req: ["verpleegkunde"], reqCreds: ["LICENSE", "VOG"], dbaRisk: "MIDDEN" },
    { id: "job-5", title: "Elektromonteur", description: "Installatie- en onderhoudswerk op locatie. VCA vereist.", status: "PUBLISHED", workMode: "ONSITE", rateMin: 50, rateMax: 70, location: "Eindhoven", industry: "bouw", req: ["elektrotechniek"], reqCreds: ["VOG"] },
    { id: "job-6", title: "DevOps Engineer", description: "Beheer en automatiseer onze cloudinfrastructuur (AWS).", status: "PUBLISHED", workMode: "REMOTE", rateMin: 85, rateMax: 115, industry: "ict", req: ["aws"], opt: ["python", "nodejs"] },
    { id: "job-7", title: "Frontend Developer (concept)", description: "Concept-opdracht — nog niet gepubliceerd.", status: "DRAFT", workMode: "HYBRID", rateMin: 70, rateMax: 95, location: "Utrecht", industry: "ict", req: ["react"] },
  ];
  const now = new Date();
  for (const j of jobs) {
    const jobSkills = [...j.req.map((s) => ({ skillId: skillId[s]!, required: true })), ...(j.opt ?? []).map((s) => ({ skillId: skillId[s]!, required: false }))];
    await prisma.job.upsert({
      where: { id: j.id }, update: {},
      create: {
        id: j.id, companyId, industryId: industryId[j.industry]!, title: j.title, description: j.description, status: j.status,
        workMode: j.workMode, rateMin: j.rateMin, rateMax: j.rateMax, location: j.location ?? null,
        publishedAt: j.status === "PUBLISHED" ? now : null, dbaRisk: j.dbaRisk ?? null, dbaReasons: j.dbaRisk ? "[]" : null,
        skills: { create: jobSkills },
        credentialRequirements: { create: (j.reqCreds ?? []).map((c) => ({ credentialType: c, required: true })) },
      },
    });
  }

  // --- Reacties (alle statussen) ---
  const snap = (status: string, satisfied: string[] = [], missing: string[] = []) => JSON.stringify({ status, satisfied, inReview: [], expired: [], missing });
  type App = { id: string; job: string; fk: string; status: string; motivation: string; rate: number; score: number; compliance: string };
  const apps: App[] = [
    { id: "app-1", job: "job-1", fk: "sanne", status: "NEW", motivation: "Tien jaar React-ervaring; lever graag toegankelijke, geteste interfaces.", rate: 95, score: 92, compliance: snap("COMPLIANT", ["VOG"]) },
    { id: "app-2", job: "job-1", fk: "anna", status: "SHORTLIST", motivation: "React-specialist; help graag de frontend-architectuur opzetten.", rate: 80, score: 76, compliance: snap("NON_COMPLIANT", [], ["VOG"]) },
    { id: "app-3", job: "job-2", fk: "youssef", status: "ACCEPTED", motivation: "Ervaren met schaalbare Node.js-API's en AWS.", rate: 90, score: 90, compliance: snap("COMPLIANT") },
    { id: "app-4", job: "job-3", fk: "lisa", status: "NEW", motivation: "PMP-gecertificeerd; ruime ervaring met overheidsprojecten.", rate: 110, score: 88, compliance: snap("COMPLIANT") },
    { id: "app-5", job: "job-3", fk: "sanne", status: "ACCEPTED", motivation: "Sterk in stakeholdermanagement en oplevering.", rate: 105, score: 84, compliance: snap("COMPLIANT") },
    { id: "app-6", job: "job-4", fk: "fatima", status: "SHORTLIST", motivation: "BIG-geregistreerd, direct inzetbaar op somatiek.", rate: 58, score: 95, compliance: snap("COMPLIANT", ["LICENSE", "VOG"]) },
    { id: "app-7", job: "job-5", fk: "daan", status: "NEW", motivation: "VCA-VOL, allround monteur, per direct beschikbaar.", rate: 60, score: 91, compliance: snap("COMPLIANT", ["VOG"]) },
    { id: "app-8", job: "job-3", fk: "peter", status: "REJECTED", motivation: "Ervaren planner, wil graag de overstap naar ICT-projecten maken.", rate: 85, score: 58, compliance: snap("COMPLIANT") },
  ];
  for (const a of apps) {
    await prisma.application.upsert({
      where: { id: a.id }, update: {},
      create: { id: a.id, jobId: a.job, freelancerId: pid[a.fk]!, status: a.status, motivation: a.motivation, proposedRate: a.rate, availability: "In overleg", matchScore: a.score, complianceSnapshot: a.compliance },
    });
  }

  // --- Actieve samenwerkingen ---
  type Collab = { id: string; job: string; app: string; fk: string; rate: number; startDays: number };
  const collabs: Collab[] = [
    { id: "collab-1", job: "job-3", app: "app-5", fk: "sanne", rate: 105, startDays: -14 },
    { id: "collab-2", job: "job-2", app: "app-3", fk: "youssef", rate: 90, startDays: -30 },
  ];
  for (const c of collabs) {
    await prisma.collaboration.upsert({
      where: { id: c.id }, update: {},
      create: { id: c.id, jobId: c.job, applicationId: c.app, freelancerId: pid[c.fk]!, companyId, status: "ACTIVE", contractStatus: "SIGNED", rate: c.rate, startDate: daysFromNow(c.startDays) },
    });
  }

  // --- Facturen (echt-ogend: betaald / verzonden / verlopen) ---
  type Inv = { id: string; collab: string; number: string; status: string; dueDays: number; desc: string; qty: number; unit: number };
  const invoices: Inv[] = [
    { id: "inv-1", collab: "collab-1", number: "2026-0001", status: "PAID", dueDays: -10, desc: "Projectleiding sprint 1", qty: 16, unit: 10500 },
    { id: "inv-2", collab: "collab-1", number: "2026-0004", status: "SENT", dueDays: 14, desc: "Projectleiding sprint 2", qty: 20, unit: 10500 },
    { id: "inv-3", collab: "collab-2", number: "2026-0002", status: "OVERDUE", dueDays: -5, desc: "API-ontwikkeling", qty: 16, unit: 7500 },
    { id: "inv-4", collab: "collab-2", number: "2026-0003", status: "PAID", dueDays: -20, desc: "Integraties & tests", qty: 12, unit: 7500 },
  ];
  for (const inv of invoices) {
    const amount = inv.qty * inv.unit;
    await prisma.invoice.upsert({
      where: { id: inv.id }, update: {},
      create: { id: inv.id, collaborationId: inv.collab, number: inv.number, status: inv.status, issuedAt: daysFromNow(inv.dueDays - 14), dueAt: daysFromNow(inv.dueDays), totalCents: amount, lines: { create: [{ description: inv.desc, quantity: inv.qty, unitCents: inv.unit, amountCents: amount }] } },
    });
  }

  // --- Cascade-demo (event-driven werkproces, Fase 3) ---
  // Voorgestelde samenwerking zodat "Contract ondertekenen" demonstreerbaar is.
  await prisma.application.upsert({
    where: { id: "app-9" }, update: {},
    create: { id: "app-9", jobId: "job-1", freelancerId: pid.youssef!, status: "ACCEPTED", motivation: "Beschikbaar voor het zorgplatform; sterk in geteste, toegankelijke code.", proposedRate: 90, availability: "In overleg", matchScore: 88 },
  });
  await prisma.collaboration.upsert({
    where: { id: "collab-3" }, update: {},
    create: { id: "collab-3", jobId: "job-1", applicationId: "app-9", freelancerId: pid.youssef!, companyId, status: "PROPOSED", contractStatus: "DRAFT", rate: 90, startDate: daysFromNow(5) },
  });

  // Op de lopende samenwerking (collab-1: Sanne ↔ Jansen): een ingediende urenstaat (wacht op
  // goedkeuring door de opdrachtgever) en een goedgekeurde urenstaat met een concept-factuur
  // (wacht op indienen door de ZZP'er). Bedragen in centen; uurtarief €105 = 10500.
  await prisma.performance.upsert({
    where: { id: "perf-1" }, update: {},
    create: { id: "perf-1", collaborationId: "collab-1", type: "HOURS", status: "SUBMITTED", hours: 16, rateCents: 10500, description: "Sprint 3 — week 1 en 2", submittedAt: daysFromNow(-2), correlationId: "collab-1" },
  });
  await prisma.performance.upsert({
    where: { id: "perf-2" }, update: {},
    create: { id: "perf-2", collaborationId: "collab-1", type: "HOURS", status: "APPROVED", hours: 8, rateCents: 10500, description: "Sprint 2 — extra werkdag", submittedAt: daysFromNow(-6), approvedAt: daysFromNow(-5), correlationId: "collab-1" },
  });
  await prisma.invoice.upsert({
    where: { id: "inv-c1" }, update: {},
    create: {
      id: "inv-c1", collaborationId: "collab-1", number: "CONCEPT-perf-2", status: "DRAFT", totalCents: 101640,
      lifecycleStatus: "DRAFT", performanceId: "perf-2", issuerUserId: uid.sanne!, counterpartyUserId: client.id,
      issuerKey: uid.sanne!, subtotalCents: 84000, vatCents: 17640, vatRegime: "STANDARD_HIGH", correlationId: "collab-1",
    },
  });

  console.log("Seed klaar. Demo-accounts (wachtwoord: %s):", DEMO_PASSWORD);
  console.log("  admin@zzp-platform.local          (ADMIN)");
  console.log("  zzp@zzp-platform.local            (FREELANCER — Sanne)");
  console.log("  opdrachtgever@zzp-platform.local  (CLIENT — Jansen Software)");
  console.log("Demo-inhoud: 7 ZZP'ers met certificaten/diploma's, 6 gepubliceerde opdrachten + 1 concept,");
  console.log("8 reacties (alle statussen), 2 actieve samenwerkingen, 4 facturen (betaald/verzonden/verlopen).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
