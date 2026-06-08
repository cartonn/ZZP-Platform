"use server";

import { prisma } from "@/lib/db";
import { currentActor } from "@/lib/authz";
import { visibleJobsWhere } from "@/lib/tenancy";
import {
  type SearchResult,
  normalizeSearchQuery,
  isSearchableQuery,
  bestFieldScore,
  rankResults,
} from "@/lib/search";

// ---------------------------------------------------------------------------
// Role-scoped, ownership-enforced global quick-search (⌘K).
// The server computes scope and ranking — the client decides nothing.
// ---------------------------------------------------------------------------

export async function searchPlatform(rawQuery: string): Promise<SearchResult[]> {
  const actor = await currentActor();
  if (!actor || !isSearchableQuery(rawQuery)) return [];

  const q = normalizeSearchQuery(rawQuery);

  // Conversations are available for all roles.
  const conversationQuery = prisma.conversation.findMany({
    where: { participants: { some: { userId: actor.id } } },
    take: 40,
    orderBy: { updatedAt: "desc" },
    include: {
      job: { select: { title: true } },
      participants: {
        where: { userId: { not: actor.id } },
        include: { user: { select: { name: true } } },
      },
    },
  });

  switch (actor.role) {
    case "FREELANCER": {
      const [jobs, collaborations, credentials, invoices, conversations] = await Promise.all([
        prisma.job.findMany({
          // Tenant-zichtbaarheid: een franchise-dienst is alleen vindbaar voor de eigen roster
          // (of als overflow opengezet); directe ZZP'ers zien alleen platform-opdrachten.
          where: { status: "PUBLISHED", AND: [visibleJobsWhere(actor)] },
          take: 40,
          orderBy: { updatedAt: "desc" },
          include: { company: { select: { name: true } } },
        }),
        prisma.collaboration.findMany({
          where: { freelancer: { userId: actor.id } },
          take: 40,
          orderBy: { updatedAt: "desc" },
          include: {
            job: { select: { title: true } },
            company: { select: { name: true } },
          },
        }),
        prisma.credential.findMany({
          where: { freelancerProfile: { userId: actor.id } },
          take: 40,
          orderBy: { updatedAt: "desc" },
        }),
        prisma.invoice.findMany({
          where: { collaboration: { freelancer: { userId: actor.id } } },
          take: 40,
          orderBy: { updatedAt: "desc" },
        }),
        conversationQuery,
      ]);

      const results: SearchResult[] = [];

      for (const job of jobs) {
        const score = bestFieldScore([job.title, job.description, job.company.name], q);
        if (score > 0) {
          results.push({
            type: "opdracht",
            id: job.id,
            title: job.title,
            subtitle: job.company.name,
            href: `/opdrachten/${job.id}`,
            score,
          });
        }
      }

      for (const collab of collaborations) {
        const score = bestFieldScore([collab.job.title, collab.company.name], q);
        if (score > 0) {
          results.push({
            type: "samenwerking",
            id: collab.id,
            title: collab.job.title,
            subtitle: collab.company.name,
            href: `/samenwerkingen/${collab.id}`,
            score,
          });
        }
      }

      for (const cred of credentials) {
        const score = bestFieldScore([cred.title, cred.issuer, cred.type], q);
        if (score > 0) {
          results.push({
            type: "certificaat",
            id: cred.id,
            title: cred.title,
            subtitle: cred.issuer ?? cred.type,
            href: `/certificaten/${cred.id}/bewerken`,
            score,
          });
        }
      }

      for (const invoice of invoices) {
        const score = bestFieldScore([invoice.number], q);
        if (score > 0) {
          results.push({
            type: "factuur",
            id: invoice.id,
            title: invoice.number,
            href: `/facturen/${invoice.id}`,
            score,
          });
        }
      }

      for (const conv of conversations) {
        const otherName = conv.participants[0]?.user.name ?? "Gesprek";
        const jobTitle = conv.job?.title;
        const score = bestFieldScore([otherName, jobTitle], q);
        if (score > 0) {
          results.push({
            type: "bericht",
            id: conv.id,
            title: otherName,
            subtitle: jobTitle ?? undefined,
            href: `/berichten/${conv.id}`,
            score,
          });
        }
      }

      return rankResults(results);
    }

    case "CLIENT": {
      const [jobs, collaborations, invoices, conversations] = await Promise.all([
        prisma.job.findMany({
          where: { company: { userId: actor.id } },
          take: 40,
          orderBy: { updatedAt: "desc" },
        }),
        prisma.collaboration.findMany({
          where: { company: { userId: actor.id } },
          take: 40,
          orderBy: { updatedAt: "desc" },
          include: { job: { select: { title: true } } },
        }),
        prisma.invoice.findMany({
          where: { collaboration: { company: { userId: actor.id } } },
          take: 40,
          orderBy: { updatedAt: "desc" },
        }),
        conversationQuery,
      ]);

      const results: SearchResult[] = [];

      for (const job of jobs) {
        const score = bestFieldScore([job.title, job.description], q);
        if (score > 0) {
          results.push({
            type: "opdracht",
            id: job.id,
            title: job.title,
            href: `/opdrachten/${job.id}`,
            score,
          });
        }
      }

      for (const collab of collaborations) {
        const score = bestFieldScore([collab.job.title], q);
        if (score > 0) {
          results.push({
            type: "samenwerking",
            id: collab.id,
            title: collab.job.title,
            href: `/samenwerkingen/${collab.id}`,
            score,
          });
        }
      }

      for (const invoice of invoices) {
        const score = bestFieldScore([invoice.number], q);
        if (score > 0) {
          results.push({
            type: "factuur",
            id: invoice.id,
            title: invoice.number,
            href: `/facturen/${invoice.id}`,
            score,
          });
        }
      }

      for (const conv of conversations) {
        const otherName = conv.participants[0]?.user.name ?? "Gesprek";
        const jobTitle = conv.job?.title;
        const score = bestFieldScore([otherName, jobTitle], q);
        if (score > 0) {
          results.push({
            type: "bericht",
            id: conv.id,
            title: otherName,
            subtitle: jobTitle ?? undefined,
            href: `/berichten/${conv.id}`,
            score,
          });
        }
      }

      return rankResults(results);
    }

    case "ADMIN": {
      const [users, conversations] = await Promise.all([
        prisma.user.findMany({
          take: 40,
          orderBy: { updatedAt: "desc" },
          select: { id: true, name: true, email: true, role: true },
        }),
        conversationQuery,
      ]);

      const results: SearchResult[] = [];

      for (const user of users) {
        const score = bestFieldScore([user.name, user.email], q);
        if (score > 0) {
          results.push({
            type: "gebruiker",
            id: user.id,
            title: user.name,
            subtitle: user.email,
            href: `/admin/gebruikers?q=${encodeURIComponent(user.email)}`,
            score,
          });
        }
      }

      for (const conv of conversations) {
        const otherName = conv.participants[0]?.user.name ?? "Gesprek";
        const jobTitle = conv.job?.title;
        const score = bestFieldScore([otherName, jobTitle], q);
        if (score > 0) {
          results.push({
            type: "bericht",
            id: conv.id,
            title: otherName,
            subtitle: jobTitle ?? undefined,
            href: `/berichten/${conv.id}`,
            score,
          });
        }
      }

      return rankResults(results);
    }

    default:
      return [];
  }
}
