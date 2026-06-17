import {
  Search,
  SlidersHorizontal,
  Plus,
  Users,
  CheckCircle2,
  Clock,
  Briefcase,
  ShieldCheck,
  ChevronDown,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  MessageSquare,
  FileCheck2,
  TrendingUp,
  CalendarClock,
} from "lucide-react";

type Status = "Actief" | "Voorgesteld" | "Afgerond" | "In behandeling";

type Candidate = {
  name: string;
  initials: string;
  role: string;
  big: boolean;
  org: string;
  status: Status;
  match: number;
  rate: number;
  expiry: string;
  expirySoon: boolean;
  verified: boolean;
  avatarTone: "primary" | "accent" | "success" | "warning";
};

const candidates: Candidate[] = [
  {
    name: "Iris Hendriks",
    initials: "IH",
    role: "Verpleegkundige (BIG)",
    big: true,
    org: "ZorgGroep Midden",
    status: "Actief",
    match: 96,
    rate: 64,
    expiry: "12 mrt 2027",
    expirySoon: false,
    verified: true,
    avatarTone: "primary",
  },
  {
    name: "Mark Jansen",
    initials: "MJ",
    role: "Verzorgende IG",
    big: false,
    org: "Verpleeghuis De Noorderbrug",
    status: "Voorgesteld",
    match: 91,
    rate: 48,
    expiry: "28 jul 2026",
    expirySoon: true,
    verified: true,
    avatarTone: "accent",
  },
  {
    name: "Sanne de Vries",
    initials: "SV",
    role: "Wijkverpleegkundige",
    big: true,
    org: "ZorgGroep Midden",
    status: "Actief",
    match: 89,
    rate: 58,
    expiry: "04 nov 2026",
    expirySoon: false,
    verified: true,
    avatarTone: "success",
  },
  {
    name: "Fatima El Amrani",
    initials: "FA",
    role: "Verpleegkundige (BIG)",
    big: true,
    org: "Verpleeghuis De Noorderbrug",
    status: "In behandeling",
    match: 84,
    rate: 61,
    expiry: "19 jun 2026",
    expirySoon: true,
    verified: false,
    avatarTone: "warning",
  },
  {
    name: "Daan Koster",
    initials: "DK",
    role: "Verzorgende IG",
    big: false,
    org: "ZorgGroep Midden",
    status: "Afgerond",
    match: 78,
    rate: 45,
    expiry: "30 sep 2027",
    expirySoon: false,
    verified: true,
    avatarTone: "accent",
  },
  {
    name: "Lotte Bakker",
    initials: "LB",
    role: "Wijkverpleegkundige",
    big: true,
    org: "Verpleeghuis De Noorderbrug",
    status: "Voorgesteld",
    match: 73,
    rate: 56,
    expiry: "15 jan 2027",
    expirySoon: false,
    verified: true,
    avatarTone: "primary",
  },
];

const avatarToneClasses: Record<Candidate["avatarTone"], string> = {
  primary: "bg-primary/15 text-primary",
  accent: "bg-accent text-accent-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
};

const statusClasses: Record<Status, string> = {
  Actief: "bg-success/10 text-success ring-1 ring-success/20",
  Voorgesteld: "bg-primary/10 text-primary ring-1 ring-primary/20",
  Afgerond: "bg-muted text-muted-foreground ring-1 ring-border",
  "In behandeling": "bg-warning/10 text-warning ring-1 ring-warning/20",
};

function matchBarTone(match: number): string {
  if (match >= 90) return "bg-success";
  if (match >= 80) return "bg-primary";
  return "bg-warning";
}

