import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

// Echte SQLite-proef: de aanbevelingskaart (detail/dashboard) mag niet stilhouden dat de ZZP'er
// nú niet inzetbaar is voor een voorgestelde opdracht. `recommendedJobs` moet daarom dezelfde harde
// compliance-chip meegeven als de browse-lijst (ontbrekend/verlopen/in-beoordeling vereist certificaat).
const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "recommendations-chip-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  return { directory, url, db: new PrismaClient({ datasourceUrl: url }) };
});
vi.mock("@/lib/db", () => ({ prisma: fixture.db }));

const db = fixture.db;

// Een opdracht zonder skill-eisen (volle skill-dekking), binnen tarief, remote: de niet-compliance
// componenten leveren 70 punten. Met één voldane én één openstaande eis (½ · 25 ≈ 13) komt elke
// variant comfortabel boven de aanbevelingsdrempel (70), zodat we puur de chip toetsen — niet de score.
const yesterday = () => new Date(Date.now() - 86_400_000);

beforeAll(async () => {
  const env: NodeJS.ProcessEnv = { ...process.env, DATABASE_URL: fixture.url };
  delete env.RUST_LOG;
  execFileSync(
    process.execPath,
    [
      "node_modules/prisma/build/index.js",
      "db",
      "push",
      "--skip-generate",
      "--schema",
      resolve("prisma/schema.prisma"),
    ],
    { env, timeout: 30_000, stdio: "pipe" },
  );

  await db.user.create({
    data: {
      id: "client",
      role: "CLIENT",
      email: "client@recommendations-chip.test",
      name: "Synthetic client",
      passwordHash: "synthetic-hash",
    },
  });
  await db.user.create({
    data: {
      id: "freelancer",
      role: "FREELANCER",
      email: "freelancer@recommendations-chip.test",
      name: "Synthetic freelancer",
      passwordHash: "synthetic-hash",
    },
  });
  await db.company.create({ data: { id: "company", userId: "client", name: "Synthetic company" } });
  await db.freelancerProfile.create({
    data: {
      id: "profile",
      userId: "freelancer",
      tenantId: null,
      workMode: "REMOTE",
      hourlyRate: 80,
    },
  });

  // Dossier: VOG geldig (voldaan), INSURANCE verlopen, CERTIFICATE in beoordeling, geen DIPLOMA.
  await db.credential.createMany({
    data: [
      {
        id: "cred-vog",
        freelancerProfileId: "profile",
        type: "VOG",
        title: "VOG",
        status: "VERIFIED",
        expiresAt: null,
      },
      {
        id: "cred-insurance",
        freelancerProfileId: "profile",
        type: "INSURANCE",
        title: "Beroepsaansprakelijkheid",
        status: "VERIFIED",
        expiresAt: yesterday(),
      },
      {
        id: "cred-certificate",
        freelancerProfileId: "profile",
        type: "CERTIFICATE",
        title: "BHV",
        status: "SUBMITTED",
        expiresAt: null,
      },
    ],
  });

  const baseJob = {
    companyId: "company",
    status: "PUBLISHED",
    tenantId: null,
    workMode: "REMOTE",
    rateMin: 60,
    rateMax: 100,
    description: "Synthetische opdracht zonder skill-eisen.",
    publishedAt: new Date(),
  };
  await db.job.createMany({
    data: [
      { ...baseJob, id: "job-compliant", title: "Voldaan" },
      { ...baseJob, id: "job-no-req", title: "Geen eisen" },
      { ...baseJob, id: "job-missing", title: "Mist certificaat" },
      { ...baseJob, id: "job-expired", title: "Verlopen certificaat" },
      { ...baseJob, id: "job-warning", title: "In beoordeling" },
    ],
  });

  // VOG is overal de voldane tweede eis, zodat elke niet-compliant variant ruim boven de drempel blijft.
  await db.jobCredentialRequirement.createMany({
    data: [
      { jobId: "job-compliant", credentialType: "VOG", required: true },
      { jobId: "job-missing", credentialType: "VOG", required: true },
      { jobId: "job-missing", credentialType: "DIPLOMA", required: true },
      { jobId: "job-expired", credentialType: "VOG", required: true },
      { jobId: "job-expired", credentialType: "INSURANCE", required: true },
      { jobId: "job-warning", credentialType: "VOG", required: true },
      { jobId: "job-warning", credentialType: "CERTIFICATE", required: true },
    ],
  });
});

afterAll(async () => {
  await db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});

describe("recommendedJobs — harde compliance-chip op de aanbevelingskaart", () => {
  it("geeft per opdracht dezelfde inzetbaarheids-chip als de browse-lijst", async () => {
    const { recommendedJobs } = await import("./recommendations");
    const matches = await recommendedJobs("freelancer", 20);
    const byId = new Map(matches.map((m) => [m.jobId, m]));

    // Alle vijf varianten halen de drempel en komen dus als aanbeveling terug.
    expect([...byId.keys()].sort()).toEqual(
      ["job-compliant", "job-expired", "job-missing", "job-no-req", "job-warning"].sort(),
    );

    // Voldoet / geen harde eis → geen chip (rustige kaart, niets dat actie vraagt).
    expect(byId.get("job-compliant")?.complianceChip).toBeNull();
    expect(byId.get("job-no-req")?.complianceChip).toBeNull();

    // Ontbrekend vereist certificaat → blokkerend (warning), ontbreken weegt zwaarder dan verlopen.
    expect(byId.get("job-missing")?.complianceChip).toEqual({
      tone: "warning",
      label: "Mist een vereist certificaat",
    });

    // Verlopen vereist certificaat → blokkerend (warning).
    expect(byId.get("job-expired")?.complianceChip).toEqual({
      tone: "warning",
      label: "Vereist certificaat verlopen",
    });

    // Nog in beoordeling → zacht signaal (muted), geen blokkade.
    expect(byId.get("job-warning")?.complianceChip).toEqual({
      tone: "muted",
      label: "Certificaat in beoordeling",
    });
  });
});
