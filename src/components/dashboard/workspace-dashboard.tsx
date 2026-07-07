import Link from "next/link";
import { getTranslator } from "@/lib/i18n/server";
import {
  ChevronRight,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";

// Drie-koloms workspace (ontwerprichting #19) — hoofdkolom + contextuele rechterrail.
// De linker icoon-navigatierail levert de app-shell; dit is de inhoud per rol, gevuld met
// echte data. Puur presentationeel.

type ActionTone = "success" | "warning" | "primary";

export interface WsKpi {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Optionele korte context onder het label (bv. "3 van je 14 opdrachten heeft een plaatsing"). */
  hint?: string;
  delta?: string;
  deltaTone?: ActionTone;
}

export interface WsRow {
  id: string;
  initials: string;
  accent: string;
  name: string;
  verified?: boolean;
  role: string;
  institution?: string;
  location?: string | null;
  rate?: number | null;
  match?: number;
  status?: string;
  statusClass?: string;
  href: string;
}

export interface WsAction {
  id: string;
  icon: LucideIcon;
  title: string;
  detail?: string;
  href: string;
  tone: ActionTone;
}

export interface WsWeekDay {
  label: string;
  date: string;
  load: number;
  today?: boolean;
}

export interface WsSealItem {
  label: string;
  value: string;
  ok: boolean;
}

export interface WorkspaceDashboardProps {
  header: { title: string; subtitle?: string };
  kpis: WsKpi[];
  list: { title: string; href?: string; rows: WsRow[]; empty?: string };
  nextActions: WsAction[];
  week?: { title: string; count: string; days: WsWeekDay[] };
  seal?: { title: string; subtitle: string; items: WsSealItem[]; reportHref?: string };
}

const TONE_TEXT: Record<ActionTone, string> = {
  success: "text-success",
  warning: "text-warning",
  primary: "text-primary",
};
const TONE_SOFT: Record<ActionTone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  primary: "bg-primary/10 text-primary",
};

