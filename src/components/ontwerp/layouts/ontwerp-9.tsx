import {
  LayoutGrid,
  Users,
  CalendarDays,
  FileBadge,
  Inbox,
  Settings,
  Search,
  Bell,
  ShieldCheck,
  TrendingUp,
  Clock,
  Wallet,
  MapPin,
  ArrowUpRight,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Plus,
} from "lucide-react";

type NavItem = {
  icon: typeof LayoutGrid;
  label: string;
  active?: boolean;
  badge?: number;
};

const navItems: NavItem[] = [
  { icon: LayoutGrid, label: "Overzicht", active: true },
  { icon: Users, label: "Zorgprofessionals", badge: 12 },
  { icon: CalendarDays, label: "Planning" },
  { icon: FileBadge, label: "Verificaties", badge: 3 },
  { icon: Inbox, label: "Berichten", badge: 5 },
];

type Kpi = {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  delta: string;
  tone: "success" | "warning" | "primary";
};

const kpis: Kpi[] = [
  {
    icon: TrendingUp,
    label: "Vulgraad diensten",
    value: "94%",
    delta: "+6%",
    tone: "success",
  },
  {
    icon: Users,
    label: "Actieve plaatsingen",
    value: "37",
    delta: "+4",
    tone: "primary",
  },
  {
    icon: Clock,
    label: "Open aanvragen",
    value: "8",
    delta: "−2",
    tone: "warning",
  },
  {
    icon: Wallet,
    label: "Omzet deze maand",
    value: "€ 48.250",
    delta: "+12%",
    tone: "success",
  },
];

type Row = {
  name: string;
  initials: string;
  accent: string;
  role: string;
  institution: string;
  location: string;
  rate: number;
  match: number;
  verified: boolean;
  status: "Actief" | "Voorgesteld" | "In behandeling" | "Afgerond";
};

const rows: Row[] = [
  {
    name: "Iris Hendriks",
    initials: "IH",
    accent: "bg-primary/15 text-primary",
    role: "Verpleegkundige (BIG)",
    institution: "ZorgGroep Midden",
    location: "Utrecht",
    rate: 62,
    match: 96,
    verified: true,
    status: "Actief",
  },
  {
    name: "Mark Jansen",
    initials: "MJ",
    accent: "bg-success/15 text-success",
    role: "Wijkverpleegkundige",
    institution: "Verpleeghuis De Noorderbrug",
    location: "Groningen",
    rate: 58,
    match: 91,
    verified: true,
    status: "Voorgesteld",
  },
  {
    name: "Sanne de Vries",
    initials: "SV",
    accent: "bg-accent text-accent-foreground",
    role: "Verzorgende IG",
    institution: "ZorgGroep Midden",
    location: "Amersfoort",
    rate: 41,
    match: 88,
    verified: false,
    status: "In behandeling",
  },
  {
    name: "Fatima El Amrani",
    initials: "FE",
    accent: "bg-warning/15 text-warning",
    role: "Verpleegkundige (BIG)",
    institution: "Verpleeghuis De Noorderbrug",
    location: "Assen",
    rate: 60,
    match: 84,
    verified: true,
    status: "Afgerond",
  },
];

const statusTone: Record<Row["status"], string> = {
  Actief: "bg-success/10 text-success",
  Voorgesteld: "bg-primary/10 text-primary",
  "In behandeling": "bg-warning/10 text-warning",
  Afgerond: "bg-muted text-muted-foreground",
};

type Action = {
  icon: typeof ShieldCheck;
  title: string;
  detail: string;
  tone: "warning" | "primary" | "success";
};

const nextActions: Action[] = [
  {
    icon: FileBadge,
    title: "VOG verlengen — Sanne de Vries",
    detail: "Verloopt over 5 dagen",
    tone: "warning",
  },
  {
    icon: Users,
    title: "Voorstel bevestigen — Mark Jansen",
    detail: "Wacht op zorginstelling",
    tone: "primary",
  },
  {
    icon: CheckCircle2,
    title: "Dienst goedkeuren — week 25",
    detail: "3 uren ter accordering",
    tone: "success",
  },
];

type Day = { label: string; date: string; load: number; today?: boolean };

const week: Day[] = [
  { label: "ma", date: "16", load: 2 },
  { label: "di", date: "17", load: 3, today: true },
  { label: "wo", date: "18", load: 1 },
  { label: "do", date: "19", load: 4 },
  { label: "vr", date: "20", load: 2 },
  { label: "za", date: "21", load: 0 },
  { label: "zo", date: "22", load: 1 },
];

