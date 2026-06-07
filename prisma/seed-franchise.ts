import { type PrismaClient } from "@prisma/client";

// Demo-franchise (SEED_DEMO): één Franchiser-tenant met een opdrachtgever (+ afdeling), twee
// ZZP'ers in de roster en één uitgezette dienst. Idempotent via stabiele e-mails/ids.
export async function seedFranchise(prisma: PrismaClient, passwordHash: string): Promise<void> {
  const franchiser = await prisma.user.upsert({
    where: { email: "franchise@zzp-platform.local" },
    update: {},
    create: {
      email: "franchise@zzp-platform.local",
      name: "Femke Franchise",
      role: "FRANCHISER",
      status: "ACTIVE",
      emailVerified: new Date(),
      passwordHash,
    },
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: "zorgbemiddeling-noord" },
    update: {},
    create: {
      name: "Zorgbemiddeling Noord",
      slug: "zorgbemiddeling-noord",
      ownerUserId: franchiser.id,
      brandColor: "#0e7490",
    },
  });
  await prisma.user.update({ where: { id: franchiser.id }, data: { tenantId: tenant.id } });

  // Opdrachtgever in de tenant + één afdeling.
  const clientUser = await prisma.user.upsert({
    where: { email: "noorderbrug@zzp-platform.local" },
    update: { tenantId: tenant.id },
    create: {
      email: "noorderbrug@zzp-platform.local",
      name: "Verpleeghuis De Noorderbrug",
      role: "CLIENT",
      status: "ACTIVE",
      emailVerified: new Date(),
      passwordHash,
      tenantId: tenant.id,
      company: {
        create: { name: "Verpleeghuis De Noorderbrug", location: "Groningen", tenantId: tenant.id },
      },
    },
    include: { company: true },
  });
  const companyId = clientUser.company!.id;

  const dept = await prisma.department.upsert({
    where: { id: "dept-noord-geriatrie" },
    update: {},
    create: { id: "dept-noord-geriatrie", companyId, name: "Afdeling Geriatrie", location: "Groningen" }, // prettier-ignore
  });

  // ZZP'ers in de roster.
  const roster: Array<[string, string, string]> = [
    ["zzp-noord-1@zzp-platform.local", "Lars Bakker", "Verpleegkundige niveau 4"],
    ["zzp-noord-2@zzp-platform.local", "Sofia Janssen", "Verzorgende IG"],
  ];
  for (const [email, name, headline] of roster) {
    await prisma.user.upsert({
      where: { email },
      update: { tenantId: tenant.id },
      create: {
        email,
        name,
        role: "FREELANCER",
        status: "ACTIVE",
        emailVerified: new Date(),
        passwordHash,
        tenantId: tenant.id,
        freelancerProfile: {
          create: {
            headline,
            availability: "AVAILABLE",
            visibility: "PUBLIC",
            completeness: 60,
            tenantId: tenant.id,
          },
        },
      },
    });
  }

  // Eén uitgezette dienst (opdracht) voor de afdeling.
  await prisma.job.upsert({
    where: { id: "dienst-noord-nacht" },
    update: {},
    create: {
      id: "dienst-noord-nacht",
      companyId,
      tenantId: tenant.id,
      departmentId: dept.id,
      title: "Nachtdienst verpleegkundige — Geriatrie",
      description: "Nachtdienst (23:00–07:00) op de afdeling geriatrie. VOG en BIG vereist.",
      status: "PUBLISHED",
      workMode: "ONSITE",
      location: "Groningen",
      publishedAt: new Date(),
    },
  });

  // Acquisitie-pijplijn (CRM-light): een paar leads in verschillende fasen, met contactgeschiedenis.
  const leads: Array<{
    id: string;
    organizationName: string;
    contactName: string;
    email: string;
    phone: string;
    status: string;
    notes: string;
    log: string[];
  }> = [
    {
      id: "lead-noord-thuiszorg",
      organizationName: "Thuiszorg Het Hoge Noorden",
      contactName: "Marijke Veenstra",
      email: "m.veenstra@hethogenoorden.nl",
      phone: "050-1234567",
      status: "WARM",
      notes: "Zoekt flexpool verzorgenden IG voor de regio Groningen-stad.",
      log: [
        "Eerste belletje — interesse in een vaste flexpool. Stuurt functieprofielen toe.",
        "Status: Warm — offerte-gesprek ingepland voor volgende week.",
      ],
    },
    {
      id: "lead-noord-revalidatie",
      organizationName: "Revalidatiecentrum Maartenshof",
      contactName: "Paul Dijkstra",
      email: "p.dijkstra@maartenshof.nl",
      phone: "050-7654321",
      status: "KOUD",
      notes: "Via via binnengekomen; nog niet benaderd.",
      log: [],
    },
    {
      id: "lead-noord-ggz",
      organizationName: "GGZ Drenthe — locatie Assen",
      contactName: "Hanneke Smit",
      email: "h.smit@ggzdrenthe.nl",
      phone: "0592-112233",
      status: "NO_DEAL",
      notes: "Werkt met een vaste landelijke partij.",
      log: ["Status: Afgevallen — heeft al een raamcontract met een landelijke bemiddelaar."],
    },
  ];

  for (const l of leads) {
    await prisma.lead.upsert({
      where: { id: l.id },
      update: {},
      create: {
        id: l.id,
        tenantId: tenant.id,
        organizationName: l.organizationName,
        contactName: l.contactName,
        email: l.email,
        phone: l.phone,
        status: l.status,
        notes: l.notes,
        contacts: {
          create: l.log.map((body) => ({ body, createdById: franchiser.id })),
        },
      },
    });
  }
}
