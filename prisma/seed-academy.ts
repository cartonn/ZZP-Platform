import { type PrismaClient } from "@prisma/client";

// Demo-cursussen voor de Academie. Idempotent via stabiele course-ids. Content is voorbeeldmateriaal
// (vak/compliance/administratie) — in productie vult de beheerder echte cursussen. Eén demo-ZZP'er
// (sanne) krijgt de eerste les afgevinkt zodat de voortgang meteen zichtbaar is.
export async function seedAcademy(
  prisma: PrismaClient,
  demoFreelancerUserId: string | undefined,
): Promise<void> {
  const courses: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string;
    audience: string;
    level: string;
    order: number;
    lessons: Array<{ id: string; title: string; body: string; minutes: number }>;
  }> = [
    {
      id: "course-start",
      slug: "goed-van-start",
      title: "Goed van start als ZZP'er",
      summary: "De basis op orde: documenten, profiel en je eerste opdracht.",
      audience: "FREELANCER",
      level: "BEGINNER",
      order: 1,
      lessons: [
        {
          id: "lesson-start-docs",
          title: "Je verplichte documenten",
          minutes: 4,
          body: "Een opdrachtgever wil zekerheid voordat je aan de slag gaat. Twee documenten zijn vrijwel altijd vereist:\n\n• Verklaring Omtrent Gedrag (VOG) — vraag deze tijdig aan, de doorlooptijd is enkele weken.\n• Beroeps- of bedrijfsaansprakelijkheidsverzekering — houd het polisblad bij de hand.\n\nUpload beide bij Certificaten en vraag verificatie aan. Zodra ze geverifieerd zijn, sta je op 'Inzetbaar' en kun je geboekt worden.",
        },
        {
          id: "lesson-start-profiel",
          title: "Een profiel dat opvalt",
          minutes: 5,
          body: "Opdrachtgevers kiezen op basis van je profiel. Maak het compleet:\n\n• Een heldere functietitel en korte, concrete bio.\n• Je uurtarief en werkmodus (op locatie, hybride, remote).\n• Je skills en branches — die bepalen mede je matchscore.\n\nHoe completer je profiel, hoe hoger je in de aanbevelingen verschijnt.",
        },
        {
          id: "lesson-start-reageren",
          title: "Reageren op een opdracht",
          minutes: 3,
          body: "Bij een passende opdracht zie je een matchscore met onderbouwing: welke skills aansluiten, of je aan de certificaateisen voldoet en of het tarief past.\n\nReageer gericht: noem kort waarom je past en bevestig je beschikbaarheid. Een complete reactie met de juiste certificaten op orde maakt het verschil.",
        },
      ],
    },
    {
      id: "course-compliance",
      slug: "compliance-en-wet-dba",
      title: "Compliance & Wet DBA in de zorg",
      summary: "Werk veilig binnen de regels: Wet DBA, modelovereenkomsten en toeslagen.",
      audience: "FREELANCER",
      level: "GEVORDERD",
      order: 2,
      lessons: [
        {
          id: "lesson-dba-wat",
          title: "Wat is de Wet DBA?",
          minutes: 6,
          body: "De Wet DBA gaat over de vraag of er sprake is van échte zelfstandigheid of van een verkapt dienstverband (schijnzelfstandigheid). Belangrijke signalen:\n\n• Werk je voor eigen rekening en risico?\n• Bepaal je zelf hoe en wanneer je het werk doet?\n• Is er een gezagsverhouding zoals bij een werknemer?\n\nHet platform helpt door risicovolle constructies te signaleren, maar de eindverantwoordelijkheid ligt bij jou en de opdrachtgever.",
        },
        {
          id: "lesson-dba-modelovereenkomst",
          title: "Modelovereenkomsten",
          minutes: 5,
          body: "Een modelovereenkomst legt de afspraken vast op een manier die zelfstandigheid onderbouwt. Let op:\n\n• Gebruik een overeenkomst die past bij de aard van het werk.\n• Wijk in de praktijk niet af van wat er op papier staat.\n• Bewaar de getekende overeenkomst bij je administratie.\n\nBinnen een samenwerking wordt het contract digitaal vastgelegd en ondertekend.",
        },
        {
          id: "lesson-dba-ort",
          title: "Onregelmatigheidstoeslagen",
          minutes: 4,
          body: "In de zorg werk je vaak buiten kantoortijden. Onregelmatigheidstoeslagen (ORT) gelden voor avond, nacht, weekend en feestdagen.\n\nBij het registreren van je uren leidt het platform de toeslagen automatisch af uit je diensttijden, op basis van het ingestelde sectorprofiel. Controleer altijd of het profiel klopt met de afspraak met je opdrachtgever.",
        },
      ],
    },
  ];

  for (const c of courses) {
    await prisma.course.upsert({
      where: { id: c.id },
      update: { status: "PUBLISHED" },
      create: {
        id: c.id,
        slug: c.slug,
        title: c.title,
        summary: c.summary,
        status: "PUBLISHED",
        audience: c.audience,
        level: c.level,
        order: c.order,
        lessons: {
          create: c.lessons.map((l, i) => ({
            id: l.id,
            title: l.title,
            body: l.body,
            order: i + 1,
            estimatedMinutes: l.minutes,
          })),
        },
      },
    });
  }

  // Demo-voortgang: sanne heeft de eerste les van de startcursus afgerond.
  if (demoFreelancerUserId) {
    await prisma.lessonCompletion.upsert({
      where: { lessonId_userId: { lessonId: "lesson-start-docs", userId: demoFreelancerUserId } },
      update: {},
      create: { lessonId: "lesson-start-docs", userId: demoFreelancerUserId },
    });
  }
}
