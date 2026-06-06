import { type Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, X } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { tenantScopeWhere } from "@/lib/tenancy";
import { type JobStatus } from "@/lib/enums";
import { getOnboardingState, type OnboardingState } from "@/lib/franchise/onboarding";
import { StepRail, type RailStep } from "@/components/ui/step-rail";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { plural } from "@/lib/plural";
import { WizardOpdrachtgever } from "./wizard-opdrachtgever";
import { WizardAfdelingForm } from "./wizard-afdeling-form";
import { WizardDienstForm } from "./wizard-dienst-form";
import { removeAfdelingStep } from "./actions";

export const metadata: Metadata = { title: "Opdrachtgever opzetten · Franchise" };

const ORDER = ["opdrachtgever", "afdelingen", "diensten"] as const;
type Stap = (typeof ORDER)[number] | "klaar";

const wizardHref = (stap: Stap, company?: string) =>
  `/franchise/opdrachtgevers/nieuw?stap=${stap}${company ? `&company=${company}` : ""}`;

export default async function WizardPage({
  searchParams,
}: {
  searchParams: Promise<{ stap?: string; company?: string }>;
}) {
  const actor = await requireRole("FRANCHISER");
  const sp = await searchParams;
  const companyId = sp.company ?? null;
  const rawStap = (sp.stap ?? "opdrachtgever") as Stap;
  const stap: Stap = (["opdrachtgever", "afdelingen", "diensten", "klaar"] as const).includes(
    rawStap,
  )
    ? rawStap
    : "opdrachtgever";

  const state = companyId ? await getOnboardingState(actor, companyId) : null;
  // Elke stap na de eerste vereist een geldige opdrachtgever in de eigen franchise.
  if (stap !== "opdrachtgever" && !state) redirect("/franchise/opdrachtgevers/nieuw");

  const idx = stap === "klaar" ? 3 : ORDER.indexOf(stap as (typeof ORDER)[number]);
  const railStatus = (i: number): RailStep["status"] =>
    i < idx ? "done" : i === idx ? "current" : "todo";
  const steps: RailStep[] = [
    {
      key: "opdrachtgever",
      label: "Opdrachtgever",
      sublabel: state?.companyName,
      status: railStatus(0),
    },
    {
      key: "afdelingen",
      label: "Afdelingen",
      sublabel: state ? plural(state.departments.length, "afdeling", "afdelingen") : undefined,
      status: railStatus(1),
    },
    {
      key: "diensten",
      label: "Diensten",
      sublabel: state ? plural(state.dienstenCount, "dienst", "diensten") : "Overslaan kan",
      status: railStatus(2),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight">Opdrachtgever opzetten</h1>
        <Link
          href="/franchise/opdrachtgevers"
          className="focus-ring inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          Sluiten <X className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[190px_minmax(0,1fr)_210px]">
        {/* Rail + voortgang */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <StepRail steps={steps} />
          <div className="space-y-1.5 border-t border-border pt-4">
            <Progress value={(idx / 3) * 100} />
            <p className="text-xs text-muted-foreground">{Math.min(idx, 3)} van 3</p>
          </div>
        </aside>

        {/* Actieve stap */}
        <div className="min-w-0">
          {stap === "opdrachtgever" && <StepOpdrachtgever />}
          {stap === "afdelingen" && state && <StepAfdelingen state={state} />}
          {stap === "diensten" && state && <StepDiensten actor={actor} state={state} />}
          {stap === "klaar" && state && <StepKlaar state={state} />}
        </div>

        {/* Live samenvatting */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Samenvatting state={state} />
        </aside>
      </div>
    </div>
  );
}

function StepOpdrachtgever() {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Opdrachtgever</h2>
          <p className="text-xs text-muted-foreground">
            De gegevens van de opdrachtgever. Hij krijgt een eigen login; afdelingen en diensten
            regel je in de volgende stappen.
          </p>
        </div>
        <WizardOpdrachtgever />
      </CardContent>
    </Card>
  );
}

function StepAfdelingen({ state }: { state: OnboardingState }) {
  const canNext = state.departments.length > 0;
  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Afdelingen</h2>
          <p className="text-xs text-muted-foreground">
            Waar werken de ZZP&apos;ers? Voeg minimaal één locatie of afdeling toe. Diensten zet je
            straks per afdeling uit.
          </p>
        </div>

        <WizardAfdelingForm companyId={state.companyId} />

        {state.departments.length > 0 && (
          <div className="border-t border-border pt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Toegevoegd</p>
            <ul className="divide-y divide-border">
              {state.departments.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="font-medium">{d.name}</span>
                    {d.location && <span className="text-muted-foreground"> · {d.location}</span>}
                  </span>
                  <form action={removeAfdelingStep.bind(null, d.id)}>
                    <Button type="submit" variant="ghost" size="xs">
                      Verwijderen
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <span className="text-xs text-muted-foreground">
            {canNext ? " " : "Voeg minstens één afdeling toe om verder te gaan."}
          </span>
          {canNext ? (
            <Button asChild>
              <Link href={wizardHref("diensten", state.companyId)}>
                Volgende: diensten <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          ) : (
            <Button disabled>
              Volgende: diensten <ArrowRight className="size-4" aria-hidden />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

async function StepDiensten({
  actor,
  state,
}: {
  actor: Awaited<ReturnType<typeof requireRole>>;
  state: OnboardingState;
}) {
  const [jobs, skills] = await Promise.all([
    prisma.job.findMany({
      where: { companyId: state.companyId, ...tenantScopeWhere(actor) },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, status: true, department: { select: { name: true } } },
    }),
    prisma.skill.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Diensten</h2>
          <p className="text-xs text-muted-foreground">
            Zet de eerste diensten uit per afdeling — met tarief, gevraagde skills en vereiste
            certificaten. Je kunt er later altijd meer toevoegen.
          </p>
        </div>

        <WizardDienstForm afdelingen={state.departments} skills={skills} />

        {jobs.length > 0 && (
          <div className="border-t border-border pt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Uitgezet</p>
            <ul className="divide-y divide-border">
              {jobs.map((j) => (
                <li key={j.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0 truncate">
                    {j.title}
                    {j.department && (
                      <span className="text-muted-foreground"> · {j.department.name}</span>
                    )}
                  </span>
                  <JobStatusBadge status={j.status as JobStatus} />
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          {jobs.length === 0 && (
            <Link
              href={wizardHref("klaar", state.companyId)}
              className="focus-ring text-sm text-muted-foreground hover:text-foreground"
            >
              Overslaan
            </Link>
          )}
          <Button asChild>
            <Link href={wizardHref("klaar", state.companyId)}>
              Afronden <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StepKlaar({ state }: { state: OnboardingState }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="size-6 text-success" aria-hidden />
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            {state.companyName} staat klaar
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {plural(state.departments.length, "afdeling", "afdelingen")} ·{" "}
            {plural(state.dienstenCount, "dienst uitgezet", "diensten uitgezet")}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button asChild>
            <Link href={`/franchise/opdrachtgevers/${state.companyId}`}>Naar opdrachtgever</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/franchise/opdrachtgevers/nieuw">Nog een opdrachtgever</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Samenvatting({ state }: { state: OnboardingState | null }) {
  if (!state) {
    return (
      <p className="text-xs text-muted-foreground">
        Je samenvatting verschijnt hier zodra de opdrachtgever is aangemaakt.
      </p>
    );
  }
  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="font-medium">{state.companyName}</p>
        <p className="text-xs text-muted-foreground">{state.contactName}</p>
        <p className="truncate text-xs text-muted-foreground">{state.email}</p>
      </div>
      <div className="border-t border-border pt-3">
        <p className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Afdelingen</span>
          <Badge variant="muted">{state.departments.length}</Badge>
        </p>
        {state.departments.length > 0 && (
          <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
            {state.departments.map((d) => (
              <li key={d.id} className="truncate">
                {d.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="border-t border-border pt-3">
        <p className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Diensten</span>
          <Badge variant="muted">{state.dienstenCount}</Badge>
        </p>
      </div>
    </div>
  );
}
