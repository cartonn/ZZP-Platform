import { BrandMark } from "@/components/ui/brand-mark";
import { type Metadata } from "next";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { dossierViewRateLimiter } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request-meta";
import { verifyDossierToken, shareTokenSecret } from "@/lib/share-token";
import { computeTrustLevel } from "@/lib/trust";
import { getFreelancerTrackRecord } from "@/lib/data/freelancer-track-record";
import { trackRecordHighlights } from "@/lib/freelancer-track-record";
import { mandatoryDocuments } from "@/lib/mandatory-documents";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { audit } from "@/lib/audit";
import { formatDateNl } from "@/lib/format-date";
import { type CredentialType } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { TrustBadge } from "@/components/trust/trust-badge";

export const metadata: Metadata = { title: "Vertrouwensdossier · Handslag" };

const SOURCE_LABEL: Record<string, string> = {
  ADMIN: "Handslag",
  DUO: "DUO",
  BIG: "BIG-register",
};

export default async function TrustDossierPage({
  params,
}: {
  params: Promise<{ profileId: string; token: string }>;
}) {
  const { profileId, token } = await params;

  // Brute-force-/scrape-rem (security-review M-4): sessieloze route, dus per IP begrensd.
  // Bij overschrijding tonen we dezelfde 404 als bij een ongeldig token (geen oracle).
  const { ipAddress } = await requestMeta();
  if (!(await dossierViewRateLimiter.check(`dossier:${ipAddress ?? "onbekend"}`)).allowed) {
    notFound();
  }

  const secret = shareTokenSecret();
  const validToken = secret ? verifyDossierToken(profileId, token, secret) : false;

  // Laad het profiel — altijd, ook bij ongeldig token, want we willen geen
  // informatielek (bestaat of bestaat niet). De validatie daarna bepaalt wat getoond wordt.
  const profile = await prisma.freelancerProfile.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      visibility: true,
      tenantId: true,
      headline: true,
      user: {
        select: { name: true, identityVerifiedAt: true, status: true, anonymizedAt: true },
      },
      // Alleen VERIFIED-certificaten die de ZZP'er expliciet OPENBAAR maakte (`visibility: "PUBLIC"`).
      // `Credential.visibility` staat standaard op PRIVATE en is een per-certificaat consent-toggle op
      // /certificaten; de sibling publieke viewer `/zzp/[id]` (`profile-screen.tsx` → `publicCredentials`)
      // honoreert 'm al. Zonder deze filter lekte dit niet-verlopende publieke bearer-dossier élk
      // geverifieerd certificaat (incl. een PRIVÉ-gehouden VOG/BIG/diploma) bij naam/type/uitgever én
      // telde het mee in het vertrouwensniveau en de verplichte-documenten-check — een schending van de
      // door de betrokkene gegeven toestemming (OWASP A01, inconsistente autorisatie tussen twee views
      // op dezelfde data; AVG art. 5(1)(a)/(b) doelbinding/grondslag). Filter in de query zodat PRIVÉ-
      // certificaten deze route nooit verlaten.
      credentials: {
        where: { status: "VERIFIED", visibility: "PUBLIC" },
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

  // Token ongeldig of profiel niet deelbaar → één neutrale melding (geen informatielek). Naast
  // token + PUBLIC-zichtbaarheid gelden hier dezelfde server-side-waarheidspoorten als op de
  // sibling-viewer `/zzp/[id]` (profile-screen.tsx) en de agenda-feed-fix (#630):
  //   1. Account-liveness (CLAUDE.md regel 1): een geschorst of geanonimiseerd account mag zijn
  //      vertrouwensdossier — naam + VERIFIED-certificaten + "Servergeverifieerd door Handslag" —
  //      niet blijven serveren op een niet-verlopende publieke bearer-URL. Schorsing/anonimisering
  //      raakt `visibility` niet, dus zonder deze poort overleeft het deterministische token de
  //      statuswijziging (AVG art. 17; OWASP A01 — stale server-side status vertrouwen).
  //   2. Tenant-isolatie: een tenant-gebonden roster-ZZP'er (franchise, `createZzper` zet standaard
  //      `visibility: "PUBLIC"` + `tenantId`) is elders per tenant afgeschermd (`tenantEntityVisibleTo`).
  //      Deze ongeauthenticeerde publieke deel-URL heeft geen viewer, dus geldt de anonieme regel:
  //      alleen een niet-tenant-gebonden (directe) ZZP'er is hier deelbaar (`tenantId === null`).
  const isShared =
    validToken &&
    profile?.visibility === "PUBLIC" &&
    profile.user.status === "ACTIVE" &&
    !profile.user.anonymizedAt &&
    profile.tenantId === null;

  if (!isShared) {
    return (
      <div className="min-h-screen bg-muted/30">
        <header className="border-b border-border bg-background">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <BrandMark size={28} />
              <span className="font-display text-sm font-semibold">Handslag</span>
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

  // Feitelijke staat van dienst: afgeronde samenwerkingen + gewerkte uren. Alleen binnen het
  // geautoriseerde pad opgehaald (na de deel-poort), drempel-gegate zodat een net-gestarte ZZP'er
  // nooit met magere "0"-cijfers pronkt (trackRecordHighlights) — dan dragen de certificaten alleen.
  const trackRecord = await getFreelancerTrackRecord(profileId);
  const trackHighlights = trackRecordHighlights(trackRecord);

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
            <BrandMark size={28} />
            <span className="font-display text-sm font-semibold">Handslag</span>
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

        {/* Staat van dienst: feitelijke, servergetelde ervaring. Alleen boven de drempel getoond
            (>= 1 afgeronde klus / >= 8 uur) zodat magere cijfers nooit verschijnen. */}
        {trackHighlights.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold tracking-tight">Staat van dienst</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
              {trackHighlights.map((h) => (
                <div
                  key={h.label}
                  className="rounded-lg border border-border bg-card p-4 text-center shadow-sm"
                >
                  <p className="text-2xl font-semibold tabular-nums tracking-tight">{h.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{h.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Feitelijke ervaring, geteld op Handslag uit afgeronde samenwerkingen en goedgekeurde
              uren.
            </p>
          </section>
        )}

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
            <span className="font-medium text-foreground">Servergeverifieerd door Handslag</span> —
            gecontroleerd op {today}. De certificaten en het vertrouwensniveau zijn door ZZP
            Platform handmatig geverifieerd. De bestanden zelf zijn niet openbaar beschikbaar.
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Dit dossier is gedeeld door de ZZP&apos;er. Kijk voor meer informatie op{" "}
          <Link href="/login" className="underline hover:text-foreground">
            Handslag
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