export default function OntwerpDataTable() {
  const segments = ["Alle", "Actief", "Voorgesteld"] as const;
  const activeSegment = "Alle";
  const filterChips = ["BIG-geregistreerd", "Binnen 25 km", "Beschikbaar deze week"];

  const kpis = [
    {
      label: "Open posities",
      value: "18",
      sub: "+3 deze week",
      icon: Briefcase,
      tone: "text-primary",
      wash: "bg-primary/10",
    },
    {
      label: "Geverifieerd",
      value: "142",
      sub: "92% van pool",
      icon: ShieldCheck,
      tone: "text-success",
      wash: "bg-success/10",
    },
    {
      label: "Vulgraad",
      value: "87%",
      sub: "+5% t.o.v. maart",
      icon: TrendingUp,
      tone: "text-accent-foreground",
      wash: "bg-accent",
    },
    {
      label: "Verloopt < 30d",
      value: "6",
      sub: "actie vereist",
      icon: CalendarClock,
      tone: "text-warning",
      wash: "bg-warning/10",
    },
  ];

  return (
    <div className="flex min-h-[620px] w-full flex-col overflow-hidden rounded-2xl border border-border bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-border bg-card px-5 py-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="font-display text-base font-semibold tracking-tight text-card-foreground">
            Kandidatenpool — Zorgbemiddeling
          </h2>
          <p className="text-xs text-muted-foreground">
            142 zorgprofessionals · gekoppeld aan 18 open posities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success ring-1 ring-success/20 sm:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5" />
            Geverifieerd register
          </span>
        </div>
      </div>

      {/* KPI chips */}
      <div className="grid grid-cols-2 gap-3 border-b border-border bg-background px-5 py-4 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm ring-1 ring-border/40"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${kpi.wash}`}
              >
                <Icon className={`h-4.5 w-4.5 ${kpi.tone}`} />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="font-mono text-lg font-semibold leading-none tracking-tight text-card-foreground">
                  {kpi.value}
                </span>
                <span className="mt-1 truncate text-[11px] text-muted-foreground">
                  {kpi.label} · {kpi.sub}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-border bg-card px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              readOnly
              value="Zoek op naam, functie of instelling…"
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-muted-foreground outline-none ring-ring focus:ring-2"
            />
          </div>
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted p-0.5">
            {segments.map((seg) => (
              <button
                key={seg}
                type="button"
                className={
                  seg === activeSegment
                    ? "rounded-md bg-card px-3 py-1 text-xs font-medium text-card-foreground shadow-sm ring-1 ring-border"
                    : "rounded-md px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                }
              >
                {seg}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-muted"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Kandidaat voorstellen
          </button>
        </div>
      </div>

      {/* Filter chips row */}
      <div className="flex items-center gap-2 border-b border-border bg-background px-5 py-2.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Actieve filters
        </span>
        {filterChips.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground"
          >
            {chip}
          </span>
        ))}
      </div>

      {/* Data table */}
      <div className="flex-1 overflow-auto bg-background">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="px-5 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  Professional
                  <ArrowUpDown className="h-3 w-3" />
                </span>
              </th>
              <th className="hidden px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground md:table-cell">
                Instelling
              </th>
              <th className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </th>
              <th className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  Match
                  <ArrowUpDown className="h-3 w-3" />
                </span>
              </th>
              <th className="px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Uurtarief
              </th>
              <th className="hidden px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground lg:table-cell">
                BIG vervalt
              </th>
              <th className="px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <span className="sr-only">Acties</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr
                key={c.name}
                className="group border-b border-border/70 transition-colors hover:bg-muted/40"
              >
                {/* Professional */}
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarToneClasses[c.avatarTone]}`}
                    >
                      {c.initials}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-1.5 truncate font-medium text-foreground">
                        {c.name}
                        {c.verified && (
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" />
                        )}
                      </span>
                      <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        {c.role}
                        {c.big && (
                          <span className="rounded-sm bg-primary/10 px-1 py-px text-[10px] font-medium text-primary">
                            BIG
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Instelling */}
                <td className="hidden px-3 py-2.5 md:table-cell">
                  <span className="text-xs text-muted-foreground">{c.org}</span>
                </td>

                {/* Status */}
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClasses[c.status]}`}
                  >
                    {c.status}
                  </span>
                </td>

                {/* Match */}
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
                      {c.match}%
                    </span>
                    <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                      <span
                        className={`block h-full rounded-full ${matchBarTone(c.match)}`}
                        style={{ width: `${c.match}%` }}
                      />
                    </span>
                  </div>
                </td>

                {/* Uurtarief */}
                <td className="px-3 py-2.5 text-right">
                  <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
                    €{c.rate},00
                  </span>
                </td>

                {/* BIG vervalt */}
                <td className="hidden px-3 py-2.5 lg:table-cell">
                  <span
                    className={
                      c.expirySoon
                        ? "inline-flex items-center gap-1 font-mono text-xs tabular-nums text-warning"
                        : "inline-flex items-center gap-1 font-mono text-xs tabular-nums text-muted-foreground"
                    }
                  >
                    {c.expirySoon && <Clock className="h-3 w-3" />}
                    {c.expiry}
                  </span>
                </td>

                {/* Row actions */}
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      title="Profiel bekijken"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Bericht sturen"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Documenten verifiëren"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <FileCheck2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Meer acties"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-4 border-t border-border bg-card px-5 py-2.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />6 van 142 professionals
        </span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />4 geverifieerd in beeld
          </span>
          <span className="hidden font-mono tabular-nums sm:inline">Pagina 1 / 24</span>
        </div>
      </div>
    </div>
  );
}