export async function WorkspaceDashboard({
  header,
  kpis,
  list,
  nextActions,
  week,
  seal,
}: WorkspaceDashboardProps) {
  const { t } = await getTranslator();
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
      {/* Vol-brede oranje naam-balk boven beide kolommen. */}
      <header className="bg-hero px-5 py-4 text-white md:px-6">
        <h1 className="font-display text-lg font-semibold tracking-tight">{header.title}</h1>
        {header.subtitle && <p className="text-sm font-medium text-white">{header.subtitle}</p>}
      </header>
      {/* Twee kolommen onder de balk: hoofdkolom + contextrail (elk eigen scroll). */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {/* Hoofdkolom */}
        <main className="flex min-w-0 flex-col lg:min-h-0 lg:flex-1">
          <div className="space-y-5 px-5 py-5 md:px-6 lg:flex-1 lg:overflow-y-auto">
            {/* KPI-tegels */}
            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {kpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm ring-1 ring-border/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <kpi.icon className="h-4 w-4" aria-hidden />
                    </span>
                    {kpi.delta && (
                      <span
                        className={`font-mono text-xs font-medium ${TONE_TEXT[kpi.deltaTone ?? "primary"]}`}
                      >
                        {kpi.delta}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 font-mono text-2xl font-semibold tracking-tight">
                    {kpi.value}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{kpi.label}</p>
                  {kpi.hint && (
                    <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground/80">
                      {kpi.hint}
                    </p>
                  )}
                </div>
              ))}
            </section>

            {/* Lijst */}
            <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm ring-1 ring-border/40">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 className="font-display text-sm font-semibold">{list.title}</h2>
                {list.href && (
                  <Link
                    href={list.href}
                    className="focus-ring flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    {t("Alles tonen")}
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                )}
              </div>
              {list.rows.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {list.empty ?? t("Nog niets om te tonen.")}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {list.rows.map((row) => (
                    <li key={row.id}>
                      <Link
                        href={row.href}
                        className="focus-ring flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold ${row.accent}`}
                        >
                          {row.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-medium">{row.name}</p>
                            {row.verified && (
                              <ShieldCheck
                                className="h-3.5 w-3.5 shrink-0 text-success"
                                aria-hidden
                              />
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {row.role}
                            {row.institution ? ` · ${row.institution}` : ""}
                          </p>
                        </div>
                        {row.location && (
                          <div className="hidden items-center gap-1 text-xs text-muted-foreground md:flex">
                            <MapPin className="h-3.5 w-3.5" aria-hidden />
                            {row.location}
                          </div>
                        )}
                        {row.rate != null && (
                          <div className="hidden flex-col items-end sm:flex">
                            <span className="font-mono text-sm font-semibold">€ {row.rate}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {t("per uur")}
                            </span>
                          </div>
                        )}
                        {row.match != null && (
                          <div className="flex w-16 flex-col items-end">
                            <span className="font-mono text-sm font-semibold text-primary">
                              {row.match}%
                            </span>
                            <span className="text-[10px] text-muted-foreground">{t("match")}</span>
                          </div>
                        )}
                        {row.status && (
                          <span
                            className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium lg:inline-block ${row.statusClass ?? "bg-muted text-muted-foreground"}`}
                          >
                            {row.status}
                          </span>
                        )}
                        <ArrowUpRight
                          className="h-4 w-4 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </main>

        {/* Rechter contextrail — op desktop volle hoogte met eigen scroll (zoals #19); op mobiel
          gestapeld ónder de hoofdkolom (volle breedte, scheidingslijn boven i.p.v. links) zodat
          'Volgende acties' / week / zegel ook op klein scherm zichtbaar blijven. Zelfde crème vlak
          als de hoofdkolom; witte kaarten (bg-card) zetten zich erop af. */}
        <aside className="flex w-full flex-col gap-4 border-t border-border px-4 py-5 lg:w-[22.5rem] lg:shrink-0 lg:overflow-y-auto lg:border-l lg:border-t-0">
          {/* Volgende acties */}
          <section>
            <h3 className="mb-2 px-1 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("Volgende acties")}
            </h3>
            {nextActions.length === 0 ? (
              <p className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
                {t("Niets dat nu aandacht vraagt. Goed bezig.")}
              </p>
            ) : (
              <ul className="space-y-2">
                {nextActions.map((action) => (
                  <li key={action.id}>
                    <Link
                      href={action.href}
                      className="focus-ring flex items-start gap-2.5 rounded-lg border border-border bg-card p-2.5 transition-colors hover:bg-muted/50"
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${TONE_SOFT[action.tone]}`}
                      >
                        <action.icon className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium leading-snug">{action.title}</p>
                        {action.detail && (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {action.detail}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Week-strip */}
          {week && (
            <section>
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {week.title}
                </h3>
                <span className="font-mono text-[11px] text-muted-foreground">{week.count}</span>
              </div>
              <div className="grid grid-cols-7 gap-1 rounded-lg border border-border bg-card p-2">
                {week.days.map((day) => (
                  <div
                    key={day.label + day.date}
                    className={`flex flex-col items-center rounded-md py-1.5 ${
                      day.today ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <span className="text-[10px] uppercase">{day.label}</span>
                    <span className="font-mono text-xs font-semibold">{day.date}</span>
                    <span className="mt-1 flex gap-0.5">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <span
                          key={i}
                          className={`h-1 w-1 rounded-full ${
                            i < day.load
                              ? day.today
                                ? "bg-primary-foreground"
                                : "bg-primary"
                              : day.today
                                ? "bg-primary-foreground/30"
                                : "bg-border"
                          }`}
                        />
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Compliance-zegel */}
          {seal && (
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm ring-1 ring-success/15">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10 text-success">
                  <ShieldCheck className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-display text-sm font-semibold">{seal.title}</p>
                  <p className="text-[11px] text-success">{seal.subtitle}</p>
                </div>
              </div>
              <dl className="mt-3 space-y-2 text-xs">
                {seal.items.map((item) => (
                  // Label vast links, waarde mag ombreken en naar de volgende regel zakken (min-w-0 +
                  // break-words): een lange statustekst als "Nog niet inzetbaar — Verzekering ontbreekt"
                  // loopt zo nooit meer door het label heen (DESIGN.md: tekst valt nooit buiten de kaart).
                  <div
                    key={item.label}
                    className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5"
                  >
                    <dt className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
                      {item.ok ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
                      )}
                      {item.label}
                    </dt>
                    <dd
                      className={`min-w-0 break-words text-right font-medium ${item.ok ? "text-success" : "text-warning"}`}
                    >
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
              {seal.reportHref && (
                <Link
                  href={seal.reportHref}
                  className="focus-ring mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-input bg-background py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {t("Rapport openen")}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
