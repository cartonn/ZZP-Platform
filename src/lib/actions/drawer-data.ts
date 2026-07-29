// Actiecentrum — drawer-prefetch. Voor de drawer-soorten (profiel/bedrijf/certificaat/prestatie/
// bericht) haalt deze loader de form-data op die het bijbehorende bestaande formulier nodig heeft,
// zodat de client-drawer het formulier ter plekke kan renderen. N+1-veilig: één gebatchte query
// per SOORT (findMany ... where id in [...]) i.p.v. per taak, en alleen voor soorten die echt in de
// lijst staan. De ids/sleutels komen uit de al-geënumereerde PendingTask[].

import "server-only";
import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { performanceFormDefaults, type PerformanceFormDefaults } from "@/lib/performance-form";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { type CredentialType } from "@/lib/enums";
import { type PendingTask } from "@/lib/actions/tasks";
import { type ProfileFormInitial } from "@/app/(protected)/profiel/profile-form";
import { type CompanyFormInitial } from "@/app/(protected)/bedrijf/company-form";
import { type CredentialFormInitial } from "@/app/(protected)/certificaten/credential-form";
import { parseLanguagesText } from "@/lib/parse-languages";

type Option = { id: string; name: string };

/** Bewijsstuk-verwijzing voor de beoordeel-drawer (alleen metadata; de bytes komen via /api/documents). */
export type ReviewDocument = { id: string; filename: string; mimeType: string };

/** Geserialiseerde data per drawer-taak (plain objects — geen Date), gekeyd op task.id. */
export type DrawerData =
  | {
      kind: "profile-complete";
      section: "profile-private" | "profile-completeness";
      initial: ProfileFormInitial;
      skills: Option[];
      industries: Option[];
    }
  | { kind: "profile-complete"; section: "identity" }
  | { kind: "company-complete"; initial: CompanyFormInitial; industries: Option[] }
  | { kind: "credential-fix"; initial: CredentialFormInitial }
  | {
      kind: "performance-resubmit";
      perfId: string;
      collabId: string;
      rateCents: number | null;
      ortProfile: string | null;
      ortCustomRates: string | null;
      defaults: PerformanceFormDefaults;
    }
  | {
      kind: "message-reply";
      conversationId: string;
      messages: { id: string; mine: boolean; body: string }[];
    }
  | {
      kind: "admin-verify-credential";
      credId: string;
      typeLabel: string;
      title: string;
      issuer: string;
      issuedAt: string;
      expiresAt: string;
      submittedBy: string;
      document: ReviewDocument | null;
    }
  | {
      kind: "invoice-approve";
      invId: string;
      collabId: string;
      number: string;
      jobTitle: string;
      fromName: string;
      toName: string;
      issuedAt: string;
      dueAt: string;
      vatRegime: string;
      subtotalCents: number;
      vatCents: number;
      totalCents: number;
    }
  | {
      kind: "performance-approve";
      perfId: string;
      collabId: string;
      perfType: string;
      hours: number | null;
      rateCents: number | null;
      amountCents: number | null;
      milestoneTitle: string | null;
      periodStart: string;
      periodEnd: string;
      description: string;
      ortSegments: string | null;
      ortProfile: string | null;
      ortCustomRates: string | null;
      freelancerName: string;
      jobTitle: string;
    };

const ymd = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

/**
 * Bouwt een map task.id → DrawerData voor alle drawer-soorten in `tasks`. Alleen de soorten die
 * voorkomen leiden tot queries; gelijksoortige taken worden in één findMany gebatcht.
 */
