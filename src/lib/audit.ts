// Auditlogboek (CLAUDE.md regel 5): verificatiebeslissingen, rol-/statuswijzigingen,
// document-toegang — alles wat telt. Eén schrijfpunt zodat de mutatieketen consistent
// blijft afsluiten met een auditregel.

import { prisma } from "@/lib/db";

export interface AuditEntry {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown> | null;
}

/** De `data`-payload voor een auditregel. Handig om een audit binnen een `$transaction`
 *  mee te schrijven (atomair met de beslissing — CLAUDE.md regel 5). */
export function auditData(entry: AuditEntry) {
  return {
    actorId: entry.actorId ?? null,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
  };
}

export async function audit(entry: AuditEntry): Promise<void> {
  await prisma.auditLog.create({ data: auditData(entry) });
}
