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
} from "@/lib/cascade/commands";

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
    industry: string;
    skills: string[];
    identityVerified: boolean;
    completeness: number;
    creds: Cred[];
  };
  const freelancers: Freelancer[] = [
    {
      key: "sanne",
      email: "zzp@zzp-platform.local",
      name: "Sanne de Vries",
      headline: "Senior Frontend Developer",
      bio: "Tien jaar ervaring met React en TypeScript; bouwt toegankelijke, geteste interfaces.",
      rate: 85,
      availability: "AVAILABLE",
      location: "Amsterdam",
      workMode: "HYBRID",
      industry: "ict",
      skills: ["react", "typescript"],
      identityVerified: true,
      completeness: 100,
      creds: [
        {
          type: "VOG",
          title: "VOG Verklaring Omtrent Gedrag",
          issuer: "Justis",
          status: "VERIFIED",
          expiresInDays: 300,
        },
        {
          type: "DIPLOMA",
          title: "HBO Informatica",
          issuer: "Hogeschool van Amsterdam",
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
          title: "VOG Verklaring Omtrent Gedrag",
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
          title: "VOG Verklaring Omtrent Gedrag",
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
          title: "VOG Verklaring Omtrent Gedrag",
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
          title: "VOG Verklaring Omtrent Gedrag",
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
          title: "VOG Verklaring Omtrent Gedrag",
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
  ];

  const pid: Record<string, string> = {};
  const uid: Record<string, string> = {};
  for (const f of freelancers) {
    const idFields = f.identityVerified
      ? { identityVerifiedAt: daysFromNow(-40), verifiedLegalName: f.name }
      : {};
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
            languages: JSON.stringify(["nl", "en"]),
            visibility: "PUBLIC",
            completeness: f.completeness,
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
        update: {},
        create: {
          id,
          freelancerProfileId: profileId,
          type: c.type,
          title: c.title,
          issuer: c.issuer,
          status: c.status,
          visibility: "PUBLIC",
          issuedAt: daysFromNow(-400),
          expiresAt: c.expiresInDays ? daysFromNow(c.expiresInDays) : null,
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
      email: "opdrachtgever@zzp-platform.local",
      name: "Mark Jansen",
      role: "CLIENT",
      status: "ACTIVE",
      emailVerified: new Date(),
      passwordHash,
      company: {
        create: {
          name: "Jansen Software B.V.",
          industryId: industryId.ict,
          description: "Productbureau voor web- en mobiele applicaties in zorg en overheid.",
          website: "https://jansensoftware.nl",
          location: "Utrecht",
        },
      },
    },
    include: { company: true },
  });
  const companyId = client.company!.id;

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
  };
  const jobs: Job[] = [
    {
      id: "job-1",
      title: "Senior React Developer",
      description:
        "Bouw mee aan ons zorgplatform. Focus op toegankelijkheid, kwaliteit en geteste code.",
      status: "PUBLISHED",
      workMode: "HYBRID",
      rateMin: 80,
      rateMax: 110,
      location: "Utrecht",
      industry: "ict",
      req: ["react", "typescript"],
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
    },
    {
      id: "job-7",
      title: "Frontend Developer (concept)",
      description: "Concept-opdracht — nog niet gepubliceerd.",
      status: "DRAFT",
      workMode: "HYBRID",
      rateMin: 70,
      rateMax: 95,
      location: "Utrecht",
      industry: "ict",
      req: ["react"],
    },
  ];
  const now = new Date();
  for (const j of jobs) {
    const jobSkills = [
      ...j.req.map((s) => ({ skillId: skillId[s]!, required: true })),
      ...(j.opt ?? []).map((s) => ({ skillId: skillId[s]!, required: false })),
    ];
    await prisma.job.upsert({
      where: { id: j.id },
      update: {},
      create: {
        id: j.id,
        companyId,
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
  };
  const apps: App[] = [
    {
      id: "app-1",
      job: "job-1",
      fk: "sanne",
      status: "NEW",
      motivation: "Tien jaar React-ervaring; lever graag toegankelijke, geteste interfaces.",
      rate: 95,
      score: 92,
      compliance: snap("COMPLIANT", ["VOG"]),
    },
    {
      id: "app-2",
      job: "job-1",
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
      job: "job-3",
      fk: "sanne",
      status: "ACCEPTED",
      motivation: "Sterk in stakeholdermanagement en oplevering.",
      rate: 105,
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
      },
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
  const RICH_COLLAB_TARGET = 12;
  if ((await prisma.collaboration.count()) < RICH_COLLAB_TARGET) {
    // Oude/onvolledige cascade-demo opruimen in FK-veilige volgorde (children eerst).
    await prisma.administrationEntry.deleteMany({});
    await prisma.invoiceLine.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.performance.deleteMany({});
    await prisma.collaboration.deleteMany({});
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

    // Elk paar (fk, job) is uniek én niet in de foundation-reacties (unique constraint
    // jobId+freelancerId). Eén collaboration per applicatie (applicationId @unique).
    const scenarios: { fk: string; job: string; rate: number; target: Target; ort?: boolean }[] = [
      { fk: "youssef", job: "job-6", rate: 90, target: "PAID" },
      { fk: "lisa", job: "job-1", rate: 105, target: "PAID" },
      { fk: "fatima", job: "job-6", rate: 54, target: "PAID", ort: true },
      { fk: "sanne", job: "job-2", rate: 100, target: "INVOICE_APPROVED" },
      { fk: "peter", job: "job-6", rate: 80, target: "INVOICE_SUBMITTED" },
      { fk: "daan", job: "job-2", rate: 70, target: "PERF_APPROVED" },
      { fk: "fatima", job: "job-2", rate: 58, target: "PERF_APPROVED", ort: true },
      { fk: "youssef", job: "job-3", rate: 95, target: "PERF_SUBMITTED" },
      { fk: "fatima", job: "job-3", rate: 60, target: "PERF_REJECTED" },
      { fk: "sanne", job: "job-5", rate: 88, target: "ACTIVE" },
      { fk: "lisa", job: "job-5", rate: 92, target: "ACTIVE" },
      { fk: "peter", job: "job-1", rate: 75, target: "PROPOSED" },
    ];

    let i = 0;
    for (const s of scenarios) {
      i++;
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
          jobId: s.job,
          applicationId: application.id,
          freelancerId: pid[s.fk]!,
          companyId,
          status: "PROPOSED",
          contractStatus: "DRAFT",
          rate: s.rate,
          startDate: daysFromNow(-30 + i),
          ortProfile: s.ort ? "VVT" : null,
        },
      });
      const fActor = actorOf(uid[s.fk]!, "FREELANCER");
      const cActor = actorOf(client.id, "CLIENT");

      if (!reaches(s.target, "ACTIVE")) continue;
      await signContract(cActor, collab.id);
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

    // --- Support-tickets (helpdesk-wachtrij) ---
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

  const [collabCount, invoiceCount, ledgerCount, ticketCount] = await Promise.all([
    prisma.collaboration.count(),
    prisma.invoice.count(),
    prisma.administrationEntry.count(),
    prisma.supportTicket.count(),
  ]);
  console.log("Seed klaar. Demo-accounts (wachtwoord: %s):", DEMO_PASSWORD);
  console.log("  admin@zzp-platform.local          (ADMIN)");
  console.log("  zzp@zzp-platform.local            (FREELANCER — Sanne)");
  console.log("  opdrachtgever@zzp-platform.local  (CLIENT — Jansen Software)");
  console.log(
    "Cascade via echte commands: %d samenwerkingen, %d facturen, %d grootboekregels, %d support-tickets.",
    collabCount,
    invoiceCount,
    ledgerCount,
    ticketCount,
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
