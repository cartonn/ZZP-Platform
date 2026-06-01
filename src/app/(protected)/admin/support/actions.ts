"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { assertSupportTransition } from "@/lib/support/state";
import { type SupportTicketStatus } from "@/lib/enums";

const replySchema = z.object({ body: z.string().trim().min(1) });

/** Helpdesk-medewerker reageert op een ticket (auth → rol → actie → audit). */
export async function adminReply(ticketId: string, formData: FormData): Promise<void> {
  const actor = await requireRole("ADMIN");
  const parsed = replySchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return;

  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) return;

  await prisma.supportMessage.create({
    data: { ticketId, authorId: actor.id, authorKind: "AGENT", body: parsed.data.body },
  });
  // Een onbehandeld ticket toewijzen aan de reagerende medewerker.
  if (!ticket.assignedToId) {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { assignedToId: actor.id },
    });
  }
  await audit({
    actorId: actor.id,
    action: "SUPPORT_AGENT_REPLY",
    entityType: "SupportTicket",
    entityId: ticketId,
  });
  revalidatePath(`/admin/support`);
}

export async function adminResolve(ticketId: string): Promise<void> {
  const actor = await requireRole("ADMIN");
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) return;

  assertSupportTransition(ticket.status as SupportTicketStatus, "RESOLVED");
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });
  await audit({
    actorId: actor.id,
    action: "SUPPORT_TICKET_RESOLVED",
    entityType: "SupportTicket",
    entityId: ticketId,
    metadata: { by: "agent" },
  });
  revalidatePath(`/admin/support`);
}
