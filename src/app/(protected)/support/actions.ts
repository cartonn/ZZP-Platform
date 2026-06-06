"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AuthorizationError, requireActor } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { classifyTicket, triageDecision } from "@/lib/support/triage";
import { knowledgeAnswer } from "@/lib/support/knowledge-base";
import { assertSupportTransition } from "@/lib/support/state";
import { type SupportTicketStatus } from "@/lib/enums";

export type TicketState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

const ticketSchema = z.object({
  subject: z.string().trim().min(4, "Geef een kort onderwerp.").max(140),
  body: z.string().trim().min(10, "Beschrijf je vraag in iets meer detail."),
});

/**
 * Laadt een ticket dat van de actor is (ownership), of werpt. Een poging om een ticket
 * van iemand anders te bewerken is een beveiligingsrelevante gebeurtenis en wordt geaudit
 * (CLAUDE.md regel 5 — "audit alles wat telt"), zodat cross-user-toegangspogingen zichtbaar
 * zijn. Een onbekend id loggen we niet: dat is doorgaans een verouderde link, geen poging.
 */
async function loadOwnedTicket(ticketId: string, userId: string, attemptedAction: string) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.userId !== userId) {
    if (ticket && ticket.userId !== userId) {
      await audit({
        actorId: userId,
        action: "SUPPORT_TICKET_ACCESS_DENIED",
        entityType: "SupportTicket",
        entityId: ticketId,
        metadata: { attemptedAction, ownerId: ticket.userId },
      });
    }
    throw new Error("Ticket niet gevonden.");
  }
  return ticket;
}

/**
 * Maakt een ticket aan en draait direct de triage: de Support-assistent antwoordt zelf
 * (veilige, zelfbedienende intenties) of escaleert naar de helpdesk. Elke stap wordt geaudit.
 */
export async function createTicket(_prev: TicketState, formData: FormData): Promise<TicketState> {
  let actor;
  try {
    actor = await requireActor();
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const parsed = ticketSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) if (v && v[0]) fieldErrors[k] = v[0];
    return { error: "Controleer je invoer.", fieldErrors };
  }
  const { subject, body } = parsed.data;

  const triage = classifyTicket({ subject, body });
  const decision = triageDecision({
    category: triage.category,
    confidence: triage.confidence,
    autoAttempts: 0,
  });
  const answer = decision === "AUTO_ANSWER" ? knowledgeAnswer(triage.intent) : null;
  const autoAnswered = answer !== null;

  // Eindstatus volgt uit de triage (de body leeft als eerste bericht, niet op het ticket).
  // AUTO_ANSWERED: de assistent gaf antwoord; de gebruiker bevestigt zelf of het hielp.
  const finalStatus: SupportTicketStatus = autoAnswered ? "AUTO_ANSWERED" : "ESCALATED";
  assertSupportTransition("TRIAGED", finalStatus);

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: actor.id,
      subject,
      category: triage.category,
      intent: triage.intent,
      triageConfidence: triage.confidence,
      status: finalStatus,
      autoAttempts: autoAnswered ? 1 : 0,
      messages: {
        create: [
          { authorId: actor.id, authorKind: "USER", body },
          ...(answer ? [{ authorId: null, authorKind: "ASSISTANT" as const, body: answer }] : []),
        ],
      },
    },
  });

  await audit({
    actorId: actor.id,
    action: "SUPPORT_TICKET_CREATED",
    entityType: "SupportTicket",
    entityId: ticket.id,
    metadata: { category: triage.category, intent: triage.intent, decision },
  });
  if (autoAnswered) {
    await audit({
      actorId: null,
      action: "SUPPORT_AUTO_ANSWERED",
      entityType: "SupportTicket",
      entityId: ticket.id,
      metadata: { onBehalfOf: actor.id, intent: triage.intent },
    });
  } else {
    await audit({
      actorId: null,
      action: "SUPPORT_TICKET_ESCALATED",
      entityType: "SupportTicket",
      entityId: ticket.id,
      metadata: {
        onBehalfOf: actor.id,
        reason: triage.category === "PRIVACY" ? "sensitive" : "low_confidence",
      },
    });
  }

  revalidatePath("/support");
  redirect(`/support/${ticket.id}`);
}

const replySchema = z.object({ body: z.string().trim().min(1, "Schrijf een bericht.") });

export async function replyToTicket(ticketId: string, formData: FormData): Promise<void> {
  const actor = await requireActor();
  const ticket = await loadOwnedTicket(ticketId, actor.id, "reply");

  const parsed = replySchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return;

  await prisma.supportMessage.create({
    data: { ticketId, authorId: actor.id, authorKind: "USER", body: parsed.data.body },
  });

  // Een reactie op een opgelost OF zelf-beantwoord ticket heropent het, zodat het in de
  // helpdesk-wachtrij komt — AUTO_ANSWERED staat daar anders niet in en het vervolgbericht
  // zou stil verdwijnen.
  if (ticket.status === "RESOLVED" || ticket.status === "AUTO_ANSWERED") {
    assertSupportTransition(ticket.status as SupportTicketStatus, "REOPENED");
    await prisma.supportTicket.update({ where: { id: ticketId }, data: { status: "REOPENED" } });
  }

  await audit({
    actorId: actor.id,
    action: "SUPPORT_TICKET_REPLY",
    entityType: "SupportTicket",
    entityId: ticketId,
  });
  revalidatePath(`/support/${ticketId}`);
}

export async function markResolved(ticketId: string): Promise<void> {
  const actor = await requireActor();
  const ticket = await loadOwnedTicket(ticketId, actor.id, "resolve");

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
  });
  revalidatePath(`/support/${ticketId}`);
}