export async function loadDrawerData(
  actor: Actor,
  tasks: PendingTask[],
): Promise<Record<string, DrawerData>> {
  const out: Record<string, DrawerData> = {};

  const profileTasks = tasks.filter(
    (t) => t.kind === "profile-complete" && t.section !== "identity",
  );
  const identityTasks = tasks.filter(
    (t) => t.kind === "profile-complete" && t.section === "identity",
  );
  const companyTask = tasks.find((t) => t.kind === "company-complete");
  const credTasks = tasks.filter((t) => t.kind === "credential-fix");
  const perfTasks = tasks.filter((t) => t.kind === "performance-resubmit");
  const replyTasks = tasks.filter((t) => t.kind === "message-reply");
  const verifyTasks = tasks.filter((t) => t.kind === "admin-verify-credential");
  const invoiceApproveTasks = tasks.filter((t) => t.kind === "invoice-approve");
  const perfApproveTasks = tasks.filter((t) => t.kind === "performance-approve");

  await Promise.all([
    // Profiel (één query voor private + completeness; identity heeft geen data nodig).
    (async () => {
      for (const t of identityTasks) out[t.id] = { kind: "profile-complete", section: "identity" };
      if (profileTasks.length === 0) return;
      const [profile, skills, industries] = await Promise.all([
        prisma.freelancerProfile.findUnique({
          where: { userId: actor.id },
          select: {
            headline: true,
            bio: true,
            hourlyRate: true,
            location: true,
            availability: true,
            workMode: true,
            maxTravelMinutes: true,
            languages: true,
            kvkNumber: true,
            btwNumber: true,
            website: true,
            visibility: true,
            defaultMotivation: true,
            skills: { select: { skillId: true } },
            industries: { select: { industryId: true } },
          },
        }),
        prisma.skill.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
        prisma.industry.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      ]);
      if (!profile) return;
      const initial: ProfileFormInitial = {
        headline: profile.headline ?? "",
        bio: profile.bio ?? "",
        hourlyRate: profile.hourlyRate != null ? String(profile.hourlyRate) : "",
        location: profile.location ?? "",
        availability: profile.availability,
        workMode: profile.workMode,
        maxTravelMinutes: profile.maxTravelMinutes?.toString() ?? "",
        languages: parseLanguagesText(profile.languages),
        kvkNumber: profile.kvkNumber ?? "",
        btwNumber: profile.btwNumber ?? "",
        website: profile.website ?? "",
        visibility: profile.visibility,
        defaultMotivation: profile.defaultMotivation ?? "",
        skillIds: profile.skills.map((s) => s.skillId),
        industryIds: profile.industries.map((i) => i.industryId),
      };
      for (const t of profileTasks) {
        if (t.kind !== "profile-complete" || t.section === "identity") continue;
        out[t.id] = { kind: "profile-complete", section: t.section, initial, skills, industries };
      }
    })(),

    // Bedrijfsprofiel.
    (async () => {
      if (!companyTask) return;
      const [company, industries] = await Promise.all([
        prisma.company.findUnique({
          where: { userId: actor.id },
          select: {
            name: true,
            description: true,
            website: true,
            location: true,
            industryId: true,
            logoKey: true,
          },
        }),
        prisma.industry.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      ]);
      if (!company) return;
      out[companyTask.id] = {
        kind: "company-complete",
        industries,
        initial: {
          name: company.name ?? "",
          description: company.description ?? "",
          website: company.website ?? "",
          location: company.location ?? "",
          industryId: company.industryId ?? "",
          logoKey: company.logoKey,
        },
      };
    })(),

    // Certificaten (gebatcht).
    (async () => {
      if (credTasks.length === 0) return;
      const ids = credTasks.flatMap((t) => (t.kind === "credential-fix" ? [t.credId] : []));
      const creds = await prisma.credential.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          type: true,
          title: true,
          issuer: true,
          issuedAt: true,
          expiresAt: true,
          visibility: true,
          documentId: true,
        },
      });
      const byId = new Map(creds.map((c) => [c.id, c]));
      for (const t of credTasks) {
        if (t.kind !== "credential-fix") continue;
        const c = byId.get(t.credId);
        if (!c) continue;
        out[t.id] = {
          kind: "credential-fix",
          initial: {
            id: c.id,
            type: c.type,
            title: c.title,
            issuer: c.issuer ?? "",
            issuedAt: ymd(c.issuedAt),
            expiresAt: ymd(c.expiresAt),
            visibility: c.visibility,
            hasDocument: !!c.documentId,
            documentId: c.documentId,
          },
        };
      }
    })(),

    // Afgekeurde prestaties (gebatcht, incl. samenwerking voor tarief/ORT-context).
    (async () => {
      if (perfTasks.length === 0) return;
      const ids = perfTasks.flatMap((t) => (t.kind === "performance-resubmit" ? [t.perfId] : []));
      const perfs = await prisma.performance.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          type: true,
          hours: true,
          amountCents: true,
          milestoneTitle: true,
          periodStart: true,
          periodEnd: true,
          description: true,
          ortSegments: true,
          shifts: true,
          collaborationId: true,
          collaboration: {
            select: { rate: true, ortProfile: true, ortCustomRates: true },
          },
        },
      });
      const byId = new Map(perfs.map((p) => [p.id, p]));
      for (const t of perfTasks) {
        if (t.kind !== "performance-resubmit") continue;
        const p = byId.get(t.perfId);
        if (!p) continue;
        out[t.id] = {
          kind: "performance-resubmit",
          perfId: p.id,
          collabId: p.collaborationId,
          rateCents: p.collaboration.rate != null ? p.collaboration.rate * 100 : null,
          ortProfile: p.collaboration.ortProfile,
          ortCustomRates: p.collaboration.ortCustomRates,
          defaults: performanceFormDefaults(p),
        };
      }
    })(),

    // Gesprekken (laatste berichten + composer-context, gebatcht).
    (async () => {
      if (replyTasks.length === 0) return;
      const ids = replyTasks.flatMap((t) => (t.kind === "message-reply" ? [t.conversationId] : []));
      const convos = await prisma.conversation.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          messages: {
            orderBy: { createdAt: "desc" },
            take: 6,
            select: { id: true, body: true, senderId: true },
          },
        },
      });
      const byId = new Map(convos.map((c) => [c.id, c]));
      for (const t of replyTasks) {
        if (t.kind !== "message-reply") continue;
        const c = byId.get(t.conversationId);
        const messages = (c?.messages ?? [])
          .map((m) => ({ id: m.id, mine: m.senderId === actor.id, body: m.body }))
          .reverse();
        out[t.id] = { kind: "message-reply", conversationId: t.conversationId, messages };
      }
    })(),

    // Certificaten ter verificatie (admin): velden + bewijsstuk-referentie (gebatcht).
    (async () => {
      if (verifyTasks.length === 0) return;
      const ids = verifyTasks.flatMap((t) =>
        t.kind === "admin-verify-credential" ? [t.credId] : [],
      );
      const creds = await prisma.credential.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          title: true,
          type: true,
          issuer: true,
          issuedAt: true,
          expiresAt: true,
          document: { select: { id: true, filename: true, mimeType: true } },
          freelancerProfile: { select: { user: { select: { name: true } } } },
        },
      });
      const byId = new Map(creds.map((c) => [c.id, c]));
      for (const t of verifyTasks) {
        if (t.kind !== "admin-verify-credential") continue;
        const c = byId.get(t.credId);
        if (!c) continue;
        out[t.id] = {
          kind: "admin-verify-credential",
          credId: c.id,
          typeLabel: CREDENTIAL_TYPE_LABEL[c.type as CredentialType] ?? c.type,
          title: c.title,
          issuer: c.issuer ?? "",
          issuedAt: ymd(c.issuedAt),
          expiresAt: ymd(c.expiresAt),
          submittedBy: c.freelancerProfile.user.name ?? "ZZP'er",
          document: c.document
            ? { id: c.document.id, filename: c.document.filename, mimeType: c.document.mimeType }
            : null,
        };
      }
    })(),

    // Ingediende facturen ter goedkeuring (opdrachtgever): regels + bedragen (gebatcht, scoped).
    (async () => {
      if (invoiceApproveTasks.length === 0) return;
      const ids = invoiceApproveTasks.flatMap((t) =>
        t.kind === "invoice-approve" ? [t.invId] : [],
      );
      const invoices = await prisma.invoice.findMany({
        where: { id: { in: ids }, collaboration: { company: { userId: actor.id } } },
        select: {
          id: true,
          partyInvoiceNumber: true,
          issuedAt: true,
          dueAt: true,
          vatRegime: true,
          subtotalCents: true,
          vatCents: true,
          totalCents: true,
          collaboration: {
            select: {
              id: true,
              job: { select: { title: true } },
              company: { select: { name: true } },
              freelancer: { select: { user: { select: { name: true } } } },
            },
          },
        },
      });
      const byId = new Map(invoices.map((i) => [i.id, i]));
      for (const t of invoiceApproveTasks) {
        if (t.kind !== "invoice-approve") continue;
        const i = byId.get(t.invId);
        if (!i || !i.collaboration) continue;
        out[t.id] = {
          kind: "invoice-approve",
          invId: i.id,
          collabId: i.collaboration.id,
          number: i.partyInvoiceNumber ?? "—",
          jobTitle: i.collaboration.job.title,
          fromName: i.collaboration.freelancer.user.name ?? "ZZP'er",
          toName: i.collaboration.company.name,
          issuedAt: ymd(i.issuedAt),
          dueAt: ymd(i.dueAt),
          vatRegime: i.vatRegime ?? "",
          subtotalCents: i.subtotalCents ?? 0,
          vatCents: i.vatCents ?? 0,
          totalCents: i.totalCents ?? 0,
        };
      }
    })(),

    // Ingediende prestaties ter goedkeuring (opdrachtgever): uren/oplevering + ORT-context (gebatcht, scoped).
    (async () => {
      if (perfApproveTasks.length === 0) return;
      const ids = perfApproveTasks.flatMap((t) =>
        t.kind === "performance-approve" ? [t.perfId] : [],
      );
      const perfs = await prisma.performance.findMany({
        where: { id: { in: ids }, collaboration: { company: { userId: actor.id } } },
        select: {
          id: true,
          type: true,
          hours: true,
          rateCents: true,
          amountCents: true,
          milestoneTitle: true,
          periodStart: true,
          periodEnd: true,
          description: true,
          ortSegments: true,
          collaborationId: true,
          collaboration: {
            select: {
              ortProfile: true,
              ortCustomRates: true,
              job: { select: { title: true } },
              freelancer: { select: { user: { select: { name: true } } } },
            },
          },
        },
      });
      const byId = new Map(perfs.map((p) => [p.id, p]));
      for (const t of perfApproveTasks) {
        if (t.kind !== "performance-approve") continue;
        const p = byId.get(t.perfId);
        if (!p) continue;
        out[t.id] = {
          kind: "performance-approve",
          perfId: p.id,
          collabId: p.collaborationId,
          perfType: p.type,
          hours: p.hours,
          rateCents: p.rateCents,
          amountCents: p.amountCents,
          milestoneTitle: p.milestoneTitle,
          periodStart: ymd(p.periodStart),
          periodEnd: ymd(p.periodEnd),
          description: p.description,
          ortSegments: p.ortSegments,
          ortProfile: p.collaboration.ortProfile,
          ortCustomRates: p.collaboration.ortCustomRates,
          freelancerName: p.collaboration.freelancer.user.name ?? "ZZP'er",
          jobTitle: p.collaboration.job.title,
        };
      }
    })(),
  ]);

  return out;
}
