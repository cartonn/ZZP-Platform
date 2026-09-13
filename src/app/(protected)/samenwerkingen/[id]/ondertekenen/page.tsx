import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileCheck2, LockKeyhole } from "lucide-react";
import { requireActor, type Actor } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { canAccessSigningPage, loadSigningView } from "@/lib/signing-service";
import { SIGNING_METHOD_NOTE, SigningEvidenceErasedError } from "@/lib/signing-contract";
import { SigningForm } from "@/components/contracts/signing-form";
import { Seal } from "@/components/ui/seal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SigningSkeleton } from "@/components/contracts/signing-skeleton";
import { signAgreement } from "./actions";

export const metadata = { title: "Overeenkomst ondertekenen · Handslag" };

export default async function SigningPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  // Keep the HTTP 404 decision outside Suspense: a route loading.tsx would commit a soft 200.
  if (!(await canAccessSigningPage(actor, id))) notFound();
  return (
    <Suspense fallback={<SigningSkeleton />}>
      <SigningContent actor={actor} id={id} />
    </Suspense>
  );
}

async function SigningContent({ actor, id }: { actor: Actor; id: string }) {
  let view;
  try {
    view = await loadSigningView(actor, id);
  } catch (error) {
    if (!(error instanceof SigningEvidenceErasedError)) throw error;
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="space-y-4 py-6">
          <h1 className="text-xl font-semibold">Ondertekenbewijs verwijderd</h1>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button asChild variant="secondary">
            <Link href={`/samenwerkingen/${id}`}>Terug naar de samenwerking</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  // The full read rechecks ownership. A concurrent removal/reassignment reveals no content;
  // the initially authorized request has already entered its streaming boundary.
  if (!view)
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="space-y-4 py-6">
          <h1 className="text-xl font-semibold">Overeenkomst niet meer beschikbaar</h1>
          <p className="text-sm text-muted-foreground">
            De beschikbaarheid is intussen gewijzigd. Ga terug naar je samenwerkingen.
          </p>
          <Button asChild variant="secondary">
            <Link href="/samenwerkingen">Terug naar samenwerkingen</Link>
          </Button>
        </CardContent>
      </Card>
    );
  const { col, document, documentHash, party } = view;
  await audit({
    actorId: actor.id,
    action: "CONTRACT_SIGNING_VIEWED",
    entityType: "Collaboration",
    entityId: id,
    metadata: { documentHash },
  });
  const signatures = col.signing?.signatures ?? [];
  const mine = signatures.find((s) => s.party === party && s.actorId === actor.id);
  const complete = signatures.length === 2;
  const open = ["PROPOSED", "ACTIVE"].includes(col.status) && !col.disputedAt;
  const pdfUrl = `/api/samenwerkingen/${encodeURIComponent(id)}/ondertekening`;
  const name = party === "CLIENT" ? document.client.name : document.freelancer.name;
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <Link
        href={`/samenwerkingen/${id}`}
        className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Terug naar de samenwerking
      </Link>
      <header className="flex items-start gap-4">
        <Seal
          tone={complete && !col.disputedAt && col.status !== "CANCELLED" ? "verified" : "pending"}
          size="lg"
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Afspraken die je kunt terugvinden
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            Een handtekening. Heldere afspraken.
          </h1>
          <p className="mt-2 break-words text-sm text-muted-foreground">{document.jobTitle}</p>
        </div>
      </header>
      <Card>
        <CardContent className="py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-semibold">
                {complete
                  ? "Door beide partijen ondertekend"
                  : mine
                    ? "Jouw handtekening staat vast"
                    : "Lees, controleer en onderteken"}
              </p>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                {complete
                  ? "De oorspronkelijke documentversie en het ondertekenbewijs blijven samen beschikbaar."
                  : mine
                    ? "Je medecontractant tekent dezelfde documentversie. Je krijgt bericht zodra beide partijen hebben getekend."
                    : "Je ondertekent de tekst hieronder. De samenwerking start na beide handtekeningen en de vereiste documentcontroles."}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
              <FileCheck2 className="size-4" aria-hidden />
              {signatures.length} van 2
            </span>
          </div>
          <div className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
            {(["FREELANCER", "CLIENT"] as const).map((role) => {
              const signed = signatures.find((s) => s.party === role);
              return (
                <div key={role} className="flex items-start gap-3">
                  <Seal
                    tone={
                      signed && !col.disputedAt && col.status !== "CANCELLED"
                        ? "verified"
                        : "pending"
                    }
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {role === "CLIENT" ? "Opdrachtgever" : "Opdrachtnemer"}
                    </p>
                    <p className="break-words text-sm font-semibold">
                      {role === "CLIENT" ? document.client.name : document.freelancer.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {signed
                        ? `${signed.signerName} · ${signed.signedAt.toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam", dateStyle: "medium", timeStyle: "short" })}`
                        : "Handtekening gevraagd"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card>
          <CardContent className="space-y-6 py-6">
            <div className="border-b border-border pb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                01 · De overeenkomst
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold">{document.content.title}</h2>
              <p className="mt-3 text-sm leading-relaxed">{document.content.intro}</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Vergoeding</dt>
                  <dd className="font-semibold">{document.rateLabel}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Looptijd</dt>
                  <dd>{document.periodLabel}</dd>
                </div>
              </dl>
            </div>
            <article aria-label="Volledige overeenkomst" className="space-y-5 break-words">
              {document.content.articles.map((article) => (
                <section key={article.heading}>
                  <h3 className="font-semibold">{article.heading}</h3>
                  {article.body.map((body, i) => (
                    <p key={i} className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {body}
                    </p>
                  ))}
                </section>
              ))}
            </article>
            <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
              {document.content.note}
            </p>
            <Button asChild variant="secondary" className="w-full">
              <a href={pdfUrl} target="_blank" rel="noreferrer">
                <Download className="size-4" aria-hidden />
                {col.signing ? "Download overeenkomst en bewijs" : "Bekijk de overeenkomst als PDF"}
              </a>
            </Button>
            {col.signing && (
              <Link
                href={`${pdfUrl}?original=1`}
                target="_blank"
                rel="noreferrer"
                className="focus-ring block rounded-lg text-center text-sm text-primary underline underline-offset-4"
              >
                Oorspronkelijke documentversie
              </Link>
            )}
            <a
              href={`${pdfUrl}?format=json`}
              className="focus-ring block rounded-lg text-center text-xs text-muted-foreground underline underline-offset-4"
            >
              Bewijsgegevens downloaden (JSON)
            </a>
          </CardContent>
        </Card>
        <div className="space-y-4 lg:sticky lg:top-24">
          {open && party && !mine ? (
            <SigningForm
              action={signAgreement.bind(null, id)}
              documentHash={documentHash}
              suggestedName={party === "FREELANCER" ? document.freelancer.name : ""}
              representing={name}
              pdfUrl={pdfUrl}
            />
          ) : (
            <Card>
              <CardContent className="space-y-3 py-5">
                <LockKeyhole className="size-5 text-primary" aria-hidden />
                <h2 className="font-semibold">
                  {!open
                    ? "Ondertekenen is gesloten"
                    : mine
                      ? "Je handtekening is opgeslagen"
                      : "Alleen de partijen kunnen tekenen"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {!open
                    ? "Een beëindigde of betwiste samenwerking krijgt geen nieuwe handtekeningen. Eerder vastgelegde handtekeningen blijven als historie zichtbaar."
                    : mine
                      ? "Je hoeft niet opnieuw te tekenen. Hieronder vind je de gegevens van deze documentversie."
                      : "Als beheerder kun je het document en het bewijs inzien, maar niet namens een partij ondertekenen."}
                </p>
              </CardContent>
            </Card>
          )}
          {!col.signing && (col.agreementClientSignedAt || col.agreementFreelancerSignedAt) && (
            <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              Er is een eerder digitaal akkoord geregistreerd. Dat akkoord had nog geen vastgelegd
              document in dit bewijsdossier. Deze flow legt een nieuwe, expliciete handtekening
              vast.
            </p>
          )}
          <details className="rounded-xl border border-border bg-card p-4">
            <summary className="focus-ring cursor-pointer rounded text-sm font-semibold">
              Zo wordt je handtekening vastgelegd
            </summary>
            <div className="mt-3 space-y-3 text-xs leading-relaxed text-muted-foreground">
              <p>{SIGNING_METHOD_NOTE}</p>
              <p>
                We bewaren de ondertekende tekst, het oorspronkelijke PDF-bestand, je naam,
                accountverwijzing, bevestiging en het tijdstip. Je wachtwoord wordt niet in het
                ondertekenbewijs opgeslagen.
              </p>
              <p>Inhoudskenmerk van deze versie:</p>
              <code className="block break-all">{documentHash}</code>
              <p>
                Dit kenmerk helpt wijzigingen aan de vastgelegde inhoud te herkennen. Het is geen
                gekwalificeerd certificaat of gekwalificeerd tijdstempel.
              </p>
              <a
                className="text-primary underline"
                href="https://www.rijksoverheid.nl/vraag-en-antwoord/digitale-overheid/wat-is-een-elektronische-handtekening"
                target="_blank"
                rel="noreferrer"
              >
                Uitleg over elektronische handtekeningen
              </a>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
