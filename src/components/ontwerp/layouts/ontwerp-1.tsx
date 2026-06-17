import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  ShieldCheck,
  Clock,
  CalendarDays,
  MapPin,
  Euro,
  Activity,
  Sparkles,
  ChevronRight,
  BadgeCheck,
} from "lucide-react";

export default function OntwerpBento() {
  const sparkline = [38, 42, 40, 47, 52, 49, 58, 63, 60, 71, 76, 82];
  const maxSpark = Math.max(...sparkline);

  const bars = [
    { label: "ma", value: 64 },
    { label: "di", value: 78 },
    { label: "wo", value: 52 },
    { label: "do", value: 88 },
    { label: "vr", value: 95 },
    { label: "za", value: 41 },
    { label: "zo", value: 33 },
  ];

  const shifts = [
    {
      name: "Iris Hendriks",
      role: "Verpleegkundige (BIG)",
      org: "ZorgGroep Midden",
      when: "Vandaag · 07:00–15:30",
      rate: "€ 52",
      status: "Actief",
      tone: "success" as const,
      initials: "IH",
      avatar: "bg-primary/15 text-primary",
    },
    {
      name: "Mark Jansen",
      role: "Verzorgende IG",
      org: "Verpleeghuis De Noorderbrug",
      when: "Morgen · 15:00–23:00",
      rate: "€ 41",
      status: "Voorgesteld",
      tone: "warning" as const,
      initials: "MJ",
      avatar: "bg-accent/40 text-accent-foreground",
    },
    {
      name: "Sanne de Vries",
      role: "Wijkverpleegkundige",
      org: "ZorgGroep Midden",
      when: "Wo 18 jun · 08:00–16:00",
      rate: "€ 58",
      status: "In behandeling",
      tone: "warning" as const,
      initials: "SV",
      avatar: "bg-success/15 text-success",
    },
    {
      name: "Fatima El Amrani",
      role: "Verpleegkundige (BIG)",
      org: "Verpleeghuis De Noorderbrug",
      when: "Vr 20 jun · 23:00–07:00",
      rate: "€ 67",
      status: "Afgerond",
      tone: "muted" as const,
      initials: "FE",
      avatar: "bg-muted text-muted-foreground",
    },
  ];

  const toneClasses: Record<string, string> = {
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/10 text-danger",
    muted: "bg-muted text-muted-foreground",
  };

  const donut = [
    { label: "Actief", value: 48, color: "text-primary", stroke: "stroke-primary" },
    { label: "Voorgesteld", value: 27, color: "text-warning", stroke: "stroke-warning" },
    { label: "Afgerond", value: 25, color: "text-success", stroke: "stroke-success" },
  ];
  const circumference = 2 * Math.PI * 38;
  let donutOffset = 0;

  return (
    <div className="flex min-h-[620px] w-full flex-col overflow-hidden rounded-2xl border border-border bg-background text-foreground">
      {/* Topbar */}
      <header className="flex items-center justify-between border-b border-border bg-card/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/30">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold leading-tight">Bemiddelcentrum</p>
            <p className="text-xs text-muted-foreground">Zorg · regio Midden-Nederland</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
            <ShieldCheck className="h-3.5 w-3.5" />
            Geverifieerd netwerk
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/40 text-sm font-semibold text-accent-foreground ring-1 ring-border">
            BM
          </div>
        </div>
      </header>

      {/* Bento grid */}
      <div className="grid flex-1 grid-cols-4 grid-rows-3 gap-3 p-4">
        {/* Hero metric — large */}
        <section className="col-span-2 row-span-2 flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm ring-1 ring-border/40">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Omzet deze maand
              </p>
              <p className="mt-2 font-mono text-4xl font-semibold tracking-tight text-foreground">
                € 184.920
              </p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +12,4% t.o.v. mei
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
              Trend
            </span>
          </div>

          {/* Sparkline */}
          <div className="mt-4">
            <svg viewBox="0 0 300 80" className="h-20 w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="bentoSpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              {(() => {
                const pts = sparkline.map((v, i) => {
                  const x = (i / (sparkline.length - 1)) * 300;
                  const y = 76 - (v / maxSpark) * 66;
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                });
                const line = pts.join(" ");
                const area = `0,80 ${line} 300,80`;
                return (
                  <g className="text-primary">
                    <polygon points={area} fill="url(#bentoSpark)" />
                    <polyline
                      points={line}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                );
              })()}
            </svg>
            <div className="mt-1 flex justify-between text-[10px] font-medium text-muted-foreground">
              <span>jan</span>
              <span>apr</span>
              <span>jun</span>
            </div>
          </div>
        </section>

        {/* Small stat — vulgraad */}
        <section className="col-span-1 row-span-1 flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Vulgraad</p>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="font-mono text-2xl font-semibold text-foreground">94%</p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: "94%" }} />
          </div>
        </section>

        {/* Small stat — matchscore */}
        <section className="col-span-1 row-span-1 flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Matchscore</p>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="font-mono text-2xl font-semibold text-foreground">88%</p>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
            <ArrowUpRight className="h-3.5 w-3.5" />
            sterke fit
          </span>
        </section>

        {/* Small stat — gem. uurtarief */}
        <section className="col-span-1 row-span-1 flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Gem. uurtarief</p>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="font-mono text-2xl font-semibold text-foreground">€ 54,20</p>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-danger">
            <ArrowDownRight className="h-3.5 w-3.5" />
            −1,8% wk
          </span>
        </section>

        {/* Small stat — verificaties */}
        <section className="col-span-1 row-span-1 flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Verificaties</p>
            <BadgeCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="font-mono text-2xl font-semibold text-foreground">126</p>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />7 wachtrij
          </span>
        </section>

        {/* Wide chart — diensten per dag */}
        <section className="col-span-2 row-span-1 flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm ring-1 ring-border/40">
          <div className="flex items-center justify-between">
            <p className="font-display text-sm font-semibold">Ingevulde diensten</p>
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              deze week
            </span>
          </div>
          <div className="mt-3 flex flex-1 items-end gap-2">
            {bars.map((b) => (
              <div key={b.label} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-md bg-primary/80 transition-all"
                    style={{ height: `${b.value}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">{b.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Tall list — aankomende diensten */}
        <section className="col-span-2 row-span-3 flex flex-col rounded-xl border border-border bg-card shadow-sm ring-1 ring-border/40">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <p className="font-display text-sm font-semibold">Aankomende diensten</p>
            </div>
            <button className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Alles
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <ul className="flex-1 divide-y divide-border overflow-hidden">
            {shifts.map((s) => (
              <li
                key={s.name}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${s.avatar} ring-1 ring-border`}
                >
                  {s.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-medium text-card-foreground">{s.name}</p>
                    <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{s.role}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {s.org}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {s.when}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-mono text-sm font-semibold text-foreground">{s.rate}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${toneClasses[s.tone]}`}
                  >
                    {s.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-border px-4 py-2.5 text-center text-xs text-muted-foreground">
            18 diensten gepland · 4 wachten op bevestiging
          </div>
        </section>

        {/* Square donut — samenwerkingen */}
        <section className="col-span-2 row-span-1 flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm ring-1 ring-border/40">
          <div className="relative h-24 w-24 shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="38"
                className="stroke-muted"
                strokeWidth="11"
                fill="none"
              />
              {donut.map((seg) => {
                const len = (seg.value / 100) * circumference;
                const dash = `${len} ${circumference - len}`;
                const el = (
                  <circle
                    key={seg.label}
                    cx="50"
                    cy="50"
                    r="38"
                    className={seg.stroke}
                    strokeWidth="11"
                    fill="none"
                    strokeDasharray={dash}
                    strokeDashoffset={-donutOffset}
                    strokeLinecap="butt"
                  />
                );
                donutOffset += len;
                return el;
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-lg font-semibold text-foreground">62</span>
              <span className="text-[10px] text-muted-foreground">teams</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="font-display text-sm font-semibold">Samenwerkingen</p>
            <ul className="mt-2 space-y-1.5">
              {donut.map((seg) => (
                <li key={seg.label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className={`h-2 w-2 rounded-full bg-current ${seg.color}`} />
                    {seg.label}
                  </span>
                  <span className="font-mono font-medium text-foreground">{seg.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
