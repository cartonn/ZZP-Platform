"use client";

import { AlertTriangle, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type ReachSummary } from "@/lib/job-reach";
import { type JobReachEstimate } from "@/app/(protected)/opdrachten/actions";

// Compacte dot+label-chip. Bewust lokaal i.p.v. de gedeelde `signal-chips`-variant: dat
// servermodule trekt `@/lib/i18n/server` mee en mag daarom niet in dit client-component landen.
function LevelChip({ dotClass, label }: { dotClass: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span className={`size-2 rounded-full ${dotClass}`} aria-hidden />
      {label}
    </span>
  );
}

// Compacte bereik-check die de opdrachtgever tijdens het opstellen van een concept-opdracht laat
// zien hoeveel passende ZZP'ers de plaatsing zou bereiken en wat het grootste knelpunt is — zodat
// eisen/tarief/werkvorm nog vóór publicatie zijn bij te sturen. Spiegelt bewust de toon, kleuren en
// taal van JobReachCard (post-publicatie), maar compacter omdat het in het formulier staat.
// Presentationeel: het bereik is server-side berekend (estimateJobReach); deze component beslist niets.

const LEVEL_STYLE: Record<ReachSummary["level"], { dot: string; hint: string }> = {
  good: { dot: "bg-success", hint: "text-success" },
  moderate: { dot: "bg-warning", hint: "text-warning" },
  low: { dot: "bg-muted-foreground", hint: "text-muted-foreground" },
};

const LEVEL_LABEL: Record<ReachSummary["level"], string> = {
  good: "Goed bereik",
  moderate: "Beperkt bereik",
  low: "Klein bereik",
};

export function JobReachPreview({
  estimate,
  loading,
}: {
  estimate: JobReachEstimate | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card className="p-5">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Users className="size-4" aria-hidden /> Bereik-check
        </p>
        <p className="mt-2 text-sm text-muted-foreground">Bereik berekenen…</p>
      </Card>
    );
  }

  // Te weinig onderscheidende eisen (of geen toegang) → niets tonen; een lege kaart zou ruis zijn.
  if (!estimate || !estimate.ok) return null;

  const { reach } = estimate;
  const style = LEVEL_STYLE[reach.level];
  // Grootste knelpunt alleen tonen bij niet-goed bereik — bij goed bereik is er geen sturingsactie.
  const bottleneck = reach.level === "good" ? null : reach.bottleneck;

  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Users className="size-4" aria-hidden /> Bereik-check
        </p>
        <LevelChip dotClass={style.dot} label={LEVEL_LABEL[reach.level]} />
      </div>

      <p className="text-xs text-muted-foreground">
        Een indicatie vóór publicatie: hoeveel passende ZZP&apos;ers deze concept-opdracht zou
        bereiken.
      </p>

      {reach.total === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nog geen passende ZZP&apos;ers gevonden voor deze eisen.
        </p>
      ) : (
        <p className="text-sm">
          <span className="font-mono text-lg font-semibold tabular-nums tracking-tight">
            ≈ {reach.total}
          </span>{" "}
          <span className="text-muted-foreground">
            passende ZZP&apos;ers, waarvan{" "}
            <span className="font-medium text-foreground">{reach.available}</span> nu beschikbaar
          </span>
        </p>
      )}

      {reach.hint && <p className={`text-xs ${style.hint}`}>{reach.hint}</p>}

      {bottleneck && (
        <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <div className="space-y-1">
            <Badge variant="warning">{bottleneck.label}</Badge>
            <p className="text-xs text-muted-foreground">{bottleneck.hint}</p>
          </div>
        </div>
      )}
    </Card>
  );
}
