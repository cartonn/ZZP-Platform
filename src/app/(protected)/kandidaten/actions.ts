"use server";

import { revalidatePath } from "next/cache";
import { type Actor, requireRole } from "@/lib/authz";
import { audit, auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import {
  assertApplicationTransition,
  ApplicationTransitionError,
  planBulkApplicationTransition,
  type BulkTransitionItem,
} from "@/lib/applications";
import { type ApplicationStatus, applicationStatusSchema } from "@/lib/enums";
import {
  buildRejectionNotificationBody,
  optionalRejectionReasonSchema,
} from "@/lib/rejection-reason";
import { boundReason } from "@/lib/text-bounds";

// Plafond op één bulk-triage-batch (CWE-400). Spiegelt de bestaande caps elders in de codebase
// (`MAX_INVOICE_LINES = 200` in facturen, `MAX_IMPORT_SIZE` in diensten/importeer): `formData.getAll`
// is onbegrensd, dus een geauthenticeerde CLIENT kan binnen de 12 MB body-limiet tienduizenden ids
// sturen → onbegrensde `id in (...)`-query + een sequentiële per-id-transactie waarvan de timeout
// bewust op 120s staat. Klem het aantal vóór de zware DB-reads/-writes.
const MAX_BULK_TRIAGE_IDS = 200;

async function loadOwnedApplication(actor: Actor, appId: string) {
  const app = await prisma.application.findUnique({
    where: { id: appId },
    include: {
      job: { select: { title: true, company: { select: { userId: true } } } },
      freelancer: { select: { userId: true } },
      collaboration: { select: { id: true } },
    },
  });
  // Geen ownership-leak: een onbekende én een niet-eigen reactie geven exact dezelfde melding
  // (spiegelt withdrawApplication in reacties/actions.ts op ditzelfde Application-model).
  // `assertOwnership` throwde voor een bestaand-maar-vreemd id een andere AuthorizationError dan de
  // "niet gevonden"-Error, een throw-oracle waarmee een opdrachtgever Application-ids kon aftasten.
  if (!app || app.job.company.userId !== actor.id) throw new Error("Reactie niet gevonden.");
  return app;
}

export async function changeApplicationStatus(
  appId: string,
  target: string,
  formData?: FormData,
): Promise<void> {
  const actor = await requireRole("CLIENT");
  // safeParse (geen throwing .parse): een geknutselde POST met een `target` buiten de enum mag geen
  // onafgevangen ZodError/500 geven, maar een nette domeinfout — spiegelt franchise/diensten.
  const parsedTarget = applicationStatusSchema.safeParse(target);
  if (!parsedTarget.success) throw new Error("Ongeldige doelstatus.");
  const targetStatus = parsedTarget.data;
  const app = await loadOwnedApplication(actor, appId);

  // Zodra er een samenwerking uit deze reactie is voortgekomen, is de reactie gebonden aan het
  // werkproces en mag de status niet meer los wijzigen (zou inconsistentie geven).
  if (app.collaboration) {
    throw new Error(
      "Reactie is gekoppeld aan een samenwerking en kan niet meer van status wijzigen.",
    );
  }

  const from = app.status as ApplicationStatus;
  try {
    assertApplicationTransition(from, targetStatus);
  } catch (e) {
    if (e instanceof ApplicationTransitionError) throw new Error(e.message);
    throw e;
  }

  // Optionele, constructieve afwijzingsreden (alleen relevant bij REJECTED). Een ongeldige waarde
  // wordt geweigerd; leeg/afwezig → geen reden. Bij elke andere overgang wissen we een oude reden,
  // zodat een teruggedraaide afwijzing geen verouderde feedback laat staan.
  const rawReason = formData?.get("reason");
  // safeParse: een gemanipuleerde/ongeldige reason degradeert stil naar "geen reden" i.p.v. een 500;
  // de reden komt normaal uit een vaste <select>, dus dit raakt alleen misbruikpaden.
  const parsedReason = optionalRejectionReasonSchema.safeParse(
    typeof rawReason === "string" ? rawReason : undefined,
  );
  const rejectionReason =
    targetStatus === "REJECTED" && parsedReason.success ? (parsedReason.data ?? null) : null;

  // Notificeer de ZZP'er bij een definitieve uitkomst — én bij het terugdraaien van een acceptatie,
  // zodat hij niet eindeloos op het beloofde samenwerkingsvoorstel blijft wachten.
  const notify =
    targetStatus === "ACCEPTED"
      ? { title: "Je reactie is geaccepteerd", body: `Voor "${app.job.title}".` }
      : targetStatus === "REJECTED"
        ? {
            title: "Je reactie is afgewezen",
            body: buildRejectionNotificationBody(app.job.title, rejectionReason),
          }
        : from === "ACCEPTED" && targetStatus === "SHORTLIST"
          ? {
              title: "Acceptatie ingetrokken",
              body: `Voor "${app.job.title}" sta je weer op de shortlist.`,
            }
          : null;

  // Compound-guarded write (CLAUDE.md regel 2/3 — server-side waarheid, geen losse status-update). De
  // pre-lees + assertApplicationTransition leunen op een stale snapshot; in het TOCTOU-venster kan de
  // ZZP'er zijn reactie parallel intrekken (reacties/actions.ts → WITHDRAWN, terminaal). Zonder guard
  // landt de blinde `update({ where: { id } })` dan alsnog op de al-ingetrokken rij → een verboden
  // overgang (WITHDRAWN→REJECTED/…, niet in APPLICATION_TRANSITIONS) + een valse afwijzings-/acceptatie-
  // notificatie naar een ZZP'er die al introk. De `updateMany` op de exact geziene status telt 0 zodra de
  // rij in het venster wisselde → we schrijven niets, emitten geen audit/notify en melden de wijziging.
  const applied = await prisma.$transaction(async (tx) => {
    const { count } = await tx.application.updateMany({
      where: { id: appId, status: from },
      // `acceptedAt` is de klok voor "geaccepteerd, wacht nog op een samenwerkingsvoorstel": zet 'm
      // op het acceptatiemoment (niet op `updatedAt`, dat óók door een latere notitie-edit schuift).
      // Een acceptatie kan alleen via déze enkelvoudige actie gebeuren (bulk-triage sluit ACCEPTED uit),
      // dus dit is de enige plek. Een teruggedraaide acceptatie (ACCEPTED→SHORTLIST) laat het veld staan;
      // de wacht-taak leest alleen status="ACCEPTED", en een her-acceptatie overschrijft het opnieuw.
      data: {
        status: targetStatus,
        rejectionReason,
        ...(targetStatus === "ACCEPTED" ? { acceptedAt: new Date() } : {}),
      },
    });
    if (count === 0) return false;
    await tx.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "APPLICATION_STATUS_CHANGED",
        entityType: "Application",
        entityId: appId,
        metadata: { from, to: targetStatus, ...(rejectionReason ? { rejectionReason } : {}) },
      }),
    });
    if (notify) {
      await tx.notification.create({
        data: {
          userId: app.freelancer.userId,
          type: `APPLICATION_${targetStatus}`,
          title: notify.title,
          body: notify.body,
          link: "/reacties",
        },
      });
    }
    return true;
  });

  if (!applied) {
    throw new Error("Deze reactie is inmiddels gewijzigd; ververs de pagina en probeer opnieuw.");
  }
  revalidatePath("/kandidaten");
}