export default function OntwerpThreeColumn() {
  return (
    <div className="flex min-h-[620px] w-full flex-col overflow-hidden rounded-2xl border border-border bg-background text-foreground">
      <div className="flex flex-1 overflow-hidden">
        {/* Linker icoon-navigatierail */}
        <nav className="flex w-16 flex-col items-center gap-1 border-r border-border bg-card py-4">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm ring-1 ring-border/60">
            <Stethoscope className="h-5 w-5" />
          </div>
          {navItems.map((item) => (
            <button
              key={item.label}
              title={item.label}
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                item.active
                  ? "bg-accent text-accent-foreground ring-1 ring-border"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.badge ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[10px] text-primary-foreground">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
          <div className="mt-auto flex flex-col items-center gap-2">
            <button
              title="Instellingen"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-display text-xs font-semibold text-accent-foreground ring-1 ring-border">
              BJ
            </div>
          </div>
        </nav>

        {/* Hoofdkolom */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Kop */}
          <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
            <div>
              <h1 className="font-display text-lg font-semibold tracking-tight">
                Bemiddeling — werkruimte
              </h1>
              <p className="text-sm text-muted-foreground">
                ZorgGroep Midden · regio Midden-Nederland
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-lg border border-input bg-card px-3 py-1.5 text-sm text-muted-foreground sm:flex">
                <Search className="h-4 w-4" />
                <span>Zoek professional…</span>
              </div>
              <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-input bg-card text-muted-foreground transition-colors hover:text-foreground">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-card" />
              </button>
              <button className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
                <Plus className="h-4 w-4" />
                Nieuwe aanvraag
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {/* KPI-tegels */}
            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {kpis.map((kpi) => {
                const tone =
                  kpi.tone === "success"
                    ? "text-success"
                    : kpi.tone === "warning"
                      ? "text-warning"
                      : "text-primary";
                return (
                  <div
                    key={kpi.label}
                    className="rounded-xl border border-border bg-card p-4 shadow-sm ring-1 ring-border/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <kpi.icon className="h-4 w-4" />
                      </span>
                      <span className={`font-mono text-xs font-medium ${tone}`}>{kpi.delta}</span>
                    </div>
                    <p className="mt-3 font-mono text-2xl font-semibold tracking-tight">
                      {kpi.value}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{kpi.label}</p>
                  </div>
                );
              })}
            </section>

            {/* Lijst */}
            <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm ring-1 ring-border/40">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 className="font-display text-sm font-semibold">Voorgestelde professionals</h2>
                <button className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  Alles tonen
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <ul className="divide-y divide-border">
                {rows.map((row) => (
                  <li
                    key={row.name}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold ${row.accent}`}
                    >
                      {row.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium">{row.name}</p>
                        {row.verified ? (
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" />
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.role} · {row.institution}
                      </p>
                    </div>
                    <div className="hidden items-center gap-1 text-xs text-muted-foreground md:flex">
                      <MapPin className="h-3.5 w-3.5" />
                      {row.location}
                    </div>
                    <div className="hidden flex-col items-end sm:flex">
                      <span className="font-mono text-sm font-semibold">€ {row.rate}</span>
                      <span className="text-[10px] text-muted-foreground">per uur</span>
                    </div>
                    <div className="flex w-16 flex-col items-end">
                      <span className="font-mono text-sm font-semibold text-primary">
                        {row.match}%
                      </span>
                      <span className="text-[10px] text-muted-foreground">match</span>
                    </div>
                    <span
                      className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium lg:inline-block ${statusTone[row.status]}`}
                    >
                      {row.status}
                    </span>
                    <button className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </main>

        {/* Rechter contextrail */}
        <aside className="hidden w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l border-border bg-card px-4 py-5 lg:flex">
          {/* Volgende acties */}
          <section>
            <h3 className="mb-2 px-1 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Volgende acties
            </h3>
            <ul className="space-y-2">
              {nextActions.map((action) => {
                const tone =
                  action.tone === "success"
                    ? "bg-success/10 text-success"
                    : action.tone === "warning"
                      ? "bg-warning/10 text-warning"
                      : "bg-primary/10 text-primary";
                return (
                  <li
                    key={action.title}
                    className="flex items-start gap-2.5 rounded-lg border border-border bg-background p-2.5 transition-colors hover:bg-muted/50"
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${tone}`}
                    >
                      <action.icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium leading-snug">{action.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{action.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Week-strip */}
          <section>
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Week 25
              </h3>
              <span className="font-mono text-[11px] text-muted-foreground">13 diensten</span>
            </div>
            <div className="grid grid-cols-7 gap-1 rounded-lg border border-border bg-background p-2">
              {week.map((day) => (
                <div
                  key={day.label}
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

          {/* Compliance-zegelblok */}
          <section className="rounded-xl border border-border bg-background p-4 shadow-sm ring-1 ring-success/15">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10 text-success">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-sm font-semibold">Compliance-zegel</p>
                <p className="text-[11px] text-success">Geverifieerd · 2026</p>
              </div>
            </div>
            <dl className="mt-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  BIG-registratie
                </dt>
                <dd className="font-mono font-medium text-success">100%</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  VOG actueel
                </dt>
                <dd className="font-mono font-medium text-success">96%</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                  Diploma’s verloopt
                </dt>
                <dd className="font-mono font-medium text-warning">2</dd>
              </div>
            </dl>
            <button className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-input bg-card py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted">
              Rapport openen
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
