import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  signContract,
  createPerformance,
  submitPerformance,
  approvePerformance,
  rejectPerformance,
  submitInvoice,
  approveInvoice,
  confirmPayment,
  CascadeError,
} from "@/lib/cascade/commands";
import { getStorage } from "@/lib/services/storage";
import { resolveBootstrapAdminConfig } from "@/lib/bootstrap-admin";
import { planExpensePostings } from "@/lib/expense";
import { documentKindForCredential } from "@/lib/documents";
import { type CredentialType } from "@/lib/enums";
import { credentialBewijsPdf } from "./seed-credential-pdf";
import { SEED_CONVERSATIONS, SEED_TICKETS } from "./seed-berichten-tickets-data";
import { seedFranchise } from "./seed-franchise";
import { seedAcademy } from "./seed-academy";
import { runZzpMembershipTask } from "@/lib/zzp-membership-task";
import { isSweepableLivecheck, LIVECHECK_MIN_AGE_MS } from "@/lib/livecheck-sweep";

const prisma = new PrismaClient();

/** Bouwt een Actor zoals de server-acties die doorgeven, zodat de seed de échte cascade-commands
 *  kan aanroepen (geen directe upserts in eindtoestanden). */
const actorOf = (id: string, role: "FREELANCER" | "CLIENT" | "ADMIN") => ({
  id,
  role,
  status: "ACTIVE",
});

const DEMO_PASSWORD = "demo1234";
const DAY = 86_400_000;
const daysFromNow = (n: number) => new Date(Date.now() + n * DAY);

/** Alleen demo-data seeden als dit expliciet aanstaat (demo-/testfase). In productie blijft de
 *  database leeg en komt de echte data via de CSV-import. */
const SEED_DEMO = process.env.SEED_DEMO === "true";

/** Tweede sleutel voor de DESTRUCTIEVE opschoning van de cascade-demo (facturen, prestaties,
 *  samenwerkingen, events). Die opschoning wist tabellen leeg en zou op een demo-URL waar per
 *  ongeluk echte data staat onherstelbaar toeslaan. Alleen met SEED_DEMO=true ÉN
 *  SEED_DEMO_RESET=true wordt er iets verwijderd; zonder deze vlag blijft bestaande data staan. */
const SEED_DEMO_RESET = process.env.SEED_DEMO_RESET === "true";

/**
 * Maakt bij go-live een échte beheerder aan uit env (geen demo-wachtwoord), maar alleen als die
 * via BOOTSTRAP_ADMIN_EMAIL/PASSWORD is geconfigureerd én er nog geen ADMIN bestaat. mustChangePassword
 * dwingt een eigen wachtwoord af bij de eerste login. Zo kan de eerste admin de CSV-import doen
 * zonder dat er ooit een hardgecodeerd demo-wachtwoord in productie staat.
 */
async function bootstrapAdminIfConfigured() {
  const config = resolveBootstrapAdminConfig({
    email: process.env.BOOTSTRAP_ADMIN_EMAIL,
    password: process.env.BOOTSTRAP_ADMIN_PASSWORD,
  });
  // Niets gezet: geen bootstrap-admin (de operator gebruikt de demo-seed of zet 'm later). Veilig.
  if (config.state === "unset") return;
  // Half gezet of ongeldig (zwak wachtwoord / fout e-mailadres): NIET stil overslaan — de operator
  // dénkt een beheerder te zetten. Faal luid zodat de misconfiguratie zichtbaar is (start.mjs logt de
  // gefaalde achtergrond-seed; de env-validatie/preflight vangt hetzelfde al af vóór de boot).
  if (config.state !== "ready" || !config.email) {
    throw new Error(
      `Bootstrap-beheerder onjuist geconfigureerd — er is GEEN beheerder aangemaakt:\n` +
        config.errors.map((e) => `  - ${e}`).join("\n"),
    );
  }
  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (existingAdmin) return;
  const passwordHash = await bcrypt.hash(process.env.BOOTSTRAP_ADMIN_PASSWORD as string, 10);
  await prisma.user.create({
    data: {
      email: config.email,
      name: "Beheerder",
      role: "ADMIN",
      status: "ACTIVE",
      passwordHash,
      mustChangePassword: true,
    },
  });
  console.log(
    "[seed] Bootstrap-admin aangemaakt voor %s (wachtwoordwijziging vereist).",
    config.email,
  );
}

/**
 * Ruimt achtergebleven livecheck-opdrachten op. De 24/7-routines publiceren tijdens een run soms
 * een tijdelijke opdracht met een titel als "Livecheck publiceren 1781209076945" om te verifiëren
 * dat publiceren nog werkt; die testrestanten horen niet tussen de echte opdrachten op
 * /admin/opdrachten. Defensief: alleen DRAFT/CLOSED-opdrachten ouder dan een dag, zónder reacties of
 * samenwerkingen, worden geruimd (zie isSweepableLivecheck). Draait op elke boot, ook in productie.
 */
async function sweepLivecheckJobs() {
  const cutoff = new Date(Date.now() - LIVECHECK_MIN_AGE_MS);
  const candidates = await prisma.job.findMany({
    where: {
      title: { startsWith: "Livecheck" },
      status: { in: ["DRAFT", "CLOSED"] },
      createdAt: { lt: cutoff },
    },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      _count: { select: { applications: true, collaborations: true } },
    },
  });
  let removed = 0;
  for (const c of candidates) {
    const sweepable = isSweepableLivecheck({
      title: c.title,
      status: c.status,
      createdAt: c.createdAt,
      applicationCount: c._count.applications,
      collaborationCount: c._count.collaborations,
    });
    if (!sweepable) continue;
    await prisma.job.delete({ where: { id: c.id } });
    removed++;
  }
  if (removed > 0) console.log(`[seed] ${removed} livecheck-opdracht(en) opgeruimd.`);
}

/**
 * Ruimt referentiedata op van vóór de zorg-focus (ICT/bouw/logistiek-branches en -vaardigheden).
 * Alleen rijen die nergens meer aan hangen worden verwijderd, zodat een database met echte data
 * nooit gegevens verliest: hangt er nog een profiel, bedrijf of opdracht aan, dan blijft de rij
 * staan. Draait ná het reconcileren van de demo-data, want dán zijn de oude koppelingen weg.
 */
