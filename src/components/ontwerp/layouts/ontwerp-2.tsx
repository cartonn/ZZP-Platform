import {
  ArrowRight,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CalendarClock,
  Euro,
  Sparkle,
  Stethoscope,
  TrendingUp,
  Users,
  FileCheck2,
  ChevronRight,
} from "lucide-react";

type Urgency = "high" | "medium" | "low";

type Task = {
  id: string;
  initials: string;
  ring: string;
  name: string;
  role: string;
  org: string;
  context: string;
  rate: string;
  meta: string;
  urgency: Urgency;
  badge: { label: string; tone: "success" | "warning" | "primary" };
  verified: boolean;
};

const urgencyAccent: Record<Urgency, string> = {
  high: "before:bg-danger",
  medium: "before:bg-warning",
  low: "before:bg-success",
};

const urgencyLabel: Record<Urgency, { text: string; cls: string }> = {
  high: {
    text: "Vandaag",
    cls: "bg-danger/10 text-danger",
  },
  medium: {
    text: "Deze week",
    cls: "bg-warning/10 text-warning",
  },
  low: {
    text: "Gepland",
    cls: "bg-success/10 text-success",
  },
};

const toneStyles: Record<Task["badge"]["tone"], string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  primary: "bg-primary/10 text-primary",
};

const tasks: Task[] = [
  {
    id: "t1",
    initials: "IH",
    ring: "bg-primary/15 text-primary",
    name: "Iris Hendriks",
    role: "Verpleegkundige (BIG)",
    org: "ZorgGroep Midden",
    context: "Stemt af op nachtdienst-aanvraag · wacht op jouw voorstel",
    rate: "€ 58,00 / uur",
    meta: "Matchscore 96%",
    urgency: "high",
    badge: { label: "Voorgesteld", tone: "primary" },
    verified: true,
  },
  {
    id: "t2",
    initials: "MJ",
    ring: "bg-accent/30 text-accent-foreground",
    name: "Mark Jansen",
    role: "Verzorgende IG",
    org: "Verpleeghuis De Noorderbrug",
    context: "VOG verloopt over 4 dagen · herverificatie nodig",
    rate: "€ 41,50 / uur",
    meta: "Vulgraad afdeling 72%",
    urgency: "high",
    badge: { label: "In behandeling", tone: "warning" },
    verified: false,
  },
  {
    id: "t3",
    initials: "SV",
    ring: "bg-success/15 text-success",
    name: "Sanne de Vries",
    role: "Wijkverpleegkundige",
    org: "ZorgGroep Midden",
    context: "Contract klaar om te ondertekenen · 3 diensten gepland",
    rate: "€ 52,00 / uur",
    meta: "Matchscore 91%",
    urgency: "medium",
    badge: { label: "Actief", tone: "success" },
    verified: true,
  },
  {
    id: "t4",
    initials: "FA",
    ring: "bg-warning/15 text-warning",
    name: "Fatima El Amrani",
    role: "Verpleegkundige (BIG)",
    org: "Verpleeghuis De Noorderbrug",
    context: "Opdracht afgerond · beoordeling open voor instelling",
    rate: "€ 56,00 / uur",
    meta: "8 diensten · 64 uur",
    urgency: "low",
    badge: { label: "Afgerond", tone: "success" },
    verified: true,
  },
];

const stats: { icon: typeof Users; label: string; value: string; sub: string }[] = [
  { icon: Users, label: "Open aanvragen", value: "14", sub: "5 urgent" },
  { icon: TrendingUp, label: "Gem. vulgraad", value: "88%", sub: "+6% wk" },
  { icon: Euro, label: "Omzet deze maand", value: "€ 47.200", sub: "geboekt" },
  { icon: FileCheck2, label: "Geverifieerd", value: "97%", sub: "van pool" },
];

export default function OntwerpCommandCenter() {
  return (
    <div className="flex min-h-[620px] w-full flex-col overflow-hidden rounded-2xl border border-border bg-background text-foreground">
      {/* Topbar */}
      <header className="flex items-center justify-between border-b border-border bg-card/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm ring-1 ring-border">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold">Bemiddelcentrum</p>
            <p className="text-xs text-muted-foreground">Maandag 12 juni · ZorgGroep Midden</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5">
          <span className="flex h-2 w-2 rounded-full bg-success" />
          <span className="text-xs font-medium text-muted-foreground">Live planning</span>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-5 overflow-hidden px-6 py-5">
        {/* Wat nu — focus-banner */}
        <section className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm ring-1 ring-border/60">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-primary/5" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <Sparkle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-danger">
                    Wat nu
                  </span>
                  <span className="text-xs text-muted-foreground">Hoogste prioriteit</span>
                </div>
                <h2 className="font-display text-lg font-semibold leading-snug">
                  Stel Iris Hendriks voor op de nachtdienst
                </h2>
                <p className="max-w-xl text-sm text-muted-foreground">
                  96% match, BIG-geverifieerd en beschikbaar. ZorgGroep Midden verwacht vandaag een
                  voorstel — bevestig het uurtarief van{" "}
                  <span className="font-mono text-foreground">€ 58,00</span>.
                </p>
              </div>
            </div>
            <button className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              Voorstel versturen
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </section>

        {/* Geprioriteerde takenlijst */}
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-semibold">Jouw acties</h3>
              <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                4
              </span>
            </div>
            <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
              Alles tonen
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <ul className="divide-y divide-border overflow-y-auto">
            {tasks.map((task) => {
              const u = urgencyLabel[task.urgency];
              return (
                <li
                  key={task.id}
                  className={`group relative flex items-center gap-4 px-4 py-3.5 pl-5 transition before:absolute before:inset-y-2.5 before:left-1.5 before:w-1 before:rounded-full hover:bg-muted/50 ${urgencyAccent[task.urgency]}`}
                >
                  <div
                    className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${task.ring}`}
                  >
                    {task.initials}
                    {task.verified && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-card ring-1 ring-border">
                        <ShieldCheck className="h-3 w-3 text-success" />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-card-foreground">
                        {task.name}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${toneStyles[task.badge.tone]}`}
                      >
                        {task.badge.label}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {task.role} · {task.org}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      {task.urgency === "high" ? (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-danger" />
                      ) : task.urgency === "medium" ? (
                        <Clock className="h-3.5 w-3.5 shrink-0 text-warning" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                      )}
                      <span className="truncate">{task.context}</span>
                    </p>
                  </div>

                  <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                    <span className="font-mono text-sm font-medium text-foreground">
                      {task.rate}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{task.meta}</span>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`hidden items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium md:inline-flex ${u.cls}`}
                    >
                      <CalendarClock className="h-3 w-3" />
                      {u.text}
                    </span>
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:border-input group-hover:text-foreground">
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Stat-strip */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 shadow-sm ring-1 ring-border/50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-[11px] text-muted-foreground">{s.label}</p>
                  <p className="font-mono text-base font-semibold text-foreground">{s.value}</p>
                </div>
                <span className="ml-auto hidden rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success xl:inline">
                  {s.sub}
                </span>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
