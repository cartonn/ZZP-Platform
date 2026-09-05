"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authz";
import { audit, auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { assertSupportTransition, canSupportTransition } from "@/lib/support/state";
import { type SupportTicketStatus } from "@/lib/enums";

// Zelfde 5000-cap als de gebruikerszijde (`support/actions.ts`) en `messageSchema`: een
// helpdeskreactie is een bericht en mag de TEXT-kolom niet ongebreideld vullen (CWE-400).
const replySchema = z.object({ body: z.string().trim().min(1).max(5000) });

/** Helpdesk-medewerker reageert op een ticket (auth → rol → actie → audit). */
export async function adminReply(ticketId: string, formData: FormData): Promise<void> {
  const actor = await requireRole("ADMIN");
  const parsed = replySchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return;

  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) return;

  // Bepaal de neveneffecten vóór de writes, zodat ze atomair in één transactie meegaan én
  // verifieerbaar in het auditlogboek terechtkomen.
  const fromStatus = ticket.status as SupportTicketStatus;
  const assignNow = !ticket.assignedToId;
  const statusChanged = canSupportTransition(fromStatus, "AWAITING_USER");

  // Alle vier de mutaties atomair: óf alles slaagt, óf niets — geen halve reactie zonder
  // notificatie/assignment/statuswijziging (A09 audit-volledigheid).
  await prisma.$transaction(async (tx) => {
    await tx.supportMessage.create({
      data: { ticketId, authorId: actor.id, authorKind: "AGENT", body: parsed.data.body },
    });
    // De aanvrager moet wéten dat de helpdesk heeft gereageerd — anders eindigt de escalatie doodlopend
    // (hij zou bij toeval /support/[id] moeten heropenen). Notificatie + bel-teller, consistent met
    // sendMessage in de berichtenflow.
    await tx.notification.create({
      data: {
        userId: ticket.userId,
        type: "SUPPORT_REPLY",
        title: "Reactie van de helpdesk",
        body: parsed.data.body.slice(0, 120),
        link: `/support/${ticketId}`,
      },
    });
    // Een onbehandeld ticket toewijzen aan de reagerende medewerker.
    if (assignNow) {
      await tx.supportTicket.update({
        where: { id: ticketId },
        data: { assignedToId: actor.id },
      });
    }
    // Na een helpdesk-reactie ligt de bal bij de aanvrager → "wacht op je reactie" (uit de wachtrij).
    // Voorheen bleef het ticket ESCALATED en dus eeuwig in de helpdesk-wachtrij staan na een antwoord.
    // Een reactie van de aanvrager zet het via replyToTicket terug op ESCALATED (terug in de wachtrij).
    if (statusChanged) {
      // Compound-guard `status: fromStatus`: als de aanvrager ondertussen zelf reageerde
      // (replyToTicket zet het ticket terug op ESCALATED) mag deze stale flip het niet alsnog
      // op AWAITING_USER (uit de wachtrij) zetten — dan zou een wachtend ticket verdwijnen.
      await tx.supportTicket.updateMany({
        where: { id: ticketId, status: fromStatus },
        data: { status: "AWAITING_USER" },
      });
    }
  });
  await audit({
    actorId: actor.id,
    action: "SUPPORT_AGENT_REPLY",
    entityType: "SupportTicket",
    entityId: ticketId,
    metadata: { statusChanged, assignedTo: assignNow ? actor.id : null },
  });
  revalidatePath(`/admin/support`);
}

export async function adminResolve(ticketId: string): Promise<void> {
  const actor = await requireRole("ADMIN");
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) return;

  const from = ticket.status as SupportTicketStatus;
  assertSupportTransition(from, "RESOLVED");
  await prisma.$transaction(async (tx) => {
    // Compound-guard `status: from`: twee gelijktijdige admins die hetzelfde ticket afronden
    // passeren beide de vóór-lees. updateMany met de statusguard laat alleen de eerste committen;
    // de tweede matcht niet meer (count 0) → geen dubbele SUPPORT_TICKET_RESOLVED-auditregel
    // (spiegelt admin/no-shows/actions.ts).
    const res = await tx.supportTicket.updateMany({
      where: { id: ticketId, status: from },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
    if (res.count === 0) return;
    await tx.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "SUPPORT_TICKET_RESOLVED",
        entityType: "SupportTicket",
        entityId: ticketId,
        metadata: { by: "agent" },
      }),
    });
  });
  revalidatePath(`/admin/support`);
}
