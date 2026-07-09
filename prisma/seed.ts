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

/**
 * Maakt bij go-live een échte beheerder aan uit env (geen demo-wachtwoord), maar alleen als die
 * via BOOTSTRAP_ADMIN_EMAIL/PASSWORD is geconfigureerd én er nog geen ADMIN bestaat. mustChangePassword
 * dwingt een eigen wachtwoord af bij de eerste login. Zo kan de eerste admin de CSV-import doen
 * zonder dat er ooit een hardgecodeerd demo-wachtwoord in productie staat.
 */
async function bootstrapAdminIfConfigured() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !password) return;
  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (existingAdmin) return;
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      name: "Beheerder",
      role: "ADMIN",
      status: "ACTIVE",
      passwordHash,
      mustChangePassword: true,
    },
  });
  console.log("[seed] Bootstrap-admin aangemaakt voor %s (wachtwoordwijziging vereist).", email);
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

  // --- Referentiedata: branches & skills ---
  const industries = [
    { name: "ICT", slug: "ict" },
    { name: "Bouw", slug: "bouw" },
    { name: "Zorg", slug: "zorg" },
    { name: "Logistiek", slug: "logistiek" },
  ];
  for (const ind of industries) {
    await prisma.industry.upsert({
      where: { slug: ind.slug },
      update: { name: ind.name },
      create: ind,
    });
  }
  const skills: [string, string][] = [
    ["React", "react"],
    ["TypeScript", "typescript"],
    ["Node.js", "nodejs"],
    ["Python", "python"],
    ["AWS", "aws"],
    ["Scrum", "scrum"],
    ["Projectmanagement", "projectmanagement"],
    ["Elektrotechniek", "elektrotechniek"],
    ["VCA", "vca"],
    ["Verpleegkunde", "verpleegkunde"],
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
      industry: "zorg",
      skills: ["verpleegkunde"],
      identityVerified: true,
      completeness: 100,
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
      headline: "Backend Developer (Node.js)",
      bio: "Bouwt schaalbare API's en integraties. Per direct beschikbaar.",
      rate: 78,
      availability: "AVAILABLE",
      location: "Utrecht",
      workMode: "REMOTE",
      industry: "ict",
      skills: ["nodejs", "typescript", "aws"],
      identityVerified: true,
      completeness: 100,
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
          title: "WO Informatica",
          issuer: "Universiteit Utrecht",
          status: "VERIFIED",
        },
      ],
    },
    {
      key: "lisa",
      email: "lisa@zzp-platform.local",
      name: "Lisa Smit",
      headline: "Projectmanager ICT",
      bio: "Leidt multidisciplinaire teams; PMP-gecertificeerd.",
      rate: 95,
      availability: "LIMITED",
      location: "Rotterdam",
      workMode: "HYBRID",
      industry: "ict",
      skills: ["projectmanagement", "scrum"],
      identityVerified: false,
      completeness: 90,
      creds: [
        {
          type: "CERTIFICATE",
          title: "PMP — Project Management Professional",
          issuer: "PMI",
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
      headline: "Elektromonteur",
      bio: "Allround monteur, VCA-VOL, werkt veilig en snel.",
      rate: 55,
      availability: "AVAILABLE",
      location: "Eindhoven",
      workMode: "ONSITE",
      industry: "bouw",
      skills: ["elektrotechniek", "vca"],
      identityVerified: true,
      completeness: 100,
      creds: [
        {
          type: "CERTIFICATE",
          title: "VCA VOL",
          issuer: "VCA Infra",
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
      rate: 52,
      availability: "AVAILABLE",
      location: "Den Haag",
      workMode: "ONSITE",
      industry: "zorg",
      skills: ["verpleegkunde"],
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
      headline: "Logistiek planner",
      bio: "Plant en optimaliseert transport- en magazijnstromen.",
      rate: 60,
      availability: "UNAVAILABLE",
      location: "Tilburg",
      workMode: "HYBRID",
      industry: "logistiek",
      skills: ["projectmanagement"],
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
      headline: "Frontend Developer",
      bio: "React-specialist met oog voor design en performance.",
      rate: 72,
      availability: "AVAILABLE",
      location: "Amsterdam",
      workMode: "REMOTE",
      industry: "ict",
      skills: ["react", "typescript"],
      identityVerified: false,
      completeness: 95,
      creds: [
        {
          type: "DIPLOMA",
          title: "HBO Communication & Multimedia Design",
          issuer: "Hogeschool Rotterdam",
          status: "SUBMITTED",
        },
      ],
    },
    // --- Extra ZZP'ers (breedte) ---
    { key: "kevin", email: "kevin@zzp-platform.local", name: "Kevin Mol", headline: "Python Developer / Data", bio: "Bouwt data-pipelines en ML-features.", rate: 82, availability: "AVAILABLE", location: "Amsterdam", workMode: "REMOTE", industry: "ict", skills: ["python", "aws"], identityVerified: true, completeness: 100, creds: [{ type: "VOG", title: "VOG", issuer: "Justis", status: "VERIFIED", expiresInDays: 250 }] }, // prettier-ignore
    { key: "nadia", email: "nadia@zzp-platform.local", name: "Nadia Haddad", headline: "Scrum Master", bio: "Faciliteert teams; gecertificeerd PSM II.", rate: 88, availability: "LIMITED", location: "Rotterdam", workMode: "HYBRID", industry: "ict", skills: ["scrum", "projectmanagement"], identityVerified: false, completeness: 85, creds: [{ type: "CERTIFICATE", title: "PSM II", issuer: "Scrum.org", status: "SUBMITTED" }, { type: "VOG", title: "VOG", issuer: "Justis", status: "VERIFIED", expiresInDays: 20 }] }, // prettier-ignore
    { key: "tom", email: "tom@zzp-platform.local", name: "Tom Bakhuis", headline: "Fullstack Developer", bio: "React + Node, end-to-end features.", rate: 80, availability: "AVAILABLE", location: "Eindhoven", workMode: "REMOTE", industry: "ict", skills: ["react", "nodejs", "typescript"], identityVerified: true, completeness: 95, creds: [{ type: "VOG", title: "VOG", issuer: "Justis", status: "VERIFIED", expiresInDays: 500 }, { type: "DIPLOMA", title: "WO Technische Informatica", issuer: "TU Eindhoven", status: "VERIFIED" }] }, // prettier-ignore
    { key: "emma", email: "emma@zzp-platform.local", name: "Emma de Boer", headline: "Verpleegkundige (IC)", bio: "IC-verpleegkundige, BIG-geregistreerd, nachtdiensten.", rate: 56, availability: "AVAILABLE", location: "Groningen", workMode: "ONSITE", maxTravelMinutes: 30, industry: "zorg", skills: ["verpleegkunde"], identityVerified: true, completeness: 100, creds: [{ type: "LICENSE", title: "BIG-registratie Verpleegkundige", issuer: "CIBG", status: "VERIFIED", expiresInDays: 800 }, { type: "VOG", title: "VOG", issuer: "Justis", status: "VERIFIED", expiresInDays: 200 }] }, // prettier-ignore
    { key: "ahmed", email: "ahmed@zzp-platform.local", name: "Ahmed Yilmaz", headline: "Installatiemonteur", bio: "Werktuigbouw + elektra, VCA-VOL.", rate: 58, availability: "AVAILABLE", location: "Tilburg", workMode: "ONSITE", maxTravelMinutes: 75, industry: "bouw", skills: ["elektrotechniek", "vca"], identityVerified: false, completeness: 80, creds: [{ type: "CERTIFICATE", title: "VCA VOL", issuer: "VCA Infra", status: "VERIFIED", expiresInDays: 400 }, { type: "VOG", title: "VOG", issuer: "Justis", status: "REJECTED", reason: "Document onleesbaar — upload opnieuw." }] }, // prettier-ignore
    { key: "julia", email: "julia@zzp-platform.local", name: "Julia Vermeer", headline: "Logistiek consultant", bio: "Optimaliseert warehouse- en transportprocessen.", rate: 72, availability: "LIMITED", location: "Venlo", workMode: "HYBRID", industry: "logistiek", skills: ["projectmanagement"], identityVerified: true, completeness: 90, creds: [{ type: "VOG", title: "VOG", issuer: "Justis", status: "VERIFIED", expiresInDays: 350 }] }, // prettier-ignore
    { key: "bram", email: "bram@zzp-platform.local", name: "Bram Koster", headline: "DevOps Engineer", bio: "Kubernetes, CI/CD, observability.", rate: 95, availability: "AVAILABLE", location: "Utrecht", workMode: "REMOTE", industry: "ict", skills: ["aws", "nodejs"], identityVerified: true, completeness: 100, creds: [{ type: "CERTIFICATE", title: "AWS Solutions Architect", issuer: "AWS", status: "VERIFIED", expiresInDays: 600 }, { type: "VOG", title: "VOG", issuer: "Justis", status: "SUBMITTED" }] }, // prettier-ignore
    { key: "sofie", email: "sofie@zzp-platform.local", name: "Sofie Willems", headline: "Frontend Developer", bio: "Toegankelijke UI's met React + design-systemen.", rate: 76, availability: "AVAILABLE", location: "Den Bosch", workMode: "HYBRID", industry: "ict", skills: ["react", "typescript"], identityVerified: false, completeness: 75, creds: [{ type: "DIPLOMA", title: "HBO Software Engineering", issuer: "Fontys", status: "SUBMITTED" }] }, // prettier-ignore
    { key: "rik", email: "rik@zzp-platform.local", name: "Rik Plomp", headline: "Projectmanager Bouw", bio: "Leidt bouwprojecten van ontwerp tot oplevering.", rate: 90, availability: "UNAVAILABLE", location: "Zwolle", workMode: "ONSITE", industry: "bouw", skills: ["projectmanagement"], identityVerified: true, completeness: 95, creds: [{ type: "CERTIFICATE", title: "VCA VOL", issuer: "VCA Infra", status: "EXPIRED" }, { type: "VOG", title: "VOG", issuer: "Justis", status: "VERIFIED", expiresInDays: 120 }] }, // prettier-ignore
    { key: "iris", email: "iris@zzp-platform.local", name: "Iris Hendriks", headline: "Verzorgende IG", bio: "Thuiszorg en VVT, flexibel inzetbaar.", rate: 42, availability: "AVAILABLE", location: "Arnhem", workMode: "ONSITE", maxTravelMinutes: 25, industry: "zorg", skills: ["verpleegkunde"], identityVerified: true, completeness: 100, creds: [{ type: "DIPLOMA", title: "MBO Verzorgende IG", issuer: "Rijn IJssel", status: "VERIFIED" }, { type: "VOG", title: "VOG", issuer: "Justis", status: "VERIFIED", expiresInDays: 280 }] }, // prettier-ignore
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
          },
        },
      },
      include: { freelancerProfile: true },
    });
    const profileId = user.freelancerProfile!.id;
    pid[f.key] = profileId;
    uid[f.key] = user.id;
    for (const slug of f.skills) {
      await prisma.freelancerSkill.upsert({
        where: {
          freelancerProfileId_skillId: { freelancerProfileId: profileId, skillId: skillId[slug]! },
        },
        update: {},
        create: { freelancerProfileId: profileId, skillId: skillId[slug]! },
      });
    }
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
        // Titel/zichtbaarheid mogen convergeren naar de seed-definitie (puur referentie-display);
        // status/datums blijven met rust zodat runtime-eindtoestanden niet worden overschreven.
        update: { title: c.title },
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
  const companySpecs = [
    { key: "jansen", email: "opdrachtgever@zzp-platform.local", contact: "Mark Jansen", company: "Zorgcentrum Jansen", industry: "zorg", website: "https://zorgcentrumjansen.nl", location: "Utrecht", description: "Zorginstelling voor somatische zorg en wijkverpleging." }, // prettier-ignore
    { key: "zorggroep", email: "zorggroep@zzp-platform.local", contact: "Petra Mulder", company: "ZorgGroep Midden B.V.", industry: "zorg", website: "https://zorggroepmidden.nl", location: "Amersfoort", description: "Aanbieder van wijkverpleging en VVT-zorg." }, // prettier-ignore
    { key: "bouwpartners", email: "bouwpartners@zzp-platform.local", contact: "Henk de Wit", company: "BouwPartners Nederland", industry: "bouw", website: "https://bouwpartners.nl", location: "Zwolle", description: "Aannemer voor utiliteits- en woningbouw." }, // prettier-ignore
    { key: "logiflow", email: "logiflow@zzp-platform.local", contact: "Sandra Vos", company: "LogiFlow Logistics", industry: "logistiek", website: "https://logiflow.nl", location: "Venlo", description: "Warehousing en transportoptimalisatie." }, // prettier-ignore
    { key: "datic", email: "datic@zzp-platform.local", contact: "Erik Brand", company: "Datic Solutions", industry: "ict", website: "https://datic.nl", location: "Eindhoven", description: "Data- en cloudconsultancy." }, // prettier-ignore
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
      title: "Verpleegkundige (somatiek)",
      description:
        "Inzet op een somatische afdeling; dag- en avonddiensten. BIG-registratie en VOG vereist.",
      status: "PUBLISHED",
      workMode: "ONSITE",
      rateMin: 45,
      rateMax: 62,
      location: "Utrecht",
      industry: "zorg",
      req: ["verpleegkunde"],
      reqCreds: ["VOG"],
      dbaRisk: "LAAG",
    },
    {
      id: "job-2",
      title: "Node.js Backend Developer",
      description: "Ontwerp en bouw robuuste API's en integraties voor een langlopend project.",
      status: "PUBLISHED",
      workMode: "REMOTE",
      rateMin: 75,
      rateMax: 100,
      industry: "ict",
      req: ["nodejs"],
      opt: ["typescript", "aws"],
      company: "datic",
    },
    {
      id: "job-3",
      title: "Projectmanager ICT",
      description: "Leid een multidisciplinair team voor een overheidsopdracht.",
      status: "PUBLISHED",
      workMode: "ONSITE",
      rateMin: 90,
      rateMax: 120,
      location: "Den Haag",
      industry: "ict",
      req: ["projectmanagement"],
      dbaRisk: "MIDDEN",
      company: "datic",
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
      industry: "zorg",
      req: ["verpleegkunde"],
      reqCreds: ["LICENSE", "VOG"],
      dbaRisk: "MIDDEN",
    },
    {
      id: "job-5",
      title: "Elektromonteur",
      description: "Installatie- en onderhoudswerk op locatie. VCA vereist.",
      status: "PUBLISHED",
      workMode: "ONSITE",
      rateMin: 50,
      rateMax: 70,
      location: "Eindhoven",
      industry: "bouw",
      req: ["elektrotechniek"],
      reqCreds: ["VOG"],
      company: "bouwpartners",
    },
    {
      id: "job-6",
      title: "DevOps Engineer",
      description: "Beheer en automatiseer onze cloudinfrastructuur (AWS).",
      status: "PUBLISHED",
      workMode: "REMOTE",
      rateMin: 85,
      rateMax: 115,
      industry: "ict",
      req: ["aws"],
      opt: ["python", "nodejs"],
      company: "datic",
    },
    {
      id: "job-7",
      title: "Frontend Developer",
      description: "Concept-opdracht — nog niet gepubliceerd.",
      status: "DRAFT",
      workMode: "HYBRID",
      rateMin: 70,
      rateMax: 95,
      location: "Utrecht",
      industry: "ict",
      req: ["react"],
      company: "datic",
    },
    // --- Extra opdrachten, verdeeld over de bedrijven (breedte) ---
    { id: "job-8", title: "Wijkverpleegkundige", description: "Wijkverpleging in de regio Amersfoort; flexibele diensten.", status: "PUBLISHED", workMode: "ONSITE", rateMin: 45, rateMax: 62, location: "Amersfoort", industry: "zorg", req: ["verpleegkunde"], reqCreds: ["LICENSE", "VOG"], dbaRisk: "MIDDEN", company: "zorggroep" }, // prettier-ignore
    { id: "job-9", title: "Verzorgende IG (VVT)", description: "VVT-zorg met avond- en nachtdiensten (ORT van toepassing).", status: "PUBLISHED", workMode: "ONSITE", rateMin: 38, rateMax: 50, location: "Amersfoort", industry: "zorg", req: ["verpleegkunde"], reqCreds: ["VOG"], company: "zorggroep" }, // prettier-ignore
    { id: "job-10", title: "Elektromonteur utiliteit", description: "Installatiewerk in utiliteitsbouw; VCA vereist.", status: "PUBLISHED", workMode: "ONSITE", rateMin: 48, rateMax: 68, location: "Zwolle", industry: "bouw", req: ["elektrotechniek", "vca"], reqCreds: ["VOG"], company: "bouwpartners" }, // prettier-ignore
    { id: "job-11", title: "Projectleider Bouw", description: "Leid bouwprojecten van ontwerp tot oplevering.", status: "PUBLISHED", workMode: "HYBRID", rateMin: 80, rateMax: 110, location: "Zwolle", industry: "bouw", req: ["projectmanagement"], dbaRisk: "MIDDEN", company: "bouwpartners" }, // prettier-ignore
    { id: "job-12", title: "Logistiek Planner", description: "Plan transport- en magazijnstromen voor een groeiend netwerk.", status: "PUBLISHED", workMode: "HYBRID", rateMin: 55, rateMax: 80, location: "Venlo", industry: "logistiek", req: ["projectmanagement"], company: "logiflow" }, // prettier-ignore
    { id: "job-13", title: "Supply Chain Analist", description: "Data-analyse van de keten; Python + dashboards.", status: "PUBLISHED", workMode: "REMOTE", rateMin: 65, rateMax: 90, industry: "logistiek", req: ["python"], opt: ["aws"], company: "logiflow" }, // prettier-ignore
    { id: "job-14", title: "Data Engineer", description: "Bouw data-pipelines op AWS voor onze klanten.", status: "PUBLISHED", workMode: "REMOTE", rateMin: 80, rateMax: 110, industry: "ict", req: ["python", "aws"], reqCreds: ["VOG"], company: "datic" }, // prettier-ignore
    { id: "job-15", title: "Cloud Engineer", description: "Beheer en automatiseer cloudinfrastructuur (AWS/Node).", status: "PUBLISHED", workMode: "REMOTE", rateMin: 85, rateMax: 115, industry: "ict", req: ["aws", "nodejs"], company: "datic" }, // prettier-ignore
    { id: "job-16", title: "Fullstack Developer", description: "End-to-end features in React en Node voor ons platform.", status: "PUBLISHED", workMode: "HYBRID", rateMin: 75, rateMax: 100, location: "Utrecht", industry: "ict", req: ["react", "nodejs"], opt: ["typescript"], reqCreds: ["VOG"], company: "datic" }, // prettier-ignore
    { id: "job-17", title: "Scrum Master", description: "Faciliteer twee teams; verbeter het ontwikkelproces.", status: "PUBLISHED", workMode: "HYBRID", rateMin: 80, rateMax: 100, location: "Utrecht", industry: "ict", req: ["scrum"], company: "datic" }, // prettier-ignore
    { id: "job-18", title: "Frontend Developer", description: "Toegankelijke UI's met een design-systeem.", status: "PUBLISHED", workMode: "REMOTE", rateMin: 70, rateMax: 95, industry: "ict", req: ["react", "typescript"], company: "datic" }, // prettier-ignore
    { id: "job-19", title: "Installatiemonteur", description: "Werktuigbouw en elektra op locatie; VCA vereist.", status: "PUBLISHED", workMode: "ONSITE", rateMin: 46, rateMax: 64, location: "Tilburg", industry: "bouw", req: ["elektrotechniek"], reqCreds: ["VOG"], company: "bouwpartners" }, // prettier-ignore
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
      motivation: "React-specialist; help graag de frontend-architectuur opzetten.",
      rate: 80,
      score: 76,
      compliance: snap("NON_COMPLIANT", [], ["VOG"]),
    },
    {
      id: "app-3",
      job: "job-2",
      fk: "youssef",
      status: "ACCEPTED",
      motivation: "Ervaren met schaalbare Node.js-API's en AWS.",
      rate: 90,
      score: 90,
      compliance: snap("COMPLIANT"),
    },
    {
      id: "app-4",
      job: "job-3",
      fk: "lisa",
      status: "NEW",
      motivation: "PMP-gecertificeerd; ruime ervaring met overheidsprojecten.",
      rate: 110,
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
      motivation: "VCA-VOL, allround monteur, per direct beschikbaar.",
      rate: 60,
      score: 91,
      compliance: snap("COMPLIANT", ["VOG"]),
    },
    {
      id: "app-8",
      job: "job-3",
      fk: "peter",
      status: "REJECTED",
      motivation: "Ervaren planner, wil graag de overstap naar ICT-projecten maken.",
      rate: 85,
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
      },
    });
  }

  // --- Bewaarde opdrachten (Sanne) — bookmarks om er later op terug te komen ---
  // Twee open opdrachten waar ze nog niet op reageerde + één DRAFT (job-7) zodat het
  // overzicht óók de "niet meer beschikbaar"-sectie demonstreert.
  for (const jobId of ["job-13", "job-18", "job-7"]) {
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
  if ((await prisma.collaboration.count()) < RICH_COLLAB_TARGET) {
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
      { fk: "emma", job: "job-8", rate: 56, target: "PAID", ort: true },
      { fk: "iris", job: "job-9", rate: 42, target: "INVOICE_APPROVED", ort: true },
      { fk: "ahmed", job: "job-10", rate: 58, target: "PAID" },
      { fk: "rik", job: "job-11", rate: 90, target: "ACTIVE", endInDays: 14 },
      { fk: "julia", job: "job-12", rate: 72, target: "INVOICE_SUBMITTED" },
      { fk: "kevin", job: "job-13", rate: 82, target: "PERF_APPROVED" },
      { fk: "bram", job: "job-14", rate: 95, target: "PAID" },
      { fk: "tom", job: "job-15", rate: 88, target: "PERF_SUBMITTED" },
      { fk: "sofie", job: "job-16", rate: 76, target: "PERF_REJECTED" },
      { fk: "nadia", job: "job-17", rate: 88, target: "ACTIVE" },
      { fk: "youssef", job: "job-18", rate: 90, target: "PROPOSED" },
      { fk: "daan", job: "job-19", rate: 60, target: "PERF_APPROVED" },
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
        // certificaateisen, dan kan de samenwerking niet starten. Laat 'm als PROPOSED staan —
        // dat demonstreert juist de plaatsing-gate (bv. ahmed met een afgewezen VOG).
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
        description: s.ort ? "Avond/nachtdiensten somatische afdeling" : "Werkzaamheden sprint",
      });
      await submitPerformance(fActor, perfId);

      if (s.target === "PERF_REJECTED") {
        await rejectPerformance(
          cActor,
          perfId,
          "Graag de uren per dag specificeren en opnieuw indienen.",
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
            occurredAt: e.occurredAt,
          },
          create: {
            id: e.id,
            userId: sanneUserId,
            description: e.description,
            category: e.category,
            netCents: e.netCents,
            vatCents: e.vatCents,
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
    { where: { jobId: "job-17" }, days: '["WED","THU","FRI"]' }, // Nadia — actief
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
      { email: "bouwpartners@zzp-platform.local", plan: "PRO" },
      { email: "logiflow@zzp-platform.local", plan: "PRO" },
      { email: "datic@zzp-platform.local", plan: "PRO" },
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