async function pruneLegacyReferenceData() {
  const legacySkillSlugs = [
    "react",
    "typescript",
    "nodejs",
    "python",
    "aws",
    "scrum",
    "projectmanagement",
    "elektrotechniek",
    "vca",
  ];
  const legacyIndustrySlugs = ["ict", "bouw", "logistiek", "zorg"];
  const { count: skillCount } = await prisma.skill.deleteMany({
    where: { slug: { in: legacySkillSlugs }, freelancers: { none: {} }, jobs: { none: {} } },
  });
  const { count: industryCount } = await prisma.industry.deleteMany({
    where: {
      slug: { in: legacyIndustrySlugs },
      freelancers: { none: {} },
      companies: { none: {} },
      jobs: { none: {} },
    },
  });
  if (skillCount > 0 || industryCount > 0) {
    console.log(
      `[seed] ${skillCount} verouderde vaardighe(i)d(en) en ${industryCount} verouderde branche(s) opgeruimd.`,
    );
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // --- Referentiedata: plannen ---
  // Waarde-tiers: Gratis → Zelf-doen → Volledig Ontzorgd (zie src/lib/entitlements.ts).
  // De keys blijven FREE/PRO/BUSINESS; de naam/prijs volgt het waardegebaseerde model.
  const plans = [
    { key: "FREE", name: "Gratis", maxApplications: 5, maxJobs: 1, priceCents: 0 },
    { key: "PRO", name: "Zelf-doen", maxApplications: -1, maxJobs: -1, priceCents: 1900 },
    {
      key: "BUSINESS",
      name: "Volledig Ontzorgd",
      maxApplications: -1,
      maxJobs: -1,
      priceCents: 9900,
    },
  ];
  for (const plan of plans) {
    await prisma.plan.upsert({ where: { key: plan.key }, update: plan, create: plan });
  }

  // --- Referentiedata: branches & vaardigheden ---
  // Handslag is een zorgplatform: de branches zijn zorgsectoren en de vaardigheden zijn
  // zorghandelingen. Slugs zijn stabiel en Nederlands; de UI toont uitsluitend het label.
  const industries = [
    { name: "VVT", slug: "vvt" },
    { name: "Wijkverpleging", slug: "wijkverpleging" },
    { name: "GGZ", slug: "ggz" },
    { name: "Gehandicaptenzorg", slug: "ghz" },
    { name: "Jeugdzorg", slug: "jeugdzorg" },
    { name: "Ziekenhuiszorg", slug: "ziekenhuis" },
    { name: "Kraamzorg", slug: "kraamzorg" },
    { name: "Huisartsenzorg", slug: "huisartsenzorg" },
  ];
  for (const ind of industries) {
    await prisma.industry.upsert({
      where: { slug: ind.slug },
      update: { name: ind.name },
      create: ind,
    });
  }
  const skills: [string, string][] = [
    ["Verpleegkunde", "verpleegkunde"],
    ["Wondzorg", "wondzorg"],
    ["Medicatieverstrekking", "medicatieverstrekking"],
    ["Palliatieve zorg", "palliatieve-zorg"],
    ["Dementiezorg", "dementiezorg"],
    ["Insulinetoediening", "insulinetoediening"],
    ["Katheteriseren", "katheteriseren"],
    ["Infuustherapie", "infuustherapie"],
    ["Crisisinterventie", "crisisinterventie"],
    ["Kinderverpleegkunde", "kinderverpleegkunde"],
    ["Spoedeisende hulp", "spoedeisende-hulp"],
    ["Reanimatie (BLS)", "reanimatie"],
    ["OK-assistentie", "ok-assistentie"],
    ["Begeleiding gehandicaptenzorg", "begeleiding-ghz"],
    ["Jeugdhulpverlening", "jeugdhulpverlening"],
    ["Kraamzorg", "kraamzorg"],
    ["Geriatrische revalidatie", "geriatrische-revalidatie"],
  ];
  for (const [name, slug] of skills) {
    await prisma.skill.upsert({ where: { slug }, update: { name }, create: { name, slug } });
  }
  const skillRows = await prisma.skill.findMany();
  const skillId = Object.fromEntries(skillRows.map((s) => [s.slug, s.id])) as Record<
    string,
    string
  >;
  const industryRows = await prisma.industry.findMany();
  const industryId = Object.fromEntries(industryRows.map((i) => [i.slug, i.id])) as Record<
    string,
    string
  >;

  // Referentiedata (plans/skills/industries) is hierboven geseed en blijft áltijd nodig — ook in
  // productie. De demo-data hieronder (accounts incl. admin/demo1234, opdrachten, samenwerkingen,
  // facturen) draait alleen in de demo-/testfase (SEED_DEMO=true). In productie: alleen een
  // optionele bootstrap-admin; de echte data komt via de CSV-import.
  // Ruim livecheck-testrestanten van eerdere routine-runs op (ook in productie, vóór de demo-gate).
  await sweepLivecheckJobs();

  if (!SEED_DEMO) {
    await pruneLegacyReferenceData();
    await bootstrapAdminIfConfigured();
    console.log(
      "[seed] Referentiedata geseed; demo-data overgeslagen (zet SEED_DEMO=true voor de demo-/testfase).",
    );
    return;
  }

  // --- ADMIN ---
  await prisma.user.upsert({
    where: { email: "admin@zzp-platform.local" },
    update: {},
    create: {
      email: "admin@zzp-platform.local",
      name: "Admin Beheerder",
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
      passwordHash,
    },
  });

  // --- ZZP'ers (data-gedreven) ---
  type Cred = {
    type: string;
    title: string;
    issuer: string;
    status: "VERIFIED" | "SUBMITTED" | "EXPIRED" | "REJECTED";
    expiresInDays?: number;
    reason?: string;
    sharedWithClient?: boolean;
  };
  type Freelancer = {
    key: string;
    email: string;
    name: string;
    headline: string;
    bio: string;
    rate: number;
    availability: "AVAILABLE" | "LIMITED" | "UNAVAILABLE";
    location: string;
    workMode: "REMOTE" | "ONSITE" | "HYBRID";
    maxTravelMinutes?: number;
    industry: string;
    skills: string[];
    identityVerified: boolean;
    completeness: number;
    creds: Cred[];
    incomeGoalCents?: number;
    defaultMotivation?: string;
    website?: string;
    iban?: string;
  };
  const freelancers: Freelancer[] = [
    {
      key: "sanne",
      email: "zzp@zzp-platform.local",
      name: "Sanne de Vries",
      headline: "Verpleegkundige (BIG-geregistreerd)",
      bio: "Tien jaar ervaring in de somatische en wijkverpleging; flexibel inzetbaar en BIG-geregistreerd.",
      rate: 52,
      availability: "AVAILABLE",
      location: "Amsterdam",
      workMode: "ONSITE",
      industry: "vvt",
      skills: ["verpleegkunde", "wondzorg", "palliatieve-zorg"],
      identityVerified: true,
      completeness: 100,
      iban: "NL91ABNA0417164300",
      incomeGoalCents: 600000, // demo: € 6.000 maanddoel
      defaultMotivation:
        "Als BIG-geregistreerd verpleegkundige met tien jaar ervaring in de somatische en wijkverpleging ben ik flexibel inzetbaar en snel inwerkbaar. Ik werk zelfstandig en zorgvuldig, en pas graag mijn inzet aan op wat uw team nodig heeft.",
      creds: [
        {
          type: "VOG",
          title: "Verklaring Omtrent Gedrag",
          issuer: "Justis",
          status: "VERIFIED",
          expiresInDays: 300,
          sharedWithClient: true,
        },
        {
          type: "LICENSE",
          title: "BIG-registratie Verpleegkundige",
          issuer: "CIBG",
          status: "SUBMITTED",
        },
      ],
    },
    {
      key: "youssef",
      email: "youssef@zzp-platform.local",
      name: "Youssef Bakker",
      headline: "GGZ-verpleegkundige (BIG)",
      bio: "Werkt op opname- en crisisafdelingen; rustig en methodisch bij escalaties. Per direct beschikbaar.",
      rate: 62,
      availability: "AVAILABLE",
      location: "Utrecht",
      workMode: "ONSITE",
      industry: "ggz",
      skills: ["crisisinterventie", "medicatieverstrekking", "verpleegkunde"],
      identityVerified: true,
      completeness: 100,
      iban: "NL44RABO0123456789",
      website: "https://youssefbakker.nl",
      creds: [
        {
          type: "VOG",
          title: "Verklaring Omtrent Gedrag",
          issuer: "Justis",
          status: "VERIFIED",
          expiresInDays: 280,
        },
        {
          type: "DIPLOMA",
          title: "HBO-V Verpleegkunde (GGZ-differentiatie)",
          issuer: "Hogeschool Utrecht",
          status: "VERIFIED",
        },
      ],
    },
    {
      key: "lisa",
      email: "lisa@zzp-platform.local",
      name: "Lisa Smit",
      headline: "Praktijkondersteuner (POH-S)",
      bio: "Draait zelfstandig spreekuren voor chronische zorg; ervaren in ketenzorg diabetes en COPD.",
      rate: 58,
      availability: "LIMITED",
      location: "Rotterdam",
      workMode: "ONSITE",
      industry: "huisartsenzorg",
      skills: ["medicatieverstrekking", "insulinetoediening", "wondzorg"],
      identityVerified: false,
      completeness: 90,
      creds: [
        {
          type: "CERTIFICATE",
          title: "Praktijkondersteuner Somatiek (POH-S)",
          issuer: "Hogeschool Rotterdam",
          status: "VERIFIED",
          expiresInDays: 600,
        },
        {
          type: "VOG",
          title: "Verklaring Omtrent Gedrag",
          issuer: "Justis",
          status: "VERIFIED",
          expiresInDays: 200,
        },
      ],
    },
    {
      key: "daan",
      email: "daan@zzp-platform.local",
      name: "Daan Visser",
      headline: "Ambulanceverpleegkundige",
      bio: "Acute zorg en crisissituaties; gewend om snel te schakelen en zelfstandig te handelen.",
      rate: 72,
      availability: "AVAILABLE",
      location: "Eindhoven",
      workMode: "ONSITE",
      industry: "ziekenhuis",
      skills: ["spoedeisende-hulp", "reanimatie", "crisisinterventie"],
      identityVerified: true,
      completeness: 100,
      creds: [
        {
          type: "CERTIFICATE",
          title: "Ambulanceverpleegkundige",
          issuer: "Academie voor Ambulancezorg",
          status: "VERIFIED",
          expiresInDays: 700,
        },
        {
          type: "VOG",
          title: "Verklaring Omtrent Gedrag",
          issuer: "Justis",
          status: "VERIFIED",
          expiresInDays: 25,
        },
      ],
    },
    {
      key: "fatima",
      email: "fatima@zzp-platform.local",
      name: "Fatima El Amrani",
      headline: "Verpleegkundige (BIG)",
      bio: "Gediplomeerd verpleegkundige, BIG-geregistreerd. Flexibel inzetbaar.",
      rate: 55,
      availability: "AVAILABLE",
      location: "Den Haag",
      workMode: "ONSITE",
      industry: "ziekenhuis",
      skills: ["verpleegkunde", "infuustherapie", "wondzorg"],
      identityVerified: true,
      completeness: 100,
      creds: [
        {
          type: "LICENSE",
          title: "BIG-registratie Verpleegkundige",
          issuer: "CIBG",
          status: "VERIFIED",
          expiresInDays: 900,
        },
        {
          type: "VOG",
          title: "Verklaring Omtrent Gedrag",
          issuer: "Justis",
          status: "VERIFIED",
          expiresInDays: 320,
        },
        {
          type: "DIPLOMA",
          title: "HBO-V Verpleegkunde",
          issuer: "Haagse Hogeschool",
          status: "VERIFIED",
        },
      ],
    },
    {
      key: "peter",
      email: "peter@zzp-platform.local",
      name: "Peter Jansen",
      headline: "Doktersassistent",
      bio: "Triage aan de balie en telefoon, uitstrijkjes en kleine verrichtingen.",
      rate: 38,
      availability: "UNAVAILABLE",
      location: "Tilburg",
      workMode: "ONSITE",
      industry: "huisartsenzorg",
      skills: ["medicatieverstrekking"],
      identityVerified: false,
      completeness: 80,
      creds: [
        {
          type: "VOG",
          title: "Verklaring Omtrent Gedrag",
          issuer: "Justis",
          status: "SUBMITTED",
        },
      ],
    },
    {
      key: "anna",
      email: "anna@zzp-platform.local",
      name: "Anna Mulder",
      headline: "Jeugdzorgwerker (SKJ)",
      bio: "Ambulante gezinsbegeleiding en crisisplaatsingen; SKJ-geregistreerd.",
      rate: 48,
      availability: "AVAILABLE",
      location: "Amsterdam",
      workMode: "ONSITE",
      industry: "jeugdzorg",
      skills: ["jeugdhulpverlening", "crisisinterventie"],
      identityVerified: false,
      completeness: 95,
      creds: [
        {
          type: "DIPLOMA",
          title: "HBO Social Work",
          issuer: "Hogeschool Rotterdam",
          status: "SUBMITTED",
        },
      ],
    },
    // --- Extra ZZP'ers (breedte) ---
    { key: "kevin", email: "kevin@zzp-platform.local", name: "Kevin Mol", headline: "Begeleider gehandicaptenzorg", bio: "Woonbegeleiding en dagbesteding voor cliënten met een verstandelijke beperking.", rate: 44, availability: "AVAILABLE", location: "Amsterdam", workMode: "ONSITE", industry: "ghz", skills: ["begeleiding-ghz", "medicatieverstrekking"], identityVerified: true, completeness: 100, creds: [{ type: "VOG", title: "VOG", issuer: "Justis", status: "VERIFIED", expiresInDays: 250 }] }, // prettier-ignore
    { key: "nadia", email: "nadia@zzp-platform.local", name: "Nadia Haddad", headline: "GGZ-verpleegkundige (crisisdienst)", bio: "Draait crisisdiensten en beoordelingen; ervaren met agressieregulatie.", rate: 66, availability: "LIMITED", location: "Rotterdam", workMode: "ONSITE", industry: "ggz", skills: ["crisisinterventie", "medicatieverstrekking"], identityVerified: false, completeness: 85, creds: [{ type: "CERTIFICATE", title: "Crisisinterventie GGZ", issuer: "GGZ Academie", status: "SUBMITTED" }, { type: "VOG", title: "VOG", issuer: "Justis", status: "VERIFIED", expiresInDays: 20 }] }, // prettier-ignore
    { key: "tom", email: "tom@zzp-platform.local", name: "Tom Bakhuis", headline: "Operatieassistent", bio: "Instrumenteren en omlopen op OK; orthopedie en algemene chirurgie.", rate: 70, availability: "AVAILABLE", location: "Eindhoven", workMode: "ONSITE", industry: "ziekenhuis", skills: ["ok-assistentie", "reanimatie"], identityVerified: true, completeness: 95, creds: [{ type: "VOG", title: "VOG", issuer: "Justis", status: "VERIFIED", expiresInDays: 500 }, { type: "DIPLOMA", title: "Operatieassistent (niveau 4)", issuer: "Catharina Ziekenhuis Opleidingen", status: "VERIFIED" }] }, // prettier-ignore
    { key: "emma", email: "emma@zzp-platform.local", name: "Emma de Boer", headline: "Verpleegkundige (IC)", bio: "IC-verpleegkundige, BIG-geregistreerd, draait ook nachtdiensten.", rate: 70, availability: "AVAILABLE", location: "Groningen", workMode: "ONSITE", maxTravelMinutes: 30, industry: "ziekenhuis", skills: ["verpleegkunde", "infuustherapie", "reanimatie"], identityVerified: true, completeness: 100, creds: [{ type: "LICENSE", title: "BIG-registratie Verpleegkundige", issuer: "CIBG", status: "VERIFIED", expiresInDays: 800 }, { type: "VOG", title: "VOG", issuer: "Justis", status: "VERIFIED", expiresInDays: 200 }] }, // prettier-ignore
    { key: "ahmed", email: "ahmed@zzp-platform.local", name: "Ahmed Yilmaz", headline: "Verzorgende IG (nachtdienst)", bio: "Nachtdiensten in de VVT en beschermd wonen; rustig en zorgvuldig.", rate: 45, availability: "AVAILABLE", location: "Tilburg", workMode: "ONSITE", maxTravelMinutes: 75, industry: "vvt", skills: ["dementiezorg", "medicatieverstrekking"], identityVerified: false, completeness: 80, creds: [{ type: "CERTIFICATE", title: "Voorbehouden handelingen & medicatieveiligheid", issuer: "Zorgacademie Brabant", status: "VERIFIED", expiresInDays: 400 }, { type: "VOG", title: "VOG", issuer: "Justis", status: "REJECTED", reason: "Document onleesbaar — upload opnieuw." }] }, // prettier-ignore
    { key: "julia", email: "julia@zzp-platform.local", name: "Julia Vermeer", headline: "Kraamverzorgende", bio: "Begeleidt gezinnen tijdens de kraamweek; ervaren met borstvoedingsbegeleiding.", rate: 44, availability: "LIMITED", location: "Venlo", workMode: "ONSITE", industry: "kraamzorg", skills: ["kraamzorg"], identityVerified: true, completeness: 90, creds: [{ type: "VOG", title: "VOG", issuer: "Justis", status: "VERIFIED", expiresInDays: 350 }] }, // prettier-ignore
    { key: "bram", email: "bram@zzp-platform.local", name: "Bram Koster", headline: "Wijkverpleegkundige", bio: "Eigen caseload in de wijk, inclusief indicatiestelling en complexe wondzorg.", rate: 62, availability: "AVAILABLE", location: "Utrecht", workMode: "ONSITE", industry: "wijkverpleging", skills: ["wondzorg", "katheteriseren", "insulinetoediening"], identityVerified: true, completeness: 100, creds: [{ type: "CERTIFICATE", title: "Indicatiestelling wijkverpleging", issuer: "V&VN", status: "VERIFIED", expiresInDays: 600 }, { type: "VOG", title: "VOG", issuer: "Justis", status: "SUBMITTED" }] }, // prettier-ignore
    { key: "sofie", email: "sofie@zzp-platform.local", name: "Sofie Willems", headline: "Verzorgende IG", bio: "VVT en kleinschalig wonen; veel ervaring met dementiezorg.", rate: 44, availability: "AVAILABLE", location: "Den Bosch", workMode: "ONSITE", industry: "vvt", skills: ["dementiezorg", "wondzorg"], identityVerified: false, completeness: 75, creds: [{ type: "DIPLOMA", title: "MBO Verzorgende IG", issuer: "Koning Willem I College", status: "SUBMITTED" }] }, // prettier-ignore
    { key: "rik", email: "rik@zzp-platform.local", name: "Rik Plomp", headline: "Fysiotherapeut (geriatrie)", bio: "Geriatrische revalidatie en valpreventie in verpleeghuizen.", rate: 65, availability: "UNAVAILABLE", location: "Zwolle", workMode: "ONSITE", industry: "vvt", skills: ["geriatrische-revalidatie"], identityVerified: true, completeness: 95, creds: [{ type: "CERTIFICATE", title: "Kwaliteitsregister Fysiotherapie NL (KRF)", issuer: "KNGF", status: "EXPIRED" }, { type: "VOG", title: "VOG", issuer: "Justis", status: "VERIFIED", expiresInDays: 120 }] }, // prettier-ignore
    { key: "iris", email: "iris@zzp-platform.local", name: "Iris Hendriks", headline: "Verzorgende IG", bio: "Thuiszorg en VVT, flexibel inzetbaar.", rate: 42, availability: "AVAILABLE", location: "Arnhem", workMode: "ONSITE", maxTravelMinutes: 25, industry: "vvt", skills: ["dementiezorg", "medicatieverstrekking"], identityVerified: true, completeness: 100, creds: [{ type: "DIPLOMA", title: "MBO Verzorgende IG", issuer: "Rijn IJssel", status: "VERIFIED" }, { type: "VOG", title: "VOG", issuer: "Justis", status: "VERIFIED", expiresInDays: 280 }] }, // prettier-ignore
  ];

  const pid: Record<string, string> = {};
  const uid: Record<string, string> = {};
  for (const f of freelancers) {
    const idFields = f.identityVerified
      ? { identityVerifiedAt: daysFromNow(-40), verifiedLegalName: f.name }
      : {};
    const goalFields =
      f.incomeGoalCents !== undefined ? { monthlyIncomeGoalCents: f.incomeGoalCents } : {};
    const motivationFields =
      f.defaultMotivation !== undefined ? { defaultMotivation: f.defaultMotivation } : {};
    const websiteFields = f.website !== undefined ? { website: f.website } : {};
    const ibanFields = f.iban !== undefined ? { iban: f.iban } : {};
    const user = await prisma.user.upsert({
      where: { email: f.email },
      update: idFields,
      create: {
        email: f.email,
        name: f.name,
        role: "FREELANCER",
        status: "ACTIVE",
        emailVerified: new Date(),
        passwordHash,
        ...idFields,
        freelancerProfile: {
          create: {
            headline: f.headline,
            bio: f.bio,
            hourlyRate: f.rate,
            availability: f.availability,
            location: f.location,
            workMode: f.workMode,
            maxTravelMinutes: f.maxTravelMinutes ?? null,
            languages: JSON.stringify(["nl", "en"]),
            visibility: "PUBLIC",
            completeness: f.completeness,
            ...goalFields,
            ...motivationFields,
            ...websiteFields,
            ...ibanFields,
          },
        },
      },
      include: { freelancerProfile: true },
    });
    const profileId = user.freelancerProfile!.id;
    pid[f.key] = profileId;
    uid[f.key] = user.id;
    // Reconcileer de beschrijvende velden zodat een bestaande demo-database (die nog de oude,
    // niet-zorg profielteksten en tarieven bevat) terugkomt op de bedoelde inhoud. Toestanden die
    // tijdens testen bewust wijzigen (beschikbaarheid, zichtbaarheid, compleetheid) blijven staan.
    await prisma.freelancerProfile.update({
      where: { id: profileId },
      data: {
        headline: f.headline,
        bio: f.bio,
        hourlyRate: f.rate,
        location: f.location,
        workMode: f.workMode,
        maxTravelMinutes: f.maxTravelMinutes ?? null,
      },
    });
    // Vaardigheden/branche reconcileren i.p.v. alleen aanvullen: een demo-database die nog de
    // oude (niet-zorg) koppelingen heeft, komt zo terug op precies de bedoelde set.
    const wantedSkillIds = f.skills.map((slug) => skillId[slug]!);
    await prisma.freelancerSkill.deleteMany({
      where: { freelancerProfileId: profileId, skillId: { notIn: wantedSkillIds } },
    });
    for (const sid of wantedSkillIds) {
      await prisma.freelancerSkill.upsert({
        where: { freelancerProfileId_skillId: { freelancerProfileId: profileId, skillId: sid } },
        update: {},
        create: { freelancerProfileId: profileId, skillId: sid },
      });
    }
    await prisma.freelancerIndustry.deleteMany({
      where: { freelancerProfileId: profileId, industryId: { not: industryId[f.industry]! } },
    });
    await prisma.freelancerIndustry.upsert({
      where: {
        freelancerProfileId_industryId: {
          freelancerProfileId: profileId,
          industryId: industryId[f.industry]!,
        },
      },
      update: {},
      create: { freelancerProfileId: profileId, industryId: industryId[f.industry]! },
    });
    for (const c of f.creds) {
      const id = `cred-${f.key}-${c.type}`;
      await prisma.credential.upsert({
        where: { id },
        // Titel/uitgever mogen convergeren naar de seed-definitie (puur referentie-display);
        // status/datums blijven met rust zodat runtime-eindtoestanden niet worden overschreven.
        update: { title: c.title, issuer: c.issuer },
        create: {
          id,
          freelancerProfileId: profileId,
          type: c.type,
          title: c.title,
          issuer: c.issuer,
          status: c.status,
          visibility: "PUBLIC",
          sharedWithClient: c.sharedWithClient ?? false,
          issuedAt: daysFromNow(-400),
          expiresAt: c.expiresInDays ? daysFromNow(c.expiresInDays) : null,
          verifiedAt: c.status === "VERIFIED" ? daysFromNow(-30) : null,
          // Deterministische spreiding (2–8 dagen) zodat de wachtrij realistisch oogt en sommige
          // aanvragen "te lang wachtend" (>= 5 dagen) zijn, zonder dat de seed niet-idempotent wordt.
          submittedAt: c.status === "SUBMITTED" ? daysFromNow(-(2 + (id.length % 7))) : null,
          rejectionReason: c.status === "REJECTED" ? (c.reason ?? "Onleesbaar document.") : null,
        },
      });

      // Echt bewijsstuk-PDF koppelen zodat VOG/diploma/certificaat als PDF te bekijken zijn.
      // Idempotent + ephemeral-safe: de blob wordt elke seed-run (her)schreven (overschrijft op
      // dezelfde key, ook als lokale storage bij een herstart weg was), het Document wordt geüpsert
      // op de unieke storageKey, en de credential krijgt de documentId.
      // Defensief: een storage-fout (bv. niet-schrijfbare map) mag de rest van de seed niet afbreken.
      try {
        const bewijs = await credentialBewijsPdf({
          holderName: f.name,
          title: c.title,
          issuer: c.issuer,
          type: c.type,
          issuedAt: daysFromNow(-400),
          expiresAt: c.expiresInDays ? daysFromNow(c.expiresInDays) : null,
        });
        const storageKey = `seed-demo/credential-${id}.pdf`;
        await getStorage().put(storageKey, bewijs, "application/pdf");
        const doc = await prisma.document.upsert({
          where: { storageKey },
          update: { ownerId: user.id, size: bewijs.length },
          create: {
            ownerId: user.id,
            kind: documentKindForCredential(c.type as CredentialType),
            filename: `${c.title}.pdf`,
            mimeType: "application/pdf",
            size: bewijs.length,
            storageKey,
          },
        });
        await prisma.credential.update({ where: { id }, data: { documentId: doc.id } });
      } catch (e) {
        console.warn(`[seed] bewijsstuk koppelen mislukt voor ${id}:`, (e as Error).message);
      }
    }
  }

  // --- Opdrachtgevers + bedrijven (meerdere) ---
  // Vijf zorginstellingen over de belangrijkste sectoren. De e-mails van de zorg-vreemde
  // demo-bedrijven van vroeger (bouwpartners@/logiflow@/datic@) zijn hernoemd; alleen
  // opdrachtgever@ is een testafhankelijkheid en blijft ongewijzigd.
  const companySpecs = [
    { key: "jansen", email: "opdrachtgever@zzp-platform.local", contact: "Mark Jansen", company: "Zorgcentrum Jansen", industry: "vvt", website: "https://zorgcentrumjansen.nl", location: "Utrecht", description: "Verpleeghuiszorg en kleinschalig wonen voor somatiek en psychogeriatrie." }, // prettier-ignore
    { key: "zorggroep", email: "zorggroep@zzp-platform.local", contact: "Petra Mulder", company: "ZorgGroep Midden B.V.", industry: "wijkverpleging", website: "https://zorggroepmidden.nl", location: "Amersfoort", description: "Wijkverpleging, VVT en kraamzorg in de regio Midden-Nederland." }, // prettier-ignore
    { key: "ggz", email: "ggz@zzp-platform.local", contact: "Henk de Wit", company: "GGZ Meander", industry: "ggz", website: "https://ggzmeander.nl", location: "Zwolle", description: "Klinische en ambulante geestelijke gezondheidszorg, inclusief crisisdienst." }, // prettier-ignore
    { key: "ghz", email: "ghz@zzp-platform.local", contact: "Sandra Vos", company: "Stichting De Wingerd", industry: "ghz", website: "https://dewingerd-zorg.nl", location: "Venlo", description: "Woonlocaties en dagbesteding in de gehandicaptenzorg en jeugdhulp." }, // prettier-ignore
    { key: "ziekenhuis", email: "ziekenhuis@zzp-platform.local", contact: "Erik Brand", company: "Sint Elisabeth Ziekenhuis", industry: "ziekenhuis", website: "https://sintelisabeth.nl", location: "Eindhoven", description: "Algemeen ziekenhuis met IC, OK, spoedeisende hulp en poliklinieken." }, // prettier-ignore
  ];
  const clientUserIdByKey: Record<string, string> = {};
  const companyIdByKey: Record<string, string> = {};
  for (const c of companySpecs) {
    const u = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        name: c.contact,
        role: "CLIENT",
        status: "ACTIVE",
        emailVerified: new Date(),
        passwordHash,
        company: {
          create: {
            name: c.company,
            industryId: industryId[c.industry]!,
            description: c.description,
            website: c.website,
            location: c.location,
          },
        },
      },
      include: { company: true },
    });
    clientUserIdByKey[c.key] = u.id;
    companyIdByKey[c.key] = u.company!.id;
    // Reconcileer het bedrijfsprofiel, zodat een bestaande demo-database niet op de oude
    // (niet-zorg) naam, branche en omschrijving blijft staan.
    await prisma.company.update({
      where: { id: u.company!.id },
      data: {
        name: c.company,
        industryId: industryId[c.industry]!,
        description: c.description,
        website: c.website,
        location: c.location,
      },
    });
  }

  // --- Opdrachten ---
  type Job = {
    id: string;
    title: string;
    description: string;
    status: string;
    workMode: string;
    rateMin: number;
    rateMax: number;
    location?: string;
    industry: string;
    req: string[];
    opt?: string[];
    reqCreds?: string[];
    dbaRisk?: string;
    company?: string; // bedrijf-key (default "jansen")
  };
  const jobs: Job[] = [
    {
      id: "job-1",
      title: "Verpleegkundige somatiek (dag- en avonddienst)",
      description:
        "Inzet op een somatische afdeling; dag- en avonddiensten. BIG-registratie en VOG vereist.",
      status: "PUBLISHED",
      workMode: "ONSITE",
      rateMin: 45,
      rateMax: 62,
      location: "Utrecht",
      industry: "vvt",
      req: ["verpleegkunde"],
      opt: ["wondzorg"],
      reqCreds: ["VOG"],
      dbaRisk: "LAAG",
    },
    {
      id: "job-2",
      title: "GGZ-verpleegkundige — opnameafdeling (PAAZ)",
      description:
        "Verpleegkundige zorg op de psychiatrische afdeling van het ziekenhuis; dag- en avonddiensten in een vast team.",
      status: "PUBLISHED",
      workMode: "ONSITE",
      rateMin: 55,
      rateMax: 75,
      location: "Eindhoven",
      industry: "ggz",
      req: ["crisisinterventie"],
      opt: ["medicatieverstrekking"],
      company: "ziekenhuis",
    },
    {
      id: "job-3",
      title: "Verpleegkundig specialist (polikliniek)",
      description:
        "Zelfstandige spreekuren op de polikliniek interne geneeskunde; regie op chronische zorgtrajecten.",
      status: "PUBLISHED",
      workMode: "ONSITE",
      rateMin: 60,
      rateMax: 80,
      location: "Den Haag",
      industry: "ziekenhuis",
      req: ["medicatieverstrekking"],
      opt: ["wondzorg"],
      dbaRisk: "MIDDEN",
      company: "ziekenhuis",
    },
    {
      id: "job-4",
      title: "Verpleegkundige (detachering)",
      description: "Tijdelijke inzet op een somatische afdeling. BIG-registratie vereist.",
      status: "PUBLISHED",
      workMode: "ONSITE",
      rateMin: 45,
      rateMax: 65,
      location: "Den Haag",
      industry: "vvt",
      req: ["verpleegkunde"],
      opt: ["palliatieve-zorg"],
      reqCreds: ["LICENSE", "VOG"],
      dbaRisk: "MIDDEN",
    },
    {
      id: "job-5",
      title: "GGZ-crisisdienst verpleegkundige",
      description:
        "Beoordelingen en crisisinterventies binnen de 24-uurs crisisdienst; avond-, nacht- en weekenddiensten.",
      status: "PUBLISHED",
      workMode: "ONSITE",
      rateMin: 55,
      rateMax: 75,
      location: "Zwolle",
      industry: "ggz",
      req: ["crisisinterventie"],
      reqCreds: ["VOG"],
      company: "ggz",
    },
    {
      id: "job-6",
      title: "Operatieassistent (OK)",
      description: "Instrumenteren en omlopen op het OK-complex; orthopedie en algemene chirurgie.",
      status: "PUBLISHED",
      workMode: "ONSITE",
      rateMin: 60,
      rateMax: 80,
      location: "Eindhoven",
      industry: "ziekenhuis",
      req: ["ok-assistentie"],
      opt: ["reanimatie"],
      company: "ziekenhuis",
    },
    {
      id: "job-7",
      title: "Kinderverpleegkundige",
      description: "Concept-opdracht — nog niet gepubliceerd.",
      status: "DRAFT",
      workMode: "ONSITE",
      rateMin: 55,
      rateMax: 75,
      location: "Eindhoven",
      industry: "ziekenhuis",
      req: ["kinderverpleegkunde"],
      company: "ziekenhuis",
    },
    // --- Extra diensten, verdeeld over de zorginstellingen (breedte) ---
    { id: "job-8", title: "Wijkverpleegkundige — avondroute", description: "Avondroute in de regio Amersfoort; eigen caseload en overdracht met het wijkteam.", status: "PUBLISHED", workMode: "ONSITE", rateMin: 45, rateMax: 62, location: "Amersfoort", industry: "wijkverpleging", req: ["verpleegkunde"], opt: ["katheteriseren"], reqCreds: ["LICENSE", "VOG"], dbaRisk: "MIDDEN", company: "zorggroep" }, // prettier-ignore
    { id: "job-9", title: "Verzorgende IG (VVT)", description: "VVT-zorg met avond- en nachtdiensten (ORT van toepassing).", status: "PUBLISHED", workMode: "ONSITE", rateMin: 38, rateMax: 50, location: "Amersfoort", industry: "vvt", req: ["dementiezorg"], opt: ["medicatieverstrekking"], reqCreds: ["VOG"], company: "zorggroep" }, // prettier-ignore
    { id: "job-10", title: "Verzorgende IG — nachtdienst beschermd wonen", description: "Nachtdiensten op een beschermd-wonenlocatie; toezicht, medicatie en rapportage.", status: "PUBLISHED", workMode: "ONSITE", rateMin: 38, rateMax: 52, location: "Zwolle", industry: "ggz", req: ["medicatieverstrekking"], opt: ["dementiezorg"], reqCreds: ["VOG"], company: "ggz" }, // prettier-ignore
    { id: "job-11", title: "Fysiotherapeut — geriatrische revalidatie", description: "Revalidatie en valpreventie op de GRZ-afdeling; multidisciplinair overleg.", status: "PUBLISHED", workMode: "ONSITE", rateMin: 55, rateMax: 75, location: "Utrecht", industry: "vvt", req: ["geriatrische-revalidatie"], dbaRisk: "MIDDEN", company: "jansen" }, // prettier-ignore
    { id: "job-12", title: "Begeleider gehandicaptenzorg (woonlocatie)", description: "Woonbegeleiding voor cliënten met een verstandelijke beperking; dag- en avonddiensten.", status: "PUBLISHED", workMode: "ONSITE", rateMin: 38, rateMax: 52, location: "Venlo", industry: "ghz", req: ["begeleiding-ghz"], opt: ["medicatieverstrekking"], company: "ghz" }, // prettier-ignore
    { id: "job-13", title: "Kraamverzorgende — kraamweek", description: "Volledige kraamweken bij gezinnen in de regio; verzorging, voorlichting en signalering.", status: "PUBLISHED", workMode: "ONSITE", rateMin: 38, rateMax: 50, location: "Amersfoort", industry: "kraamzorg", req: ["kraamzorg"], reqCreds: ["VOG"], company: "zorggroep" }, // prettier-ignore
    { id: "job-14", title: "Verzorgende IG — nachtdienst geriatrie", description: "Nachtdiensten op de psychogeriatrische afdeling; ORT van toepassing.", status: "PUBLISHED", workMode: "ONSITE", rateMin: 40, rateMax: 55, location: "Utrecht", industry: "vvt", req: ["dementiezorg"], opt: ["palliatieve-zorg"], reqCreds: ["VOG"], company: "jansen" }, // prettier-ignore
    { id: "job-15", title: "IC-verpleegkundige — dagdienst", description: "Dagdiensten op de intensive care; beademing, infuustherapie en bewaking.", status: "PUBLISHED", workMode: "ONSITE", rateMin: 60, rateMax: 85, location: "Eindhoven", industry: "ziekenhuis", req: ["verpleegkunde"], opt: ["infuustherapie", "reanimatie"], company: "ziekenhuis" }, // prettier-ignore
    { id: "job-16", title: "Jeugdzorgwerker (ambulant, SKJ)", description: "Ambulante gezinsbegeleiding en crisisplaatsingen; SKJ-registratie en VOG vereist.", status: "PUBLISHED", workMode: "ONSITE", rateMin: 45, rateMax: 62, location: "Venlo", industry: "jeugdzorg", req: ["jeugdhulpverlening"], opt: ["crisisinterventie"], reqCreds: ["VOG"], company: "ghz" }, // prettier-ignore
    { id: "job-17", title: "Wijkverpleegkundige — indicatiestelling", description: "Indicatiestelling en complexe wondzorg in de wijk; werkt nauw samen met de huisarts.", status: "PUBLISHED", workMode: "ONSITE", rateMin: 50, rateMax: 70, location: "Amersfoort", industry: "wijkverpleging", req: ["wondzorg"], opt: ["insulinetoediening"], company: "zorggroep" }, // prettier-ignore
    { id: "job-18", title: "GGZ-verpleegkundige — ambulante zorg", description: "Ambulante begeleiding van cliënten thuis; medicatiebegeleiding en signalering.", status: "PUBLISHED", workMode: "ONSITE", rateMin: 55, rateMax: 75, location: "Zwolle", industry: "ggz", req: ["crisisinterventie"], opt: ["medicatieverstrekking"], company: "ggz" }, // prettier-ignore
    { id: "job-19", title: "Ambulanceverpleegkundige — meldkamerdienst", description: "Acute zorg vanuit de ambulancepost; wisselende dag-, avond- en nachtdiensten.", status: "PUBLISHED", workMode: "ONSITE", rateMin: 60, rateMax: 85, location: "Tilburg", industry: "ziekenhuis", req: ["spoedeisende-hulp"], opt: ["reanimatie"], reqCreds: ["VOG"], company: "ziekenhuis" }, // prettier-ignore
  ];
  const now = new Date();
  for (const j of jobs) {
    const jobSkills = [
      ...j.req.map((s) => ({ skillId: skillId[s]!, required: true })),
      ...(j.opt ?? []).map((s) => ({ skillId: skillId[s]!, required: false })),
    ];
    await prisma.job.upsert({
      where: { id: j.id },
      // Reconcileer de canonieke scalar-velden zodat gedrifte demo-data (bv. een
      // concept-opdracht die tijdens testen op CLOSED is gezet, of een vacature die
      // onder een branche-vreemd bedrijf is aangemaakt) bij her-seed terugkeert naar de
      // bedoelde titel/status én het branche-consistente bedrijf. Relaties (skills,
      // credential-eisen) blijven create-only (idempotent).
      update: {
        title: j.title,
        description: j.description,
        status: j.status,
        workMode: j.workMode,
        rateMin: j.rateMin,
        rateMax: j.rateMax,
        location: j.location ?? null,
        publishedAt: j.status === "PUBLISHED" ? now : null,
        companyId: companyIdByKey[j.company ?? "jansen"]!,
        industryId: industryId[j.industry]!,
      },
      create: {
        id: j.id,
        companyId: companyIdByKey[j.company ?? "jansen"]!,
        industryId: industryId[j.industry]!,
        title: j.title,
        description: j.description,
        status: j.status,
        workMode: j.workMode,
        rateMin: j.rateMin,
        rateMax: j.rateMax,
        location: j.location ?? null,
        publishedAt: j.status === "PUBLISHED" ? now : null,
        dbaRisk: j.dbaRisk ?? null,
        dbaReasons: j.dbaRisk ? "[]" : null,
        skills: { create: jobSkills },
        credentialRequirements: {
          create: (j.reqCreds ?? []).map((c) => ({ credentialType: c, required: true })),
        },
      },
    });
    // Vereiste/gewenste vaardigheden reconcileren: een bestaande demo-database die nog de oude
    // (niet-zorg) vaardigheden aan deze dienst heeft hangen, komt terug op de bedoelde set.
    await prisma.jobSkill.deleteMany({
      where: { jobId: j.id, skillId: { notIn: jobSkills.map((s) => s.skillId) } },
    });
    for (const s of jobSkills) {
      await prisma.jobSkill.upsert({
        where: { jobId_skillId: { jobId: j.id, skillId: s.skillId } },
        update: { required: s.required },
        create: { jobId: j.id, skillId: s.skillId, required: s.required },
      });
    }
    // Certificaateisen idem: alleen de in de seed gedefinieerde eisen blijven staan.
    await prisma.jobCredentialRequirement.deleteMany({
      where: { jobId: j.id, credentialType: { notIn: j.reqCreds ?? [] } },
    });
    for (const c of j.reqCreds ?? []) {
      await prisma.jobCredentialRequirement.upsert({
        where: { jobId_credentialType: { jobId: j.id, credentialType: c } },
        update: { required: true },
        create: { jobId: j.id, credentialType: c, required: true },
      });
    }
  }

  // --- Reacties (alle statussen) ---
  const snap = (status: string, satisfied: string[] = [], missing: string[] = []) =>
    JSON.stringify({ status, satisfied, inReview: [], expired: [], missing });
  type App = {
    id: string;
    job: string;
    fk: string;
    status: string;
    motivation: string;
    rate: number;
    score: number;
    compliance: string;
    reason?: string; // gestructureerde afwijzingscode (alleen bij REJECTED)
    acceptedAt?: Date; // moment van acceptatie (alleen bij ACCEPTED) — demonstreert het wacht-op-voorstel-signaal
  };
  const apps: App[] = [
    {
      id: "app-1",
      job: "job-1",
      fk: "sanne",
      status: "NEW",
      motivation: "BIG-geregistreerd verpleegkundige; ruime ervaring op somatische afdelingen.",
      rate: 58,
      score: 92,
      compliance: snap("COMPLIANT", ["VOG"]),
    },
    {
      id: "app-2",
      job: "job-16",
      fk: "anna",
      status: "SHORTLIST",
      motivation:
        "SKJ-geregistreerd; ervaren met ambulante gezinsbegeleiding en crisisplaatsingen.",
      rate: 55,
      score: 76,
      compliance: snap("NON_COMPLIANT", [], ["VOG"]),
    },
    {
      id: "app-3",
      job: "job-2",
      fk: "youssef",
      status: "ACCEPTED",
      // Geaccepteerd, maar nog geen samenwerkingsvoorstel: ligt al 6 dagen (> PROPOSAL_STALL_DAYS) →
      // toont de geëscaleerde "wacht op voorstel"-taak op /acties bij de opdrachtgever.
      acceptedAt: daysFromNow(-6),
      motivation: "Ervaren GGZ-verpleegkundige; vertrouwd met opname- en crisissituaties.",
      rate: 68,
      score: 90,
      compliance: snap("COMPLIANT"),
    },
    {
      id: "app-4",
      job: "job-3",
      fk: "lisa",
      status: "NEW",
      motivation: "POH-S met ruime ervaring in poliklinische en chronische zorg.",
      rate: 72,
      score: 88,
      compliance: snap("COMPLIANT"),
    },
    {
      id: "app-5",
      job: "job-9",
      fk: "sanne",
      status: "ACCEPTED",
      motivation: "Ervaren in VVT en wijkzorg; flexibel voor avond- en nachtdiensten.",
      rate: 48,
      score: 84,
      compliance: snap("COMPLIANT"),
    },
    {
      id: "app-6",
      job: "job-4",
      fk: "fatima",
      status: "SHORTLIST",
      motivation: "BIG-geregistreerd, direct inzetbaar op somatiek.",
      rate: 58,
      score: 95,
      compliance: snap("COMPLIANT", ["LICENSE", "VOG"]),
    },
    {
      id: "app-7",
      job: "job-5",
      fk: "daan",
      status: "NEW",
      motivation: "Ervaren in acute zorg en crisissituaties; per direct beschikbaar.",
      rate: 68,
      score: 91,
      compliance: snap("COMPLIANT", ["VOG"]),
    },
    {
      id: "app-8",
      job: "job-3",
      fk: "peter",
      status: "REJECTED",
      motivation: "Doktersassistent; wil graag de stap naar de polikliniek maken.",
      rate: 50,
      score: 58,
      compliance: snap("COMPLIANT"),
      reason: "EXPERIENCE_MISMATCH",
    },
  ];
  for (const a of apps) {
    await prisma.application.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        jobId: a.job,
        freelancerId: pid[a.fk]!,
        status: a.status,
        motivation: a.motivation,
        proposedRate: a.rate,
        availability: "In overleg",
        matchScore: a.score,
        complianceSnapshot: a.compliance,
        rejectionReason: a.reason ?? null,
        acceptedAt: a.acceptedAt ?? null,
      },
    });
  }

  // --- Directe uitnodigingen (JOB_INVITED) — demonstreert de opvolging-kaart op /opdrachten/[id] ---
  // Mark Jansen nodigde twee passende ZZP'ers uit voor job-1: Sanne reageerde daadwerkelijk
  // (app-1), Lisa nog niet. Zo toont de opvolging-kaart 1/2 gereageerd (goede respons). Vaste id's
  // + upsert houden de seed idempotent (audit-records hebben geen natuurlijke sleutel).
  const jansenUserId = clientUserIdByKey["jansen"];
  if (jansenUserId) {
    const jobInvites: Array<{ id: string; fk: string }> = [
      { id: "seed-invite-job1-sanne", fk: "sanne" },
      { id: "seed-invite-job1-lisa", fk: "lisa" },
    ];
    for (const inv of jobInvites) {
      const freelancerProfileId = pid[inv.fk];
      if (!freelancerProfileId) continue;
      await prisma.auditLog.upsert({
        where: { id: inv.id },
        update: {},
        create: {
          id: inv.id,
          actorId: jansenUserId,
          action: "JOB_INVITED",
          entityType: "Job",
          entityId: "job-1",
          metadata: JSON.stringify({ freelancerId: freelancerProfileId }),
        },
      });
    }
  }

  // Openstaande uitnodiging voor de ZZP'er-kant: ZorgGroep nodigde Sanne uit voor de
  // Wijkverpleegkundige-dienst (job-8, PUBLISHED) waarop ze nog niet reageerde — zo toont de
  // "Je bent uitgenodigd"-band op /opdrachten een echte open lead. (job-1/job-9 vallen weg: daar
  // reageerde Sanne al op.)
  const zorggroepUserId = clientUserIdByKey["zorggroep"];
  if (zorggroepUserId && pid["sanne"]) {
    await prisma.auditLog.upsert({
      where: { id: "seed-invite-job8-sanne" },
      update: {},
      create: {
        id: "seed-invite-job8-sanne",
        actorId: zorggroepUserId,
        action: "JOB_INVITED",
        entityType: "Job",
        entityId: "job-8",
        metadata: JSON.stringify({ freelancerId: pid["sanne"] }),
      },
    });
  }

  // --- Bewaarde opdrachten (Sanne) — bookmarks om er later op terug te komen ---
  // Twee open diensten waar ze nog niet op reageerde + één DRAFT (job-7) zodat het
  // overzicht óók de "niet meer beschikbaar"-sectie demonstreert.
  for (const jobId of ["job-15", "job-17", "job-7"]) {
    await prisma.savedJob.upsert({
      where: { freelancerProfileId_jobId: { freelancerProfileId: pid["sanne"]!, jobId } },
      update: {},
      create: { freelancerProfileId: pid["sanne"]!, jobId },
    });
  }

  // --- Werkproces-cascade via de ÉCHTE commands (geen directe upserts) ---
  // Demo-data, maar elke samenwerking/urenstaat/factuur ontstaat via dezelfde command-paden als de
  // app: signContract -> createPerformance -> submitPerformance -> approvePerformance ->
  // submitInvoice -> approveInvoice -> confirmPayment. Zo worden óók de DomainEvents, de audit-log
  // én de administratie (AdministrationEntry: grootboek/BTW/debiteuren) correct gevuld — net als in
  // productie. Directe upserts zouden lege boekhouding geven.
  //
  // Run-once: alleen genereren als de rijke set er nog niet is, zodat testwijzigingen behouden
  // blijven bij een herstart; de eerste keer wordt oude cascade-demo opgeruimd. SEED_DEMO-only.
  const RICH_COLLAB_TARGET = 13;
  // VEILIGHEIDSPOORT vóór de destructieve opschoning hieronder. Die wist samenwerkingen, prestaties,
  // facturen, grootboekregels en events LEEG. Op een lege database is dat een no-op, maar op een
  // (demo-)URL waar inmiddels echte data staat, is het onherstelbaar dataverlies. Daarom wordt er
  // alleen iets verwijderd als er niets te verliezen valt (alle betrokken tabellen leeg) óf als de
  // reset expliciet is bewapend met SEED_DEMO_RESET=true.
  const [collaborationCount, existingInvoiceCount, existingPerformanceCount] = await Promise.all([
    prisma.collaboration.count(),
    prisma.invoice.count(),
    prisma.performance.count(),
  ]);
  const hasExistingCascadeData =
    collaborationCount > 0 || existingInvoiceCount > 0 || existingPerformanceCount > 0;

  if (collaborationCount < RICH_COLLAB_TARGET && hasExistingCascadeData && !SEED_DEMO_RESET) {
    console.log(
      "[seed] Cascade-demo overgeslagen: er staat al werkproces-data in de database en het opnieuw " +
        "opbouwen zou die wissen. Zet SEED_DEMO_RESET=true om de demo-set bewust opnieuw op te bouwen.",
    );
  } else if (collaborationCount < RICH_COLLAB_TARGET) {
    // Oude/onvolledige cascade-demo opruimen in FK-veilige volgorde (children eerst).
    // BELANGRIJK: ook de cascade-applicaties weg, anders botst een herhaalde regeneratie op de
    // unique (jobId, freelancerId) bij het opnieuw aanmaken (de samenwerking wordt verwijderd, maar
    // de reactie blijft staan). De foundation-reacties (app-1..app-8) horen niet bij de cascade en
    // blijven behouden; we verwijderen alles daarbuiten (demo-only: alleen seed-data).
    const FOUNDATION_APP_IDS = apps.map((a) => a.id);
    await prisma.administrationEntry.deleteMany({});
    await prisma.invoiceLine.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.performance.deleteMany({});
    await prisma.collaboration.deleteMany({});
    await prisma.application.deleteMany({ where: { id: { notIn: FOUNDATION_APP_IDS } } });
    await prisma.eventHandlerRun.deleteMany({});
    await prisma.domainEvent.deleteMany({});

    type Target =
      | "PROPOSED"
      | "ACTIVE"
      | "PERF_SUBMITTED"
      | "PERF_REJECTED"
      | "PERF_APPROVED"
      | "INVOICE_SUBMITTED"
      | "INVOICE_APPROVED"
      | "PAID";
    const ORDER: Target[] = [
      "PROPOSED",
      "ACTIVE",
      "PERF_SUBMITTED",
      "PERF_REJECTED",
      "PERF_APPROVED",
      "INVOICE_SUBMITTED",
      "INVOICE_APPROVED",
      "PAID",
    ];
    const reaches = (target: Target, stage: Target) =>
      ORDER.indexOf(target) >= ORDER.indexOf(stage);

    // Bedrijf per opdracht, zodat de cascade over meerdere opdrachtgevers wordt verdeeld.
    const jobCompanyKey: Record<string, string> = Object.fromEntries(
      jobs.map((j) => [j.id, j.company ?? "jansen"]),
    );
    // Eén scenario per (nieuwe) opdracht → elk (freelancer, opdracht)-paar is uniek en botst niet met
    // de foundation-reacties (constraint jobId+freelancerId). Verdeeld over alle bedrijven/toestanden.
    const scenarios: {
      fk: string;
      job: string;
      rate: number;
      target: Target;
      ort?: boolean;
      collabId?: string;
      endInDays?: number; // zet de einddatum → vult het vervolgsignaal ("loopt af") in de demo
    }[] = [
      // Vlaggenschip: het primaire demo-account Sanne (zzp@) krijgt een volledige reis met de
      // primaire opdrachtgever Jansen (opdrachtgever@) — t/m betaald. Stabiel id "collab-1" zodat
      // het compliance-dossier en de Ontzorgd-/administratie-overzichten een vaste ankerklant hebben.
      {
        fk: "sanne",
        job: "job-4",
        rate: 60,
        target: "PAID",
        collabId: "collab-1",
        ort: true,
        endInDays: 10,
      },
      { fk: "emma", job: "job-15", rate: 70, target: "PAID", ort: true },
      { fk: "iris", job: "job-9", rate: 42, target: "INVOICE_APPROVED", ort: true },
      { fk: "ahmed", job: "job-10", rate: 45, target: "PAID" },
      { fk: "rik", job: "job-11", rate: 65, target: "ACTIVE", endInDays: 14 },
      { fk: "julia", job: "job-13", rate: 44, target: "INVOICE_SUBMITTED" },
      { fk: "kevin", job: "job-12", rate: 46, target: "PERF_APPROVED" },
      { fk: "bram", job: "job-17", rate: 62, target: "PAID" },
      { fk: "tom", job: "job-6", rate: 70, target: "PERF_SUBMITTED" },
      { fk: "sofie", job: "job-14", rate: 44, target: "PERF_REJECTED" },
      { fk: "nadia", job: "job-5", rate: 66, target: "ACTIVE" },
      { fk: "youssef", job: "job-18", rate: 68, target: "PROPOSED" },
      { fk: "daan", job: "job-19", rate: 72, target: "PERF_APPROVED" },
    ];

    let i = 0;
    for (const s of scenarios) {
      i++;
      const compKey = jobCompanyKey[s.job] ?? "jansen";
      const application = await prisma.application.create({
        data: {
          jobId: s.job,
          freelancerId: pid[s.fk]!,
          status: "ACCEPTED",
          motivation: "Beschikbaar en passend bij de opdracht; graag aan de slag.",
          proposedRate: s.rate,
          availability: "In overleg",
          matchScore: 80 + (i % 15),
        },
      });
      const collab = await prisma.collaboration.create({
        data: {
          ...(s.collabId ? { id: s.collabId } : {}),
          jobId: s.job,
          applicationId: application.id,
          freelancerId: pid[s.fk]!,
          companyId: companyIdByKey[compKey]!,
          status: "PROPOSED",
          contractStatus: "DRAFT",
          rate: s.rate,
          startDate: daysFromNow(-30 + i),
          ...(s.endInDays !== undefined ? { endDate: daysFromNow(s.endInDays) } : {}),
          ortProfile: s.ort ? "VVT" : null,
        },
      });
      const fActor = actorOf(uid[s.fk]!, "FREELANCER");
      const cActor = actorOf(clientUserIdByKey[compKey]!, "CLIENT");

      if (!reaches(s.target, "ACTIVE")) continue;
      try {
        await signContract(cActor, collab.id);
      } catch (e) {
        // Inzetbaarheid-gate (ADR-0006, C-hybride): voldoet de ZZP'er niet aan de harde
        // certificaateisen, dan kan de plaatsing niet starten. Laat 'm als PROPOSED staan —
        // dat demonstreert juist de plaatsing-gate (bv. Ahmed met een afgewezen VOG op job-10).
        if (e instanceof CascadeError) continue;
        throw e;
      }
      if (!reaches(s.target, "PERF_SUBMITTED")) continue;

      const perfId = await createPerformance(fActor, {
        collaborationId: collab.id,
        type: "HOURS",
        hours: s.ort ? 8 : 16,
        rateCents: s.rate * 100,
        ortSegments: s.ort
          ? [
              { category: "NORMAL" as const, hours: 4 },
              { category: "NIGHT" as const, hours: 4 },
            ]
          : null,
        periodStart: daysFromNow(-21 + i),
        periodEnd: daysFromNow(-14 + i),
        description: s.ort
          ? "Avond- en nachtdiensten somatische afdeling"
          : "Gewerkte diensten deze periode",
      });
      await submitPerformance(fActor, perfId);

      if (s.target === "PERF_REJECTED") {
        await rejectPerformance(
          cActor,
          perfId,
          "Graag de uren per dienst specificeren en opnieuw indienen.",
        );
        continue;
      }
      if (!reaches(s.target, "PERF_APPROVED")) continue;
      await approvePerformance(cActor, perfId); // genereert automatisch de concept-factuur

      if (!reaches(s.target, "INVOICE_SUBMITTED")) continue;
      const draftInvoice = await prisma.invoice.findFirst({
        where: { collaborationId: collab.id, lifecycleStatus: "DRAFT" },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (!draftInvoice) continue;
      await submitInvoice(fActor, draftInvoice.id);
      if (!reaches(s.target, "INVOICE_APPROVED")) continue;
      await approveInvoice(cActor, draftInvoice.id);
      if (!reaches(s.target, "PAID")) continue;
      await confirmPayment(fActor, draftInvoice.id); // statusupdate, geen betaling (Besluit 1)
    }
  }

  // --- Zakelijke uitgaven (Sanne) — demonstreert de uitgaven-/onkostentracker met echte
  //     grootboekregels, zodat winst, IB-schatting en btw-teruggave met de werkelijke kosten kloppen.
  //     Idempotent via vaste ids; de bijbehorende AdministrationEntry-regels worden herbouwd via
  //     planExpensePostings (dezelfde functie als de server-action) i.p.v. handmatige boekingen. ---
  {
    const thisYear = new Date().getUTCFullYear();
    const sanneUserId = uid["sanne"];
    const demoExpenses: {
      id: string;
      description: string;
      category: string;
      netCents: number;
      vatCents: number;
      kilometers?: number;
      occurredAt: Date;
    }[] = [
      {
        id: "expense-sanne-1",
        description: "Treinabonnement woon-werk opdrachtgever",
        category: "REISKOSTEN",
        netCents: 12500,
        vatCents: 1125, // 9% ov
        occurredAt: new Date(Date.UTC(thisYear, 1, 12)),
      },
      {
        id: "expense-sanne-2",
        description: "Bijscholing wondzorg (online cursus)",
        category: "OPLEIDING",
        netCents: 34900,
        vatCents: 7329, // 21%
        occurredAt: new Date(Date.UTC(thisYear, 2, 3)),
      },
      {
        id: "expense-sanne-3",
        description: "Boekhoudsoftware jaarabonnement",
        category: "SOFTWARE",
        netCents: 14900,
        vatCents: 3129, // 21%
        occurredAt: new Date(Date.UTC(thisYear, 0, 20)),
      },
      {
        id: "expense-sanne-4",
        description: "Zakelijke rit — cliëntbezoek eigen auto",
        category: "REISKOSTEN",
        netCents: 120 * 23, // 120 km × € 0,23 (vaste kilometervergoeding)
        vatCents: 0, // een kilometervergoeding kent geen voorbelasting
        kilometers: 120,
        occurredAt: new Date(Date.UTC(thisYear, 2, 18)),
      },
    ];
    if (sanneUserId) {
      for (const e of demoExpenses) {
        await prisma.expense.upsert({
          where: { id: e.id },
          update: {
            description: e.description,
            category: e.category,
            netCents: e.netCents,
            vatCents: e.vatCents,
            kilometers: e.kilometers ?? null,
            occurredAt: e.occurredAt,
          },
          create: {
            id: e.id,
            userId: sanneUserId,
            description: e.description,
            category: e.category,
            netCents: e.netCents,
            vatCents: e.vatCents,
            kilometers: e.kilometers ?? null,
            occurredAt: e.occurredAt,
          },
        });
        // Grootboekregels deterministisch herbouwen (idempotent): eerst weg, dan opnieuw boeken.
        await prisma.administrationEntry.deleteMany({ where: { expenseId: e.id } });
        const postings = planExpensePostings({ netCents: e.netCents, vatCents: e.vatCents });
        if (postings.length > 0) {
          await prisma.administrationEntry.createMany({
            data: postings.map((p) => ({
              party: p.party,
              ownerUserId: sanneUserId,
              account: p.account,
              debitCents: p.debitCents,
              creditCents: p.creditCents,
              expenseId: e.id,
              occurredAt: e.occurredAt,
            })),
          });
        }
      }
    }
  }

  // --- Werkervaring (Sanne) — zelf-gerapporteerde rollen naast de geverifieerde certificaten,
  //     zodat het profiel de trust/credibility-sectie demonstreert. Idempotent via vaste ids. ---
  {
    const sanneProfileId = pid["sanne"];
    const demoExperiences: {
      id: string;
      role: string;
      organization: string;
      startYear: number;
      endYear: number | null;
      description: string | null;
    }[] = [
      {
        id: "we-sanne-1",
        role: "Verpleegkundige IC",
        organization: "Academisch ziekenhuis",
        startYear: 2021,
        endYear: null,
        description: "Intensieve zorg op de IC-afdeling, coördinatie rond complexe casussen.",
      },
      {
        id: "we-sanne-2",
        role: "Wijkverpleegkundige",
        organization: "Thuiszorgorganisatie",
        startYear: 2017,
        endYear: 2021,
        description: "Zelfstandige wijkzorg met eigen caseload en indicatiestelling.",
      },
      {
        id: "we-sanne-3",
        role: "Verpleegkundige (afstuderen)",
        organization: "Regionaal ziekenhuis",
        startYear: 2015,
        endYear: 2017,
        description: null,
      },
    ];
    if (sanneProfileId) {
      for (const w of demoExperiences) {
        await prisma.workExperience.upsert({
          where: { id: w.id },
          update: {
            role: w.role,
            organization: w.organization,
            startYear: w.startYear,
            endYear: w.endYear,
            description: w.description,
          },
          create: {
            id: w.id,
            freelancerProfileId: sanneProfileId,
            role: w.role,
            organization: w.organization,
            startYear: w.startYear,
            endYear: w.endYear,
            description: w.description,
          },
        });
      }
    }
  }

  // --- Modelovereenkomst digitaal akkoord — een ACTIEVE of AFGERONDE samenwerking hoort een
  //     ondertekende modelovereenkomst te hebben; anders spreekt de voortgangstracker ("contract
  //     getekend") de modelovereenkomst-kaart ("nog niet ondertekend") tegen. Zet beide digitale
  //     akkoorden op samenwerkingen die de start hebben gehaald. Idempotent (alleen waar nog null). ---
  await prisma.collaboration.updateMany({
    where: { status: { in: ["ACTIVE", "COMPLETED"] }, agreementFreelancerSignedAt: null },
    data: {
      agreementFreelancerSignedAt: daysFromNow(-28),
      agreementClientSignedAt: daysFromNow(-28),
    },
  });

  // --- Tweezijdige beoordelingen — op afgeronde (COMPLETED) samenwerkingen laten beide partijen
  //     elkaar éénmalig een beoordeling na, zodat het publieke ZZP-profiel een echte reputatie toont
  //     naast het vertrouwensniveau. Idempotent via @@unique([collaborationId, authorId]). ---
  const completedCollabs = await prisma.collaboration.findMany({
    where: { status: "COMPLETED" },
    select: {
      id: true,
      company: { select: { userId: true } },
      freelancer: { select: { userId: true } },
    },
  });
  // Demo-samenwerkingen zijn historisch afgerond → afrondingsmoment ver in het verleden, zodat het
  // blinde beoordelingsvenster (double-blind reveal) al gesloten is en de beoordelingen PUBLISHED tonen.
  await prisma.collaboration.updateMany({
    where: { status: "COMPLETED", completedAt: null },
    data: { completedAt: daysFromNow(-20) },
  });
  let r = 0;
  for (const c of completedCollabs) {
    r++;
    const clientRating = 5 - (r % 2); // afwisselend 5 en 4 sterren
    const freelancerRating = 4 + (r % 2); // afwisselend 4 en 5 sterren
    await prisma.review.upsert({
      where: { collaborationId_authorId: { collaborationId: c.id, authorId: c.company.userId } },
      update: {},
      create: {
        collaborationId: c.id,
        authorId: c.company.userId,
        subjectId: c.freelancer.userId,
        direction: "CLIENT_ON_FREELANCER",
        rating: clientRating,
        comment:
          clientRating === 5
            ? "Prettige samenwerking, vakkundig en betrouwbaar. Zeker een aanrader."
            : "Goede inzet en duidelijke communicatie. Graag tot een volgende keer.",
        status: "PUBLISHED",
        publishedAt: daysFromNow(-12),
        revealDeadline: daysFromNow(-6),
        createdAt: daysFromNow(-7 + r),
      },
    });
    await prisma.review.upsert({
      where: { collaborationId_authorId: { collaborationId: c.id, authorId: c.freelancer.userId } },
      update: {},
      create: {
        collaborationId: c.id,
        authorId: c.freelancer.userId,
        subjectId: c.company.userId,
        direction: "FREELANCER_ON_CLIENT",
        rating: freelancerRating,
        comment:
          freelancerRating === 5
            ? "Heldere opdracht, snelle afhandeling en op tijd betaald."
            : "Fijne opdrachtgever met duidelijke verwachtingen.",
        status: "PUBLISHED",
        publishedAt: daysFromNow(-12),
        revealDeadline: daysFromNow(-6),
        createdAt: daysFromNow(-6 + r),
      },
    });
  }

  // --- Weekrooster per samenwerking (ADR-0004) — leg op een paar demo-samenwerkingen de werkelijke
  //     weekdagen vast, zodat de detailpagina (en het weekoverzicht) een echt "ma + di bij A"-rooster
  //     toont i.p.v. alleen periode/timing. Idempotent: zet alleen het additieve veld. ---
  const weekdayDemo: { where: object; days: string }[] = [
    { where: { id: "collab-1" }, days: '["MON","TUE","WED"]' }, // Sanne ↔ Jansen (anker)
    { where: { jobId: "job-11" }, days: '["MON","TUE","WED","THU"]' }, // Rik — actief
    { where: { jobId: "job-5" }, days: '["WED","THU","FRI"]' }, // Nadia — actief
    { where: { jobId: "job-18" }, days: '["MON","WED","FRI"]' }, // Youssef — voorgesteld
  ];
  for (const w of weekdayDemo) {
    await prisma.collaboration.updateMany({ where: w.where, data: { weekdays: w.days } });
  }

  // --- Ideeënbox — een paar ingediende ideeën met stemmen, zodat de pagina meteen gevuld is.
  //     Eigen guard (zelfherstellend). De indiener stemt automatisch op zijn eigen idee. ---
  if ((await prisma.idea.count()) === 0) {
    const ideaSpecs: {
      author: string;
      title: string;
      description: string;
      status?: string;
      audience?: string;
      theme?: string;
      declineReason?: string;
      voters: string[];
      comments?: [string, string][];
    }[] = [
      { author: "sanne", title: "Donkere modus voor het hele platform", description: "Een rustige donkere modus zou prettig werken tijdens avond- en nachtdiensten.", audience: "PLATFORM", voters: ["youssef", "lisa", "daan", "kevin"], comments: [["lisa", "Ja graag — vooral 's nachts is het scherm nu erg fel."], ["daan", "Met een automatische schakeling op zonsondergang zou top zijn."]] }, // prettier-ignore
      { author: "lisa", title: "Facturen automatisch herinneren", description: "Stuur opdrachtgevers automatisch een nette herinnering zodra een factuur openstaat.", status: "PLANNED", audience: "CLIENT", theme: "BILLING", voters: ["sanne", "fatima"], comments: [["sanne", "Dit scheelt me elke maand bellen."]] }, // prettier-ignore
      { author: "kevin", title: "Mobiele app met push-meldingen", description: "Meldingen voor nieuwe passende opdrachten en berichten, direct op de telefoon.", audience: "FREELANCER", voters: ["daan", "youssef"] }, // prettier-ignore
      { author: "daan", title: "Urenstaten exporteren naar PDF", description: "Handig voor mijn eigen administratie en om door te sturen naar de boekhouder.", status: "DONE", audience: "FREELANCER", theme: "BILLING", voters: ["sanne"] }, // prettier-ignore
      { author: "youssef", title: "Openbaar profiel met eigen domeinnaam", description: "Een persoonlijke pagina op een eigen domein om naar opdrachtgevers te delen.", status: "DECLINED", audience: "FREELANCER", declineReason: "Valt buiten de scope van het platform; een link naar je profiel blijft beschikbaar.", voters: ["kevin"] }, // prettier-ignore
      { author: "fatima", title: "VOG-verloop tijdig signaleren", description: "Een waarschuwing ruim voordat mijn VOG of BIG-registratie verloopt, zodat ik op tijd kan verlengen.", audience: "BROKER", theme: "COMPLIANCE", voters: ["sanne", "lisa", "daan"] }, // prettier-ignore
    ];
    for (const spec of ideaSpecs) {
      if (!uid[spec.author]) continue;
      const voterIds = [...new Set([spec.author, ...spec.voters])]
        .map((v) => uid[v])
        .filter((x): x is string => !!x);
      const comments = (spec.comments ?? [])
        .filter(([author]) => uid[author])
        .map(([author, body]) => ({ authorId: uid[author]!, body }));
      await prisma.idea.create({
        data: {
          authorId: uid[spec.author]!,
          title: spec.title,
          description: spec.description,
          status: spec.status ?? "OPEN",
          audience: spec.audience ?? "PLATFORM",
          theme: spec.theme ?? null,
          declineReason: spec.declineReason ?? null,
          votes: { create: voterIds.map((userId) => ({ userId })) },
          comments: { create: comments },
        },
      });
    }
  }

  // --- Support-tickets (helpdesk-wachtrij) — eigen guard, los van de cascade-telling, zodat ze
  //     ook (her)gemaakt worden als een eerdere boot halverwege afbrak (zelfherstellend). ---
  if ((await prisma.supportTicket.count()) === 0) {
    const ticketSpecs: { fk: string; subject: string; category: string; status: string }[] = [
      { fk: "daan", subject: "Mijn VOG is afgewezen — hoe dien ik opnieuw in?", category: "CREDENTIAL", status: "NEW" }, // prettier-ignore
      { fk: "lisa", subject: "Factuur-PDF toont niet alle regels", category: "INVOICE", status: "TRIAGED" }, // prettier-ignore
      { fk: "peter", subject: "Hoe verifieer ik mijn identiteit?", category: "ACCOUNT", status: "AUTO_ANSWERED" }, // prettier-ignore
      { fk: "youssef", subject: "Vraag over de zelfstandigenaftrek", category: "OTHER", status: "ESCALATED" }, // prettier-ignore
      { fk: "fatima", subject: "ORT-toeslag klopt niet op mijn urenstaat", category: "INVOICE", status: "RESOLVED" }, // prettier-ignore
    ];
    for (const t of ticketSpecs) {
      const resolved = t.status === "RESOLVED";
      await prisma.supportTicket.create({
        data: {
          userId: uid[t.fk]!,
          subject: t.subject,
          category: t.category,
          status: t.status,
          priority: "NORMAL",
          resolvedAt: resolved ? daysFromNow(-1) : null,
          messages: {
            create: [
              { authorId: uid[t.fk]!, authorKind: "USER", body: t.subject },
              ...(resolved
                ? [
                    {
                      authorId: null,
                      authorKind: "ASSISTANT",
                      body: "Je urenstaat is herberekend; de ORT-toeslag staat nu correct op de factuur.",
                    },
                  ]
                : []),
            ],
          },
        },
      });
    }
  }

  // --- Gesprekken (berichten) — realistische threads ZZP'er <-> opdrachtgever, breed over de
  //     bedrijven en lifecycle-stages. Idempotent op conversation-id (nested participants/messages
  //     draaien alleen in de create-tak). lastReadAt is zo gezet dat een deel van de gesprekken een
  //     ongelezen-badge toont bij de tegenpartij van de laatste afzender (zie `badge`). ---
  for (const c of SEED_CONVERSATIONS) {
    const freelancerUserId = uid[c.fk];
    const clientUserId = clientUserIdByKey[c.ck];
    if (!freelancerUserId || !clientUserId) continue;
    // Strikt oplopende tijdstempels (oudste eerst); de minuut-offset breekt gelijke dagen.
    const ordered = [...c.messages].sort((a, b) => b.daysAgo - a.daysAgo);
    const msgs = ordered.map((m, idx) => ({
      senderId: m.from === "freelancer" ? freelancerUserId : clientUserId,
      body: m.body,
      createdAt: new Date(daysFromNow(-m.daysAgo).getTime() + idx * 60_000),
    }));
    const lastTime = msgs[msgs.length - 1]!.createdAt;
    const lastFrom = ordered[ordered.length - 1]!.from;
    // De ongelezen-badge ligt bij de tegenpartij van de laatste afzender (alleen als badge=true).
    const unread = c.badge ? (lastFrom === "client" ? "freelancer" : "client") : "none";
    const justBefore = new Date(lastTime.getTime() - 1);
    const freelancerRead = unread === "freelancer" ? justBefore : lastTime;
    const clientRead = unread === "client" ? justBefore : lastTime;
    await prisma.conversation.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        jobId: c.jobId,
        participants: {
          create: [
            { userId: freelancerUserId, lastReadAt: freelancerRead },
            { userId: clientUserId, lastReadAt: clientRead },
          ],
        },
        messages: {
          create: msgs.map((m) => ({
            senderId: m.senderId,
            body: m.body,
            createdAt: m.createdAt,
          })),
        },
      },
    });
  }

  // --- Extra support-tickets (breedte: alle categorieën + statussen, ZZP'ers én opdrachtgevers,
  //     met meerdere-berichten-threads incl. helpdeskmedewerker-antwoorden). Idempotent op id,
  //     naast de basis-tickets hierboven. ---
  const adminForTickets = await prisma.user.findUnique({
    where: { email: "admin@zzp-platform.local" },
    select: { id: true },
  });
  for (const t of SEED_TICKETS) {
    const ownerId = t.role === "client" ? clientUserIdByKey[t.owner] : uid[t.owner];
    if (!ownerId) continue;
    const escalated = t.status === "ESCALATED";
    const resolved = t.status === "RESOLVED";
    const ordered = [...t.messages].sort((a, b) => b.daysAgo - a.daysAgo);
    const firstCreatedAt = ordered.length ? daysFromNow(-ordered[0]!.daysAgo) : daysFromNow(-1);
    // USER = de aanvrager, AGENT = de helpdeskmedewerker (admin), ASSISTANT = systeem (geen auteur).
    const authorIdFor = (kind: string) =>
      kind === "USER" ? ownerId : kind === "AGENT" ? (adminForTickets?.id ?? null) : null;
    await prisma.supportTicket.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        userId: ownerId,
        subject: t.subject,
        category: t.category,
        status: t.status,
        priority: escalated ? "HIGH" : "NORMAL",
        assignedToId: escalated ? (adminForTickets?.id ?? null) : null,
        autoAttempts: t.messages.some((m) => m.authorKind === "ASSISTANT") ? 1 : 0,
        resolvedAt: resolved ? daysFromNow(-1) : null,
        createdAt: firstCreatedAt,
        messages: {
          create: ordered.map((m, idx) => ({
            authorId: authorIdFor(m.authorKind),
            authorKind: m.authorKind,
            body: m.body,
            createdAt: new Date(daysFromNow(-m.daysAgo).getTime() + idx * 60_000),
          })),
        },
      },
    });
  }

  // --- Beschikbaarheid-vensters — elke ZZP'er een realistische agenda, zodat /beschikbaarheid en de
  //     availability-filters (kandidaten/zoeken) in de demo gevuld zijn. Idempotent: alleen bij lege
  //     tabel, dus bestaande databases worden eenmalig aangevuld zonder duplicaten. ---
  if ((await prisma.availabilityWindow.count()) === 0) {
    let w = 0;
    for (const profileId of Object.values(pid)) {
      w++;
      const variant = w % 3;
      // Lopende beschikbaarheid (altijd) + een tweede, gevarieerde periode.
      await prisma.availabilityWindow.create({
        data: {
          freelancerProfileId: profileId,
          startDate: daysFromNow(-7),
          endDate: daysFromNow(60),
          type: "AVAILABLE",
          hoursPerWeek: 32 + variant * 4,
          note: "Open voor nieuwe opdrachten",
        },
      });
      const second =
        variant === 0
          ? { start: 60, end: 74, type: "UNAVAILABLE", hours: null, note: "Vakantie" }
          : variant === 1
            ? { start: 21, end: 90, type: "LIMITED", hours: 16, note: "Naast een lopende opdracht" }
            : {
                start: 90,
                end: 150,
                type: "AVAILABLE",
                hours: 40,
                note: "Volledig beschikbaar komend kwartaal",
              };
      await prisma.availabilityWindow.create({
        data: {
          freelancerProfileId: profileId,
          startDate: daysFromNow(second.start),
          endDate: daysFromNow(second.end),
          type: second.type,
          hoursPerWeek: second.hours,
          note: second.note,
        },
      });
    }
  }

  // --- Abonnementen — opdrachtgevers met meerdere opdrachten staan op een betaald plan (consistent
  //     met hun aantal opdrachten; FREE staat maar 1 opdracht toe) plus het vlaggenschip-ZZP-account.
  //     Zo toont /abonnement een actief plan i.p.v. overal de gratis-default. Idempotent op userId. ---
  if ((await prisma.subscription.count()) === 0) {
    const planRows = await prisma.plan.findMany({ select: { id: true, key: true } });
    const planIdByKey = Object.fromEntries(planRows.map((pl) => [pl.key, pl.id]));
    const subSpecs: { email: string; plan: string }[] = [
      { email: "opdrachtgever@zzp-platform.local", plan: "BUSINESS" },
      { email: "zorggroep@zzp-platform.local", plan: "BUSINESS" },
      { email: "ggz@zzp-platform.local", plan: "PRO" },
      { email: "ghz@zzp-platform.local", plan: "PRO" },
      { email: "ziekenhuis@zzp-platform.local", plan: "PRO" },
      { email: "zzp@zzp-platform.local", plan: "PRO" },
    ];
    for (const s of subSpecs) {
      const user = await prisma.user.findUnique({
        where: { email: s.email },
        select: { id: true },
      });
      const planId = planIdByKey[s.plan];
      if (!user || !planId) continue;
      await prisma.subscription.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          planId,
          status: "ACTIVE",
          providerRef: "demo-subscription",
          currentPeriodEnd: daysFromNow(30),
        },
      });
    }
  }

  // Nu alle demo-koppelingen naar de zorg-referentiedata zijn gereconcileerd, kunnen de
  // achtergebleven ICT-/bouw-/logistiekrijen weg (alleen als er niets meer aan hangt).
  await pruneLegacyReferenceData();

  const [
    collabCount,
    invoiceCount,
    ledgerCount,
    ticketCount,
    conversationCount,
    availabilityCount,
    subscriptionCount,
  ] = await Promise.all([
    prisma.collaboration.count(),
    prisma.invoice.count(),
    prisma.administrationEntry.count(),
    prisma.supportTicket.count(),
    prisma.conversation.count(),
    prisma.availabilityWindow.count(),
    prisma.subscription.count(),
  ]);
  await seedFranchise(prisma, passwordHash);
  await seedAcademy(prisma, uid["sanne"]);

  // ZZP-platformabonnement: registreer de maandbijdragen voor de demo (huidige + 2 vorige maanden),
  // zodat het abonnement-overzicht gevuld is. Idempotent via de unieke (userId, period)-index.
  const membershipNow = new Date();
  for (let back = 0; back < 3; back++) {
    await runZzpMembershipTask({
      month: new Date(
        Date.UTC(membershipNow.getUTCFullYear(), membershipNow.getUTCMonth() - back, 1),
      ),
    });
  }

  // Flexpool-demo: de primaire opdrachtgever (Zorgcentrum Jansen) houdt een poule van bewezen
  // ZZP'ers bij. Idempotent via de unieke (companyId, freelancerProfileId)-index.
  const poolCompanyId = companyIdByKey["jansen"];
  if (poolCompanyId) {
    const poolProfiles = await prisma.freelancerProfile.findMany({
      select: { id: true },
      orderBy: { createdAt: "asc" },
      take: 3,
    });
    const poolNotes = [
      "Vaste kracht — flexibel inzetbaar.",
      "Sterke beoordelingen, snel beschikbaar.",
    ];
    for (const [i, p] of poolProfiles.entries()) {
      await prisma.favoriteFreelancer.upsert({
        where: {
          companyId_freelancerProfileId: { companyId: poolCompanyId, freelancerProfileId: p.id },
        },
        update: {},
        create: { companyId: poolCompanyId, freelancerProfileId: p.id, note: poolNotes[i] ?? null },
      });
    }
  }

  console.log("Seed klaar. Demo-accounts (wachtwoord: %s):", DEMO_PASSWORD);
  console.log("  admin@zzp-platform.local          (ADMIN)");
  console.log("  zzp@zzp-platform.local            (FREELANCER — Sanne)");
  console.log("  opdrachtgever@zzp-platform.local  (CLIENT — Zorgcentrum Jansen)");
  console.log("  franchise@zzp-platform.local      (FRANCHISER — Zorgbemiddeling Noord)");
  console.log(
    "Cascade via echte commands: %d samenwerkingen, %d facturen, %d grootboekregels, %d support-tickets, %d gesprekken, %d beschikbaarheid-vensters, %d abonnementen.",
    collabCount,
    invoiceCount,
    ledgerCount,
    ticketCount,
    conversationCount,
    availabilityCount,
    subscriptionCount,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
