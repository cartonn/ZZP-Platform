import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type CascadeStepStatus = "done" | "active" | "waiting" | "error";

/**
 * De status van een stap is visueel alleen af te lezen aan kleur en icoon (het bolletje is
 * `aria-hidden`). Deze woorden geven diezelfde status aan screenreaders — anders klinken een
 * afgeronde en een mislukte stap identiek (WCAG 1.4.1, niet-kleurafhankelijk).
 */
const STATUS_LABEL: Record<CascadeStepStatus, string> = {
  done: "afgerond",
  active: "aan zet",
  waiting: "wacht",
  error: "fout",
};

export interface CascadeStep {
  label: string;
  status: CascadeStepStatus;
  /** Optionele toelichting onder het label, bv. "getekend 2 jun" of "aan zet". */
  detail?: string;
}

/**
 * Cascade-stepper (DESIGN.md — Vakwerk-signatuur): de keten contract → uren →
 * akkoord → factuur → betaald als horizontale stappen. Afgerond = zegelgroen,
 * huidige stap = merkkleur met ring, wachtend = gedempt, fout = danger.
 * Op smalle schermen stapelt de lijst verticaal.
 */
export function CascadeStepper({ steps, className }: { steps: CascadeStep[]; className?: string }) {
  return (
    <ol className={cn("flex flex-col gap-3 sm:flex-row sm:gap-0", className)}>
      {steps.map((step, i) => (
        <li
          key={step.label}
          aria-current={step.status === "active" ? "step" : undefined}
          className="relative flex items-center gap-3 sm:flex-1 sm:flex-col sm:gap-0 sm:text-center"
        >
          {/* Verbindingslijn naar de vorige stap (alleen horizontaal). */}
          {i > 0 && (
            <span
              aria-hidden
              className={cn(
                "absolute left-[-50%] right-1/2 top-3 hidden h-0.5 sm:block",
                step.status === "done" || step.status === "active" ? "bg-success" : "bg-border",
              )}
            />
          )}
          <span
            aria-hidden
            className={cn(
              "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-semibold",
              step.status === "done" && "border-success bg-success text-white",
              step.status === "active" &&
                "border-primary bg-card text-primary ring-4 ring-primary/15",
              step.status === "waiting" && "border-border bg-card text-muted-foreground",
              step.status === "error" && "border-danger bg-danger text-white",
            )}
          >
            {step.status === "done" ? (
              <Check className="size-3.5" strokeWidth={3} />
            ) : step.status === "error" ? (
              <X className="size-3.5" strokeWidth={3} />
            ) : (
              i + 1
            )}
          </span>
          <span className="min-w-0 sm:mt-2">
            <span
              className={cn(
                "block text-xs font-medium",
                step.status === "active" && "text-primary",
                step.status === "waiting" && "text-muted-foreground",
                step.status === "error" && "text-danger",
              )}
            >
              {step.label}
              <span className="sr-only"> — {STATUS_LABEL[step.status]}</span>
            </span>
            {step.detail && (
              <span className="block text-[11px] text-muted-foreground sm:mt-0.5">
                {step.detail}
              </span>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}