export type ApplicationNoteState = { success?: string; error?: string } | undefined;

export async function saveApplicationNote(
  appId: string,
  _prev: ApplicationNoteState,
  formData: FormData,
): Promise<ApplicationNoteState> {
  const actor = await requireRole("CLIENT");
  await loadOwnedApplication(actor, appId);

  const note = boundReason(formData.get("note"));
  await prisma.application.update({ where: { id: appId }, data: { note: note || null } });
  await audit({
    actorId: actor.id,
    action: "APPLICATION_NOTE_SAVED",
    entityType: "Application",
    entityId: appId,
  });
  revalidatePath("/kandidaten");
  return { success: "Notitie opgeslagen." };
}

export type BulkTriageState = { ok?: string; error?: string } | undefined;

export async function bulkChangeApplicationStatus(
  _prev: BulkTriageState,
  formData: FormData,
): Promise<BulkTriageState> {
  const actor = await requireRole("CLIENT");

  // Only these three statuses are allowed for bulk triage.
  // ACCEPTED stays a deliberate single action (leads to a collaboration proposal).
  // NEW is not a valid bulk target either.
  // safeParse: een ongeldige/ontbrekende waarde geeft een nette melding i.p.v. een 500.
  const parsedTarget = applicationStatusSchema.safeParse(formData.get("target"));
  if (!parsedTarget.success) {
    return { error: "Deze bulkactie wordt niet ondersteund." };
  }
  const target = parsedTarget.data;
  if (target !== "VIEWED" && target !== "SHORTLIST" && target !== "REJECTED") {
    return { error: "Deze bulkactie wordt niet ondersteund." };
  }

  const ids = [...new Set(formData.getAll("appId").map(String).filter(Boolean))];
  if (ids.length === 0) {
    return { error: "Selecteer minstens één reactie." };
  }
  if (ids.length > MAX_BULK_TRIAGE_IDS) {
    return { error: `Je kunt maximaal ${MAX_BULK_TRIAGE_IDS} reacties tegelijk bijwerken.` };
  }

  // Load only applications owned by this actor's company — non-owned ids simply won't load.
  // unbounded-allow: bulk-triage; begrensd door geselecteerde ids (id in ids)
  const loaded = await prisma.application.findMany({
    where: {
      id: { in: ids },
      job: { company: { userId: actor.id } },
    },
    include: {
      job: { select: { title: true } },
      freelancer: { select: { userId: true } },
      collaboration: { select: { id: true } },
    },
  });

  // Applications with an active collaboration cannot have their status changed.
  let coupledSkipped = 0;
  const transitionable = loaded.filter((app) => {
    if (app.collaboration) {
      coupledSkipped++;
      return false;
    }
    return true;
  });

  const items: BulkTransitionItem[] = transitionable.map((app) => ({
    id: app.id,
    from: app.status as ApplicationStatus,
  }));

  const plan = planBulkApplicationTransition(items, target);

  if (plan.eligible.length === 0 && coupledSkipped === 0 && loaded.length === 0) {
    return { error: "Geen van de geselecteerde reacties kon worden bijgewerkt." };
  }

  // Compound-guarded per-item write (CLAUDE.md regel 2/3 — server-side waarheid). De `plan.eligible`
  // is berekend uit de stale `findMany`-snapshot; in het TOCTOU-venster kan de ZZP'er een geselecteerde
  // reactie parallel intrekken (reacties/actions.ts → WITHDRAWN, terminaal). Zonder guard landt de blinde
  // `update({ where: { id } })` dan alsnog op de al-ingetrokken rij → een verboden overgang
  // (WITHDRAWN→REJECTED/…) + een valse "afgewezen"-notificatie. Elke schrijf is een `updateMany` op de
  // exact geziene status; telt die 0 (rij wisselde in het venster) → geen audit/notify, en de rij telt
  // als overgeslagen i.p.v. bijgewerkt.
  let raced = 0;
  if (plan.eligible.length > 0) {
    await prisma.$transaction(
      async (tx) => {
        for (const id of plan.eligible) {
          const app = transitionable.find((a) => a.id === id)!;
          const from = app.status as ApplicationStatus;
          const { count } = await tx.application.updateMany({
            where: { id, status: from },
            data: { status: target },
          });
          if (count === 0) {
            raced++;
            continue;
          }
          await tx.auditLog.create({
            data: auditData({
              actorId: actor.id,
              action: "APPLICATION_STATUS_CHANGED",
              entityType: "Application",
              entityId: id,
              metadata: { from, to: target },
            }),
          });
          if (target === "REJECTED") {
            await tx.notification.create({
              data: {
                userId: app.freelancer.userId,
                type: "APPLICATION_REJECTED",
                title: "Je reactie is afgewezen",
                body: `Voor "${app.job.title}".`,
                link: "/reacties",
              },
            });
          }
        }
      },
      // De lus doet per eligible-id één round-trip; een ruime selectie mag de Prisma-default (5s) niet
      // raken en de héle batch terugrollen (les van de verloop-cron-hardening).
      { timeout: 120_000, maxWait: 10_000 },
    );
  }

  revalidatePath("/kandidaten");

  const updated = plan.eligible.length - raced;
  const skipped = plan.skipped.length + coupledSkipped + raced;

  if (updated === 0 && skipped === 0 && loaded.length === 0) {
    return { error: "Geen van de geselecteerde reacties kon worden bijgewerkt." };
  }

  return {
    ok: `${updated} reactie(s) bijgewerkt${skipped ? `, ${skipped} overgeslagen` : ""}.`,
  };
}
