import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Wallet,
  Users,
  ShieldCheck,
  Clock,
  Sparkles,
  CalendarRange,
  ChevronDown,
  Download,
  BadgeCheck,
  Activity,
} from "lucide-react";

type Trend = "up" | "down";

const REVENUE_BARS = [
  { label: "jan", value: 42 },
  { label: "feb", value: 48 },
  { label: "mrt", value: 51 },
  { label: "apr", value: 47 },
  { label: "mei", value: 58 },
  { label: "jun", value: 63 },
  { label: "jul", value: 61 },
  { label: "aug", value: 69 },
  { label: "sep", value: 74 },
  { label: "okt", value: 78 },
  { label: "nov", value: 88 },
  { label: "dec", value: 96 },
];

const KPIS: {
  label: string;
  value: string;
  delta: string;
  trend: Trend;
  icon: typeof Wallet;
  caption: string;
}[] = [
  {
    label: "Actieve plaatsingen",
    value: "142",
    delta: "+12",
    trend: "up",
    icon: Activity,
    caption: "deze maand bemiddeld",
  },
  {
    label: "Gem. uurtarief",
    value: "€ 48,20",
    delta: "+3,4%",
    trend: "up",
    icon: TrendingUp,
    caption: "verpleegkundige (BIG)",
  },
  {
    label: "Verificatiegraad",
    value: "97,1%",
    delta: "+1,2%",
    trend: "up",
    icon: ShieldCheck,
    caption: "geverifieerde profielen",
  },
  {
    label: "Reactietijd",
    value: "2,4 u",
    delta: "−18 min",
    trend: "down",
    icon: Clock,
    caption: "tot eerste voorstel",
  },
];

const DONUT = [
  { label: "Verpleegkundige (BIG)", value: 46, tone: "primary" },
  { label: "Verzorgende IG", value: 31, tone: "accent" },
  { label: "Wijkverpleegkundige", value: 23, tone: "muted" },
];

const REGIONS = [
  { label: "ZorgGroep Midden", value: 38, amount: "€ 84.200" },
  { label: "Verpleeghuis De Noorderbrug", value: 29, amount: "€ 61.500" },
  { label: "Thuiszorg West", value: 21, amount: "€ 44.800" },
  { label: "Overige instellingen", value: 12, amount: "€ 25.300" },
];

