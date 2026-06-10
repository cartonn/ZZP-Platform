import { type Metadata } from "next";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { verifyDossierToken } from "@/lib/share-token";
import { computeTrustLevel } from "@/lib/trust";
import { mandatoryDocuments } from "@/lib/mandatory-documents";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { audit } from "@/lib/audit";
import { formatDateNl } from "@/lib/format-date";
import { type CredentialType } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { TrustBadge } from "@/components/trust/trust-badge";

export const metadata: Metadata = { title: "Vertrouwensdossier · ZZP Platform" };

const SOURCE_LABEL: Record<string, string> = {
  ADMIN: "ZZP Platform",
  DUO: "DUO",
  BIG: "BIG-register",
};

export default async function TrustDossierPage({
  params,
}: {
  params: Promise<{ profileId: string; token: string }>;
}) {
  const { profileId, token } = await params;

  const secret = process.env.AUTH_SECRET ?? "";
  const validToken = secret ? verifyDossierToken(profileId, token, secret) : false;

  // Laad het profiel — altijd, ook bij ongeldig token, want we willen geen
  // informatielek (bestaat of bestaat niet). De validatie daarna bepaalt wat getoond wordt.
  const profile = await prisma.freelancerProfile.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      visibility: true,
      headline: true,
      user: { select: { name: true, identityVerifiedAt: true } },
      credentials: {
        where: { status: "VERIFIED" },
        select: {
          id: true,
          type: true,
          title: true,
          issuer: true,
          expiresAt: true,
          verifiedAt: true,
          verifications: {
            where: { decision: "VERIFIED" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { source: true },
          },
        },
      },
    },
  });

  // Token ongeldig of profiel niet PUBLIC → één neutrale melding (geen informatielek).
  const isShared = validToken && profile?.visibility === "PUBLIC";

  if (!isShared) {
    return (
      <div className="min-h-screen bg-muted/30">
        <header className="border-b border-border bg-background">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                Z
              </div>
              <span className="text-sm font-semibold">ZZP Platform</span>
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <ShieldCheck className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <h1 className="mt-4 text-xl font-semibold tracking-tight">
            Dit dossier is niet (meer) gedeeld
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            De ZZP&apos;er heeft het dossier niet openbaar gemaakt of de link is niet meer geldig.
          </p>
        </main>
      </div>
    );
  }

  // Audit: elke weergave wordt gelogd (CLAUDE.md regel 5).
  await audit({
    actorId: null,
    action: "TRUST_DOSSIER_VIEWED",
    entityType: "FreelancerProfile",
    entityId: profileId,
  });

  const now = Date.now();
  const activeVerified = profile.credentials.filter(
    (c) => !c.expiresAt || c.expiresAt.getTime() > now,
  );

  const trust = computeTrustLevel({
    identityVerified: !!profile.user.identityVerifiedAt,
    verifiedCredentialCount: activeVerified.length,
    mandatoryDocsComplete: mandatoryDocuments(
      activeVerified.map((c) => ({
        type: c.type as CredentialType,
        status: "VERIFIED" as const,
        expiresAt: c.expiresAt,
      })),
    ).allSatisfied,
  });

  const today = formatDateNl(new Date());

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              Z
            </div>
            <span className="text-sm font-semibold">ZZP Platform</span>
          </Link>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Inloggen
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        {/* Koptekst: naam + functie + vertrouwenszegel */}
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="break-words text-xl font-semibold tracking-tight">
                  {profile.user.name}
                </h1>
                <TrustBadge level={trust.level} />
              </div>
              {profile.headline && (
                <p className="mt-1 text-sm text-muted-foreground">{profile.headline}</p>
              )}
            </div>
          </div>

          {/* Onderbouwing van het vertrouwensniveau */}
          {trust.reasons.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {trust.reasons.map((r) => (
                <li key={r} className="flex items-center gap-2 text-sm">
                  <Check className="size-3.5 shrink-0 text-success" aria-hidden />
                  {r}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Geverifieerde certificaten (metadata, nooit bestanden) */}
        {activeVerified.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold tracking-tight">Geverifieerde certificaten</h2>
            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              {activeVerified.map((c) => {
                const src = c.verifications[0]?.source ?? "ADMIN";
                const srcLabel = SOURCE_LABEL[src] ?? src;
                return (
                  <div key={c.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{c.title}</p>
                      <p className="metadata-row mt-0.5">
                        {CREDENTIAL_TYPE_LABEL[c.type as CredentialType]}
                        {c.issuer ? ` · ${c.issuer}` : ""}
                        {" · "}
                        Geverifieerd via {srcLabel}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {c.expiresAt && (
                        <span className="text-xs text-muted-foreground">
                          Geldig t/m {formatDateNl(c.expiresAt)}
                        </span>
                      )}
                      <Badge variant="success">Geverifieerd</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="rounded-lg border border-border bg-card p-5 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">
              Dit dossier bevat nog geen geverifieerde certificaten.
            </p>
          </section>
        )}

        {/* Verificatieverklaring */}
        <div className="flex items-start gap-2 rounded-lg border border-border bg-card p-4 shadow-sm">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              Servergeverifieerd door ZZP Platform
            </span>{" "}
            — gecontroleerd op {today}. De certificaten en het vertrouwensniveau zijn door ZZP
            Platform handmatig geverifieerd. De bestanden zelf zijn niet openbaar beschikbaar.
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Dit dossier is gedeeld door de ZZP&apos;er. Kijk voor meer informatie op{" "}
          <Link href="/login" className="underline hover:text-foreground">
            ZZP Platform
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
