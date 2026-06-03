// Actiecentrum-inbox (server-gerenderd). Elke openstaande taak is één rij; de resolver-knoppen
// zijn <form>'s met een gebonden server-actie. Na een geslaagde actie revalideert die actie /acties
// → de RSC re-rendert → de afgehandelde taak verdwijnt en de volgende staat klaar (auto-advance,
// zonder client-state). Reden-bij-afwijzen zit in een native <details>-popover (geen client-JS).
//
// Inc. 1 handelt inline af: één-klik (tekenen/indienen/betaling/activeren/dispuut) en goedkeuren/
// afwijzen (prestatie/factuur/certificaat). De drawer-/reply-/link-soorten openen voorlopig de
// bestaande pagina (deep-link); Inc. 2 maakt die inline in een slide-over.

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Info, type LucideIcon } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/actions/submit-button";
import { type PendingTask, type TaskTone } from "@/lib/actions/tasks";
import { cn } from "@/lib/utils";
import {
  signContractAction,
  approvePerformanceAction,
  rejectPerformanceAction,
  submitInvoiceAction,
  approveInvoiceAction,
  rejectInvoiceAction,
  confirmPaymentAction,
  resolveDisputeAction,
} from "@/app/(protected)/samenwerkingen/[id]/actions";
import { verifyCredential, rejectCredential } from "@/app/(protected)/admin/verificaties/actions";
import { setUserStatus } from "@/app/(protected)/admin/gebruikers/actions";

type FormAction = (formData: FormData) => void | Promise<void>;

const TONE: Record<TaskTone, { Icon: LucideIcon; className: string }> = {
  attention: { Icon: AlertTriangle, className: "text-warning" },
  info: { Icon: Info, className: "text-muted-foreground" },
  success: { Icon: CheckCircle2, className: "text-success" },
};

function ToneIcon({ tone }: { tone: TaskTone }) {
  const { Icon, className } = TONE[tone];
  return <Icon className={cn("mt-0.5 size-4 shrink-0", className)} aria-hidden />;
}

function OneClick({
  action,
  label,
  variant = "primary",
}: {
  action: FormAction;
  label: string;
  variant?: ButtonProps["variant"];
}) {
  return (
    <form action={action}>
      <SubmitButton size="sm" variant={variant} pendingLabel="Bezig…">
        {label}
      </SubmitButton>
    </form>
  );
}

function ApproveReject({ approve, reject }: { approve: FormAction; reject: FormAction }) {
  return (
    <div className="flex items-center gap-2">
      <form action={approve}>
        <SubmitButton size="sm" pendingLabel="Bezig…">
          Goedkeuren
        </SubmitButton>
      </form>
      <details className="relative">
        <summary className="focus-ring inline-flex h-8 cursor-pointer list-none items-center rounded-lg px-3 text-sm text-danger transition-colors hover:bg-muted [&::-webkit-details-marker]:hidden">
          Afwijzen
        </summary>
        <form
          action={reject}
          className="absolute right-0 z-20 mt-2 w-72 space-y-2 rounded-lg border border-border bg-card p-3 text-left shadow-md"
        >
          <label className="block text-xs font-medium text-muted-foreground">
            Reden voor afwijzing
          </label>
          <textarea
            name="reason"
            required
            rows={2}
            placeholder="Wat moet er anders?"
            className="focus-ring w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          />
          <SubmitButton variant="danger" size="sm" className="w-full" pendingLabel="Bezig…">
            Bevestig afwijzing
          </SubmitButton>
        </form>
      </details>
    </div>
  );
}

function OpenLink({ href, label = "Openen" }: { href: string; label?: string }) {
  return (
    <Button asChild size="sm" variant="secondary">
      <Link href={href}>
        {label}
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </Button>
  );
}

/** Bindt elke taak aan de bestaande server-actie en kiest de juiste inline-vorm. */
function Resolver({ task }: { task: PendingTask }) {
  switch (task.kind) {
    case "contract-sign":
      return <OneClick action={signContractAction.bind(null, task.collabId)} label="Onderteken" />;
    case "invoice-submit":
      return (
        <OneClick
          action={submitInvoiceAction.bind(null, task.invId, task.collabId)}
          label="Indienen"
        />
      );
    case "payment-confirm":
      return (
        <OneClick
          action={confirmPaymentAction.bind(null, task.invId, task.collabId)}
          label="Betaling ontvangen"
          variant="secondary"
        />
      );
    case "admin-activate-user":
      return (
        <OneClick action={setUserStatus.bind(null, task.userId, "ACTIVE")} label="Goedkeuren" />
      );
    case "admin-resolve-dispute":
      return (
        <OneClick
          action={resolveDisputeAction.bind(null, task.collabId)}
          label="Dispuut oplossen"
        />
      );
    case "performance-approve":
      return (
        <ApproveReject
          approve={approvePerformanceAction.bind(null, task.perfId, task.collabId)}
          reject={rejectPerformanceAction.bind(null, task.perfId, task.collabId)}
        />
      );
    case "invoice-approve":
      return (
        <ApproveReject
          approve={approveInvoiceAction.bind(null, task.invId, task.collabId)}
          reject={rejectInvoiceAction.bind(null, task.invId, task.collabId)}
        />
      );
    case "admin-verify-credential":
      return (
        <ApproveReject
          approve={verifyCredential.bind(null, task.credId)}
          reject={rejectCredential.bind(null, task.credId)}
        />
      );
    // Inc. 2 maakt deze inline (slide-over / inline composer); voor nu een deep-link.
    default:
      return <OpenLink href={task.href} />;
  }
}

export function ActionList({ tasks }: { tasks: PendingTask[] }) {
  return (
    <Card>
      <ul className="divide-y divide-border">
        {tasks.map((task) => (
          <li
            key={task.id}
            id={task.id}
            className="flex flex-wrap items-start justify-between gap-3 px-5 py-4"
          >
            <div className="flex min-w-0 items-start gap-3">
              <ToneIcon tone={task.tone} />
              <div className="min-w-0">
                <p className="font-medium leading-snug">{task.title}</p>
                {task.subtitle ? (
                  <p className="truncate text-sm text-muted-foreground">{task.subtitle}</p>
                ) : null}
              </div>
            </div>
            <div className="ml-7 shrink-0 sm:ml-0">
              <Resolver task={task} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