const TOP_PROFESSIONALS: {
  name: string;
  role: string;
  rate: string;
  match: number;
  status: string;
  verified: boolean;
  tone: string;
}[] = [
  {
    name: "Iris Hendriks",
    role: "Verpleegkundige (BIG)",
    rate: "€ 52,00",
    match: 96,
    status: "Voorgesteld",
    verified: true,
    tone: "bg-primary text-primary-foreground",
  },
  {
    name: "Mark Jansen",
    role: "Wijkverpleegkundige",
    rate: "€ 49,50",
    match: 91,
    status: "Actief",
    verified: true,
    tone: "bg-accent text-accent-foreground",
  },
  {
    name: "Sanne de Vries",
    role: "Verzorgende IG",
    rate: "€ 41,00",
    match: 88,
    status: "In behandeling",
    verified: false,
    tone: "bg-success/15 text-success",
  },
  {
    name: "Fatima El Amrani",
    role: "Verpleegkundige (BIG)",
    rate: "€ 53,75",
    match: 94,
    status: "Afgerond",
    verified: true,
    tone: "bg-warning/15 text-warning",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function statusTone(status: string) {
  switch (status) {
    case "Actief":
      return "bg-success/10 text-success";
    case "Voorgesteld":
      return "bg-primary/10 text-primary";
    case "Afgerond":
      return "bg-muted text-muted-foreground";
    case "In behandeling":
      return "bg-warning/10 text-warning";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function OntwerpAnalytics() {
  const peak = Math.max(...REVENUE_BARS.map((b) => b.value));
  const donutTotal = DONUT.reduce((sum, d) => sum + d.value, 0);
  let donutOffset = 0;
  const circumference = 2 * Math.PI * 42;

  const toneStroke: Record<string, string> = {
    primary: "text-primary",
    accent: "text-accent-foreground",
    muted: "text-muted-foreground",
  };
  const toneDot: Record<string, string> = {
    primary: "bg-primary",
    accent: "bg-accent",
    muted: "bg-muted-foreground/40",
  };

  return (
    <div className="flex min-h-[620px] w-full flex-col overflow-hidden rounded-2xl border border-border bg-background text-foreground">
      {/* Topbar */}
      <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm ring-1 ring-border">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold leading-tight">
              Bemiddelingsoverzicht
            </p>
            <p className="text-xs text-muted-foreground">ZorgGroep Midden · kwartaalrapportage</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-md border border-input bg-card px-3 py-1.5 text-xs font-medium text-card-foreground shadow-sm transition-colors hover:bg-muted">
            <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
            Dit jaar
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
            <Download className="h-3.5 w-3.5" />
            Exporteren
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
        {/* Hero KPI + grafiek */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm ring-1 ring-border/50">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Wallet className="h-3.5 w-3.5" />
                Bemiddelde omzet
              </div>
              <div className="mt-2 flex items-end gap-3">
                <span className="font-display font-mono text-5xl font-semibold leading-none tracking-tight">
                  € 1.284.600
                </span>
                <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 font-mono text-xs font-semibold text-success">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  +18,6%
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Cumulatief over 12 maanden · doel{" "}
                <span className="font-mono text-foreground">€ 1,25 mln</span> ruim behaald.
              </p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-muted-foreground">Hoogste maand</p>
                <p className="font-mono text-lg font-semibold">€ 142.900</p>
                <p className="text-xs text-muted-foreground">december</p>
              </div>
              <div className="border-l border-border pl-6">
                <p className="text-xs text-muted-foreground">Open marge</p>
                <p className="font-mono text-lg font-semibold">€ 96.300</p>
                <p className="text-xs text-success">+ verwacht Q1</p>
              </div>
            </div>
          </div>

          {/* Staafgrafiek */}
          <div className="mt-6">
            <div className="flex h-40 items-end gap-2">
              {REVENUE_BARS.map((bar) => (
                <div
                  key={bar.label}
                  className="group flex flex-1 flex-col items-center justify-end gap-2"
                >
                  <div className="relative flex w-full items-end justify-center">
                    <div
                      className="w-full rounded-md bg-primary/15 transition-colors group-hover:bg-primary/25"
                      style={{ height: `${(bar.value / peak) * 140}px` }}
                    >
                      <div
                        className="w-full rounded-md bg-primary transition-all"
                        style={{
                          height: `${(bar.value / peak) * 140 * 0.62}px`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="font-mono text-[10px] uppercase text-muted-foreground">
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Secundair KPI-grid */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono text-[11px] font-semibold ${
                      kpi.trend === "up"
                        ? "bg-success/10 text-success"
                        : "bg-success/10 text-success"
                    }`}
                  >
                    {kpi.trend === "up" ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {kpi.delta}
                  </span>
                </div>
                <p className="mt-3 font-mono text-2xl font-semibold leading-none">{kpi.value}</p>
                <p className="mt-1.5 text-xs font-medium text-foreground">{kpi.label}</p>
                <p className="text-xs text-muted-foreground">{kpi.caption}</p>
              </div>
            );
          })}
        </section>

        {/* Twee mid-size grafieken */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Donut: verdeling functies */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-sm font-semibold">Verdeling per functie</p>
                <p className="text-xs text-muted-foreground">aandeel van actieve plaatsingen</p>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-4 flex items-center gap-6">
              <div className="relative h-32 w-32 shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    className="stroke-muted"
                    strokeWidth="12"
                  />
                  {DONUT.map((seg) => {
                    const fraction = seg.value / donutTotal;
                    const dash = fraction * circumference;
                    const dashArray = `${dash} ${circumference - dash}`;
                    const dashOffset = -donutOffset;
                    donutOffset += dash;
                    return (
                      <circle
                        key={seg.label}
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        className={toneStroke[seg.tone]}
                        stroke="currentColor"
                        strokeWidth="12"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-xl font-semibold">142</span>
                  <span className="text-[10px] text-muted-foreground">plaatsingen</span>
                </div>
              </div>
              <ul className="flex-1 space-y-2.5">
                {DONUT.map((seg) => (
                  <li key={seg.label} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${toneDot[seg.tone]}`} />
                      <span className="text-foreground">{seg.label}</span>
                    </span>
                    <span className="font-mono text-muted-foreground">{seg.value}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Horizontale verdeelbalken: per instelling */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-sm font-semibold">Omzet per opdrachtgever</p>
                <p className="text-xs text-muted-foreground">aandeel bemiddelde omzet</p>
              </div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <ul className="mt-4 space-y-3.5">
              {REGIONS.map((region, i) => (
                <li key={region.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate pr-2 text-foreground">{region.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">{region.amount}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${
                          i === 0 ? "bg-primary" : "bg-primary/45"
                        }`}
                        style={{ width: `${region.value * 2.4}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-xs text-muted-foreground">
                      {region.value}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Top-professionals tabel */}
        <section className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <p className="font-display text-sm font-semibold">Best presterende profielen</p>
            <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              4 van 142
            </span>
          </div>
          <ul className="divide-y divide-border">
            {TOP_PROFESSIONALS.map((p) => (
              <li
                key={p.name}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${p.tone}`}
                >
                  {initials(p.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-foreground">{p.name}</span>
                    {p.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-success" />}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{p.role}</p>
                </div>
                <div className="hidden w-24 text-right sm:block">
                  <p className="font-mono text-sm text-foreground">{p.rate}</p>
                  <p className="text-[11px] text-muted-foreground">per uur</p>
                </div>
                <div className="hidden w-28 items-center gap-2 sm:flex">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-success"
                      style={{ width: `${p.match}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs font-semibold text-success">{p.match}%</span>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTone(
                    p.status,
                  )}`}
                >
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
