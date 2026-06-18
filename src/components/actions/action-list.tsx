// Actiecentrum-inbox (server-gerenderd). Elke openstaande taak is één rij; de resolver-knoppen
// zijn <form>'s met een gebonden server-actie. Na een geslaagde actie revalideert die actie /acties
// → de RSC re-rendert → de afgehandelde taak verdwijnt en de volgende staat klaar (auto-advance,
// zonder client-state). Reden-bij-afwijzen zit in een native <details>-popover (geen client-JS).
//
// Twee inline-vormen: (1) één-klik / goedkeuren-afwijzen direct als server-action-form in de rij;
// (2) drawer-soorten (profiel/bedrijf/certificaat/prestatie/bericht) openen een slide-over die het
// bestaande formulier inline hergebruikt (DrawerResolver). Resterende link-soorten (overdue,
// AVG-verwijderverzoek) zijn deep-links. Alles vloeit door via revalidate / router.refresh().

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Info, type LucideIcon } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/actions/submit-button";
import { DrawerResolver } from "@/components/actions/drawer-resolver";
import { type PendingTask, type TaskTone } from "@/lib/actions/tasks";
import { type DrawerData } from "@/lib/actions/drawer-data";
import { cn } from "@/lib/utils";
import {
  signContractAction,
  submitInvoiceAction,
  confirmPaymentAction,
  resolveDisputeAction,
} from "@/app/(protected)/samenwerkingen/[id]/actions";
import { setUserStatus } from "@/app/(protected)/admin/gebruikers/actions";

type FormAction = (formData: FormData) => void | Promise<void>;

const TONE: Record<TaskTone, { Icon: LucideIcon; className: string }> = {
  attention: { Icon: AlertTriangle, className: "text-primary" },
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

/** Labels voor de drawer-trigger per soort (de drawer-titel = de volledige taaktitel). */
const DRAWER_LABEL: Record<string, string> = {
  "profile-complete": "Afronden",
  "company-complete": "Afronden",
  "credential-fix": "Opnieuw indienen",
  "performance-resubmit": "Corrigeren",
  "message-reply": "Beantwoorden",
  // Inspecteer-dan-beslis: open het artefact (document/factuur/uren) en keur goed of af.
  "admin-verify-credential": "Beoordelen",
  "invoice-approve": "Beoordelen",
  "performance-approve": "Beoordelen",
};

/** Bindt elke taak aan de bestaande server-actie en kiest de juiste inline-vorm. */
function Resolver({
  task,
  drawerData,
}: {
  task: PendingTask;
  drawerData?: Record<string, DrawerData>;
}) {
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
    // Drawer-soorten: open het bestaande formulier of een beoordeel-paneel inline in een slide-over.
    // De beoordeel-soorten (certificaat/factuur/prestatie) tonen eerst het artefact, dan goedkeuren/afwijzen.
    case "profile-complete":
    case "company-complete":
    case "credential-fix":
    case "performance-resubmit":
    case "message-reply":
    case "admin-verify-credential":
    case "invoice-approve":
    case "performance-approve":
      return (
        <DrawerResolver task={task} data={drawerData?.[task.id]} label={DRAWER_LABEL[task.kind]} />
      );
    // Link-soorten (overdue-factuur, AVG-verwijderverzoek): deep-link naar de plek van de handeling.
    default:
      return <OpenLink href={task.href} />;
  }
}

/** Tint per toon voor de held-kaart (eerste actie op het dashboard). */
const HERO_BG: Record<TaskTone, string> = {
  attention: "bg-primary/10",
  info: "bg-accent/50",
  success: "bg-success/10",
};

/**
 * Held-weergave van de meest urgente taak (DESIGN.md §7 — "aan zet"-principe): toon-getint
 * vlak, icoon in een omkaderd blok, zelfde Resolver als de rijen zodat inline afhandelen
 * (one-click / drawer) identiek blijft werken.
 */
export function TaskHero({
  task,
  drawerData,
}: {
  task: PendingTask;
  drawerData?: Record<string, DrawerData>;
}) {
  const { Icon, className } = TONE[task.tone];
  return (
    <div
      id={task.id}
      className={cn(
        "flex flex-wrap items-center gap-4 border-b border-border px-5 py-4",
        HERO_BG[task.tone],
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card",
          className,
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 basis-56">
        <p className="font-medium leading-snug">{task.title}</p>
        {task.subtitle ? <p className="text-sm text-muted-foreground">{task.subtitle}</p> : null}
      </div>
      <div className="shrink-0">
        <Resolver task={task} drawerData={drawerData} />
      </div>
    </div>
  );
}

/** De kale rijen (zonder Card-omhulsel), zodat ze ook binnen een dashboard-zone passen. */
export function TaskRows({
  tasks,
  drawerData,
}: {
  tasks: PendingTask[];
  drawerData?: Record<string, DrawerData>;
}) {
  return (
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
            <Resolver task={task} drawerData={drawerData} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ActionList({
  tasks,
  drawerData,
}: {
  tasks: PendingTask[];
  drawerData?: Record<string, DrawerData>;
}) {
  return (
    <Card>
      <TaskRows tasks={tasks} drawerData={drawerData} />
    </Card>
  );
}
