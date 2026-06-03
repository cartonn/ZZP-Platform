"use client";

// Beoordeel-bodies voor de Actiecentrum-drawer: eerst het artefact INZIEN (bewijsstuk-document /
// factuurregels / urendetails + ORT), dan goedkeuren of afwijzen-met-reden. De beslissing loopt via
// de ResolveState-wrappers rond de bestaande server-acties (auth/ownership/audit blijven server-side);
// bij succes vuurt onResolved → drawer sluit + doorvloeien. Een fout wordt inline getoond.

import { useActionState, useEffect } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatEuro } from "@/lib/invoices";
import { computeOrt, resolveOrtRates, type OrtSegment } from "@/lib/ort";
import { ORT_CATEGORY_LABEL, type OrtCategory } from "@/lib/config";
import { type ResolveState } from "@/lib/actions/resolve-state";
import { type DrawerData, type ReviewDocument } from "@/lib/actions/drawer-data";
import {
  approvePerformanceState,
  rejectPerformanceState,
  approveInvoiceState,
  rejectInvoiceState,
} from "@/app/(protected)/samenwerkingen/[id]/actions";
import {
  verifyCredentialState,
  rejectCredentialState,
} from "@/app/(protected)/admin/verificaties/actions";

type StateAction = (prev: ResolveState, formData: FormData) => Promise<ResolveState>;

/** Goedkeuren (één knop) + afwijzen-met-verplichte-reden, allebei met succes-/fout-afhandeling. */
function ApproveRejectControls({
  approve,
  reject,
  onResolved,
  approveLabel = "Goedkeuren",
}: {
  approve: StateAction;
  reject: StateAction;
  onResolved: () => void;
  approveLabel?: string;
}) {
  const [aState, aForm, aPending] = useActionState<ResolveState, FormData>(approve, undefined);
  const [rState, rForm, rPending] = useActionState<ResolveState, FormData>(reject, undefined);
  useEffect(() => {
    if (aState && "ok" in aState) onResolved();
  }, [aState, onResolved]);
  useEffect(() => {
    if (rState && "ok" in rState) onResolved();
  }, [rState, onResolved]);

  return (
    <div className="space-y-3 border-t border-border pt-4">
      {aState && "error" in aState ? (
        <p role="alert" className="text-sm text-danger">
          {aState.error}
        </p>
      ) : null}
      <form action={aForm}>
        <Button type="submit" disabled={aPending} className="w-full">
          {aPending ? "Bezig…" : approveLabel}
        </Button>
      </form>
      <details>
        <summary className="focus-ring inline-flex h-8 cursor-pointer list-none items-center rounded-lg px-3 text-sm text-danger transition-colors hover:bg-muted [&::-webkit-details-marker]:hidden">
          Afwijzen met reden
        </summary>
        <form action={rForm} className="mt-2 space-y-2">
          <textarea
            name="reason"
            required
            minLength={3}
            maxLength={500}
            rows={3}
            placeholder="Waarom wordt dit afgewezen? (verplicht)"
            aria-label="Reden voor afwijzing"
            className="focus-ring w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          {rState && "error" in rState ? (
            <p role="alert" className="text-sm text-danger">
              {rState.error}
            </p>
          ) : null}
          <Button type="submit" variant="danger" size="sm" disabled={rPending} className="w-full">
            {rPending ? "Bezig…" : "Bevestig afwijzing"}
          </Button>
        </form>
      </details>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

/** Bewijsstuk openen: het geüploade document (PDF/afbeelding) opent in een nieuw tabblad via de
 *  geauditeerde /api/documents-route (top-level navigatie — niet geblokkeerd door framing-headers,
 *  en elke view wordt geaudit). Eerst openen + lezen, dan pas beslissen. */
function OpenDocumentButton({ doc }: { doc: ReviewDocument | null }) {
  if (!doc) {
    return <p className="text-sm text-muted-foreground">Geen bewijsstuk geüpload.</p>;
  }
  return (
    <Button asChild variant="secondary" className="w-full">
      <a href={`/api/documents/${doc.id}`} target="_blank" rel="noreferrer">
        <FileText className="size-4" aria-hidden />
        Open bewijsstuk — {doc.filename}
      </a>
    </Button>
  );
}

export function CredentialReviewBody({
  data,
  onResolved,
}: {
  data: Extract<DrawerData, { kind: "admin-verify-credential" }>;
  onResolved: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 p-3">
        <DetailRow label="Soort" value={data.typeLabel} />
        <DetailRow label="Titel" value={data.title} />
        <DetailRow label="Uitgever" value={data.issuer} />
        <DetailRow label="Uitgegeven" value={data.issuedAt} />
        <DetailRow label="Verloopt" value={data.expiresAt} />
        <DetailRow label="Ingediend door" value={data.submittedBy} />
      </div>
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          Bewijsstuk — open en controleer voordat je beslist
        </p>
        <OpenDocumentButton doc={data.document} />
      </div>
      <ApproveRejectControls
        approve={verifyCredentialState.bind(null, data.credId)}
        reject={rejectCredentialState.bind(null, data.credId)}
        onResolved={onResolved}
        approveLabel="Goedkeuren — verifieer certificaat"
      />
    </div>
  );
}

