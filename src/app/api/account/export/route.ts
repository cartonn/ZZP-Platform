import { NextResponse } from "next/server";
import { AuthorizationError, requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import { prisma } from "@/lib/db";
import { exportRateLimiter } from "@/lib/rate-limit";

// AVG recht op inzage/dataportabiliteit: exporteer de eigen gegevens als JSON.
// Alleen de eigen persoonsgegevens (geen documentinhoud, geen data van derden).
export async function GET() {
  let actor;
  try {
    actor = await requireActor();
  } catch (e) {
    if (e instanceof AuthorizationError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }

  // Export-rem: de export bundelt veel queries; begrens scripted loops (HTTP 429).
  if (!exportRateLimiter.check(`export:${actor.id}`).allowed) {
    return NextResponse.json(
      { error: "Te veel exportverzoeken. Probeer het later opnieuw." },
      { status: 429 },
    );
  }

  const [user, profile, company, applications, documents, notifications, sentMessages] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: actor.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          deletionRequestedAt: true,
        },
      }),
      prisma.freelancerProfile.findUnique({
        where: { userId: actor.id },
        include: {
          skills: { select: { skillId: true } },
          industries: { select: { industryId: true } },
          credentials: {
            select: {
              type: true,
              title: true,
              issuer: true,
              status: true,
              issuedAt: true,
              expiresAt: true,
              visibility: true,
            },
          },
        },
      }),
      prisma.company.findUnique({ where: { userId: actor.id } }),
      prisma.application.findMany({
        where: { freelancer: { userId: actor.id } },
        select: {
          jobId: true,
          status: true,
          motivation: true,
          proposedRate: true,
          matchScore: true,
          createdAt: true,
        },
      }),
      prisma.document.findMany({
        where: { ownerId: actor.id },
        select: { kind: true, filename: true, mimeType: true, size: true, createdAt: true },
      }),
      prisma.notification.findMany({
        where: { userId: actor.id },
        select: { type: true, title: true, body: true, readAt: true, createdAt: true },
      }),
      prisma.message.findMany({
        where: { senderId: actor.id },
        select: { conversationId: true, body: true, createdAt: true },
      }),
    ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    notice:
      "Dit zijn je eigen persoonsgegevens in dit platform (geen documentinhoud, geen gegevens van anderen).",
    user,
    freelancerProfile: profile,
    company,
    applications,
    documents,
    notifications,
    sentMessages,
  };

  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "ACCOUNT_DATA_EXPORTED",
      entityType: "User",
      entityId: actor.id,
      ...(await requestMeta()),
    }),
  });

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="zzp-platform-export-${actor.id}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
