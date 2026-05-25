import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "demo1234";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // --- Referentiedata: plannen ---
  const plans = [
    { key: "FREE", name: "Gratis", maxApplications: 5, maxJobs: 1, priceCents: 0 },
    { key: "PRO", name: "Pro", maxApplications: 50, maxJobs: 10, priceCents: 2900 },
    { key: "BUSINESS", name: "Business", maxApplications: -1, maxJobs: -1, priceCents: 9900 },
  ];
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { key: plan.key },
      update: { name: plan.name, maxApplications: plan.maxApplications, maxJobs: plan.maxJobs, priceCents: plan.priceCents },
      create: plan,
    });
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

  const skills = [
    { name: "React", slug: "react" },
    { name: "TypeScript", slug: "typescript" },
    { name: "Node.js", slug: "nodejs" },
    { name: "Projectmanagement", slug: "projectmanagement" },
    { name: "Elektrotechniek", slug: "elektrotechniek" },
  ];
  for (const s of skills) {
    await prisma.skill.upsert({ where: { slug: s.slug }, update: { name: s.name }, create: s });
  }

  const ict = await prisma.industry.findUniqueOrThrow({ where: { slug: "ict" } });
  const reactSkill = await prisma.skill.findUniqueOrThrow({ where: { slug: "react" } });
  const tsSkill = await prisma.skill.findUniqueOrThrow({ where: { slug: "typescript" } });

  // --- Demo-account: ADMIN ---
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

  // --- Demo-account: FREELANCER (+ profiel) ---
  const freelancer = await prisma.user.upsert({
    where: { email: "zzp@zzp-platform.local" },
    update: {},
    create: {
      email: "zzp@zzp-platform.local",
      name: "Sanne de Vries",
      role: "FREELANCER",
      status: "ACTIVE",
      emailVerified: new Date(),
      passwordHash,
      freelancerProfile: {
        create: {
          headline: "Senior Frontend Developer",
          bio: "Tien jaar ervaring met React en TypeScript. Beschikbaar voor opdrachten vanaf Q3.",
          hourlyRate: 85,
          availability: "AVAILABLE",
          location: "Amsterdam",
          workMode: "HYBRID",
          languages: JSON.stringify(["nl", "en"]),
          visibility: "PUBLIC",
          completeness: 70,
        },
      },
    },
    include: { freelancerProfile: true },
  });

  if (freelancer.freelancerProfile) {
    const profileId = freelancer.freelancerProfile.id;
    for (const skillId of [reactSkill.id, tsSkill.id]) {
      await prisma.freelancerSkill.upsert({
        where: { freelancerProfileId_skillId: { freelancerProfileId: profileId, skillId } },
        update: {},
        create: { freelancerProfileId: profileId, skillId },
      });
    }
    await prisma.freelancerIndustry.upsert({
      where: { freelancerProfileId_industryId: { freelancerProfileId: profileId, industryId: ict.id } },
      update: {},
      create: { freelancerProfileId: profileId, industryId: ict.id },
    });
  }

  // --- Demo-account: CLIENT (+ bedrijf) ---
  await prisma.user.upsert({
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
          industryId: ict.id,
          description: "Productbureau voor web- en mobiele applicaties.",
          website: "https://example.com",
          location: "Utrecht",
        },
      },
    },
  });

  console.log("Seed klaar. Demo-accounts (wachtwoord: %s):", DEMO_PASSWORD);
  console.log("  admin@zzp-platform.local          (ADMIN)");
  console.log("  zzp@zzp-platform.local            (FREELANCER)");
  console.log("  opdrachtgever@zzp-platform.local  (CLIENT)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