export function InvoiceReviewBody({
  data,
  onResolved,
}: {
  data: Extract<DrawerData, { kind: "invoice-approve" }>;
  onResolved: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 p-3">
        <DetailRow label="Factuurnummer" value={data.number} />
        <DetailRow label="Opdracht" value={data.jobTitle} />
        <DetailRow label="Van" value={data.fromName} />
        <DetailRow label="Factuurdatum" value={data.issuedAt} />
        <DetailRow label="Vervaldatum" value={data.dueAt} />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          Factuur — open en controleer voordat je beslist
        </p>
        <Button asChild variant="secondary" className="w-full">
          <a href={`/api/facturen/${data.invId}/pdf`} target="_blank" rel="noreferrer">
            <FileText className="size-4" aria-hidden />
            Open factuur (PDF)
          </a>
        </Button>
      </div>

      <div className="space-y-1 border-t border-border pt-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotaal excl. btw</span>
          <span className="tabular-nums">{formatEuro(data.subtotalCents)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Btw</span>
          <span className="tabular-nums">{formatEuro(data.vatCents)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Totaal incl. btw</span>
          <span className="tabular-nums">{formatEuro(data.totalCents)}</span>
        </div>
      </div>

      <ApproveRejectControls
        approve={approveInvoiceState.bind(null, data.invId, data.collabId)}
        reject={rejectInvoiceState.bind(null, data.invId, data.collabId)}
        onResolved={onResolved}
        approveLabel="Goedkeuren — factuur akkoord"
      />
    </div>
  );
}

function parseSegments(raw: string | null): OrtSegment[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as OrtSegment[]) : [];
  } catch {
    return [];
  }
}

function OrtBreakdown({
  segments,
  rateCents,
  ortProfile,
  ortCustomRates,
}: {
  segments: OrtSegment[];
  rateCents: number;
  ortProfile: string | null;
  ortCustomRates: string | null;
}) {
  const result = computeOrt(segments, rateCents, resolveOrtRates({ ortProfile, ortCustomRates }));
  if (result.lines.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">ORT-uitsplitsing</p>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th className="py-0.5 font-normal">Categorie</th>
            <th className="py-0.5 text-right font-normal">Uren</th>
            <th className="py-0.5 text-right font-normal">Toeslag</th>
            <th className="py-0.5 text-right font-normal">Totaal</th>
          </tr>
        </thead>
        <tbody>
          {result.lines.map((line, i) => (
            <tr key={i} className="border-t border-border/40">
              <td className="py-0.5">
                {line.category === "NORMAL"
                  ? "Regulier"
                  : ORT_CATEGORY_LABEL[line.category as OrtCategory]}
              </td>
              <td className="py-0.5 text-right tabular-nums">{line.hours}</td>
              <td className="py-0.5 text-right tabular-nums">
                {line.surchargeCents > 0
                  ? `+${formatEuro(line.surchargeCents)} (${Math.round(line.surchargeBps / 100)}%)`
                  : "—"}
              </td>
              <td className="py-0.5 text-right font-medium tabular-nums">
                {formatEuro(line.totalCents)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border">
            <td colSpan={3} className="py-0.5 font-medium">
              Subtotaal excl. btw
            </td>
            <td className="py-0.5 text-right font-semibold tabular-nums">
              {formatEuro(result.subtotalCents)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function PerformanceReviewBody({
  data,
  onResolved,
}: {
  data: Extract<DrawerData, { kind: "performance-approve" }>;
  onResolved: () => void;
}) {
  const isMilestone = data.perfType === "MILESTONE";
  const segments = parseSegments(data.ortSegments);
  const period =
    data.periodStart && data.periodEnd ? `${data.periodStart} – ${data.periodEnd}` : "";
  const hoursLine =
    data.hours != null
      ? `${data.hours} uur${data.rateCents ? ` × ${formatEuro(data.rateCents)}` : ""}`
      : "";

  return (
    <div className="space-y-4">
      <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 p-3">
        <DetailRow label="Soort" value={isMilestone ? "Oplevering" : "Urenstaat"} />
        <DetailRow label="Opdracht" value={data.jobTitle} />
        <DetailRow label="ZZP'er" value={data.freelancerName} />
        {isMilestone ? (
          <>
            <DetailRow label="Oplevering" value={data.milestoneTitle ?? ""} />
            <DetailRow
              label="Bedrag"
              value={data.amountCents != null ? formatEuro(data.amountCents) : ""}
            />
          </>
        ) : (
          <>
            <DetailRow label="Periode" value={period} />
            <DetailRow label="Uren" value={hoursLine} />
          </>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          {isMilestone ? "Oplevering" : "Urenstaat"} — open en controleer voordat je beslist
        </p>
        <Button asChild variant="secondary" className="w-full">
          <a href={`/api/prestaties/${data.perfId}/pdf`} target="_blank" rel="noreferrer">
            <FileText className="size-4" aria-hidden />
            Open {isMilestone ? "oplevering" : "urenstaat"} (PDF)
          </a>
        </Button>
      </div>

      {data.description ? (
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Omschrijving</p>
          <p className="whitespace-pre-wrap text-sm">{data.description}</p>
        </div>
      ) : null}

      {!isMilestone && data.rateCents && segments.length > 0 ? (
        <OrtBreakdown
          segments={segments}
          rateCents={data.rateCents}
          ortProfile={data.ortProfile}
          ortCustomRates={data.ortCustomRates}
        />
      ) : null}

      <ApproveRejectControls
        approve={approvePerformanceState.bind(null, data.perfId, data.collabId)}
        reject={rejectPerformanceState.bind(null, data.perfId, data.collabId)}
        onResolved={onResolved}
        approveLabel="Goedkeuren"
      />
    </div>
  );
}
