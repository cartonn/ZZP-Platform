// Data-access voor het lead-detail (acquisitie-pijplijn). Tenant-scoped: een franchiser ziet alleen
// de leads van zijn eigen franchise — geen lek tussen franchises. De server is de waarheid; deze
// helper levert de lead + zijn contactlogboek met auteursnamen voor de detailpagina.

import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { ownsViaTenant } from "@/lib/tenancy";
import { type LeadStatus } from "@/lib/enums";

export interface LeadContactEntry {
  id: string;
  body: string;
  authorName: string | null;
  createdAt: Date;
}

export interface LeadDetail {
  id: string;
  organizationName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  notes: string | null;
  nextFollowUp: Date | null;
  createdAt: Date;
  updatedAt: Date;
  contacts: LeadContactEntry[];
}

/**
 * Lead + contactlogboek (oudste eerst) voor de eigen franchise. Geeft `null` als de lead niet
 * bestaat of buiten de tenant van de actor valt (geen cross-tenant lek).
 */
export async function getLeadDetail(actor: Actor, leadId: string): Promise<LeadDetail | null> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      contacts: {
        orderBy: { createdAt: "asc" },
        include: { createdBy: { select: { name: true } } },
      },
    },
  });
  if (!lead || !ownsViaTenant(actor, lead.tenantId)) return null;

  return {
    id: lead.id,
    organizationName: lead.organizationName,
    contactName: lead.contactName,
    email: lead.email,
    phone: lead.phone,
    status: lead.status as LeadStatus,
    notes: lead.notes,
    nextFollowUp: lead.nextFollowUp,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
    contacts: lead.contacts.map((c) => ({
      id: c.id,
      body: c.body,
      authorName: c.createdBy?.name ?? null,
      createdAt: c.createdAt,
    })),
  };
}
