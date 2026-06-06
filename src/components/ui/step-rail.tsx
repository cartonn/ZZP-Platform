import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Rustige verticale stappen-rail voor geleide flows (DESIGN.md: kaderloos, dicht, geen drukte).
// Puur presentationeel: de aanroeper bepaalt per stap de status. De actieve stap krijgt
// aria-current="step" voor toegankelijkheid; geen interne state.
export interface RailStep {
  key: string;
  label: string;
  sublabel?: string;
  status: "done" | "current" | "todo";
}

export function StepRail({ steps }: { steps: RailStep[] }) {
  return (
    <ol className="space-y-4">
      {steps.map((s) => (
        <li
          key={s.key}
          aria-current={s.status === "current" ? "step" : undefined}
          className="flex gap-3"
        >
          <span
            className={cn(
              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
              s.status === "done" && "border-success bg-success text-white",
              s.status === "current" && "border-primary bg-primary text-primary-foreground",
              s.status === "todo" && "border-border text-muted-foreground",
            )}
          >
            {s.status === "done" ? (
              <Check className="size-3" aria-hidden />
            ) : (
              <span className="size-1.5 rounded-full bg-current" aria-hidden />
            )}
          </span>
          <span className="min-w-0">
            <span
              className={cn(
                "block text-sm font-medium",
                s.status === "todo" && "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
            {s.sublabel && (
              <span className="block truncate text-xs text-muted-foreground">{s.sublabel}</span>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}
