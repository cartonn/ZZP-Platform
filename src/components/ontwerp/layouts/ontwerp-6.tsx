import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  Euro,
  FileText,
  Filter,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Users,
} from "lucide-react";

type FeedKind = "factuur" | "match" | "uren" | "dispuut" | "verificatie" | "bericht";

type FeedItem = {
  id: string;
  kind: FeedKind;
  title: string;
  detail: string;
  who: string;
  initials: string;
  avatarTone: "primary" | "accent" | "success" | "warning";
  time: string;
  amount?: string;
  metaLabel?: string;
  metaValue?: string;
  status: "Afgerond" | "Voorgesteld" | "In behandeling" | "Geverifieerd" | "Actief";
};

type FeedDay = {
  label: string;
  sub: string;
  items: FeedItem[];
};

const avatarTones: Record<FeedItem["avatarTone"], string> = {
  primary: "bg-primary/15 text-primary",
  accent: "bg-accent/15 text-accent-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
};

const statusTones: Record<FeedItem["status"], string> = {
  Afgerond: "bg-success/10 text-success",
  Voorgesteld: "bg-primary/10 text-primary",
  "In behandeling": "bg-warning/10 text-warning",
  Geverifieerd: "bg-success/10 text-success",
  Actief: "bg-accent/15 text-accent-foreground",
};

const kindMeta: Record<
  FeedKind,
  { icon: typeof Activity; ring: string; dot: string; chip: string; label: string }
> = {
  factuur: {
    icon: Euro,
    ring: "ring-success/30",
    dot: "bg-success/15 text-success",
    chip: "bg-success/10 text-success",
    label: "Factuur",
  },
  match: {
    icon: Sparkles,
    ring: "ring-primary/30",
    dot: "bg-primary/15 text-primary",
    chip: "bg-primary/10 text-primary",
    label: "Match",
  },
  uren: {
    icon: Clock,
    ring: "ring-warning/30",
    dot: "bg-warning/15 text-warning",
    chip: "bg-warning/10 text-warning",
    label: "Urenstaat",
  },
  dispuut: {
    icon: ShieldCheck,
    ring: "ring-accent/30",
    dot: "bg-accent/15 text-accent-foreground",
    chip: "bg-accent/15 text-accent-foreground",
    label: "Dispuut",
  },
  verificatie: {
    icon: BadgeCheck,
    ring: "ring-success/30",
    dot: "bg-success/15 text-success",
    chip: "bg-success/10 text-success",
    label: "Verificatie",
  },
  bericht: {
    icon: MessageSquare,
    ring: "ring-primary/30",
    dot: "bg-primary/15 text-primary",
    chip: "bg-primary/10 text-primary",
    label: "Bericht",
  },
};

const days: FeedDay[] = [
  {
    label: "Vandaag",
    sub: "donderdag 12 juni",
    items: [
      {
        id: "1",
        kind: "factuur",
        title: "Factuur goedgekeurd",
        detail:
          "Week 23 voor Iris Hendriks bij ZorgGroep Midden is geaccordeerd en staat klaar voor betaling.",
        who: "Iris Hendriks · Verpleegkundige (BIG)",
        initials: "IH",
        avatarTone: "primary",
        time: "09:42",
        amount: "€ 2.184,00",
        metaLabel: "Uurtarief",
        metaValue: "€ 62,50",
        status: "Afgerond",
      },
      {
        id: "2",
        kind: "match",
        title: "Nieuwe match voorgesteld",
        detail:
          "Sanne de Vries past op de openstaande nachtdienst bij Verpleeghuis De Noorderbrug.",
        who: "Sanne de Vries · Verzorgende IG",
        initials: "SV",
        avatarTone: "accent",
        time: "08:55",
        metaLabel: "Matchscore",
        metaValue: "94%",
        status: "Voorgesteld",
      },
      {
        id: "3",
        kind: "uren",
        title: "Urenstaat ingediend",
        detail:
          "Mark Jansen diende 36 uur in voor de week bij ZorgGroep Midden — wacht op akkoord.",
        who: "Mark Jansen · Wijkverpleegkundige",
        initials: "MJ",
        avatarTone: "warning",
        time: "08:12",
        metaLabel: "Uren",
        metaValue: "36,0 u",
        status: "In behandeling",
      },
    ],
  },
  {
    label: "Gisteren",
    sub: "woensdag 11 juni",
    items: [
      {
        id: "4",
        kind: "dispuut",
        title: "Dispuut opgelost",
        detail:
          "Verschil in geregistreerde uren tussen Fatima El Amrani en De Noorderbrug is bemiddeld en gesloten.",
        who: "Fatima El Amrani · Verzorgende IG",
        initials: "FA",
        avatarTone: "success",
        time: "16:30",
        metaLabel: "Doorlooptijd",
        metaValue: "1d 4u",
        status: "Afgerond",
      },
      {
        id: "5",
        kind: "verificatie",
        title: "BIG-registratie geverifieerd",
        detail: "Het zegel van Iris Hendriks is opnieuw gecontroleerd en geldig tot mei 2031.",
        who: "Iris Hendriks · Verpleegkundige (BIG)",
        initials: "IH",
        avatarTone: "primary",
        time: "14:08",
        metaLabel: "Geldig tot",
        metaValue: "05-2031",
        status: "Geverifieerd",
      },
      {
        id: "6",
        kind: "bericht",
        title: "Reactie van opdrachtgever",
        detail: "ZorgGroep Midden bevestigde de planning voor de aankomende weekenddiensten.",
        who: "ZorgGroep Midden · Opdrachtgever",
        initials: "ZM",
        avatarTone: "accent",
        time: "11:21",
        status: "Actief",
      },
    ],
  },
];

const weekStats = [
  {
    label: "Goedgekeurde facturen",
    value: "€ 18.640",
    icon: Euro,
    trend: "+12%",
    tone: "text-success",
  },
  { label: "Nieuwe matches", value: "27", icon: Sparkles, trend: "+6", tone: "text-primary" },
  { label: "Open urenstaten", value: "4", icon: Clock, trend: "−2", tone: "text-warning" },
  { label: "Gem. matchscore", value: "91%", icon: TrendingUp, trend: "+3%", tone: "text-success" },
];

const fillRate = 86;

export default function OntwerpFeed() {
  return (
    <div className="flex min-h-[620px] w-full flex-col overflow-hidden rounded-2xl border border-border bg-background text-foreground">
      {/* Topbar */}
      <header className="flex items-center justify-between gap-4 border-b border-border bg-card/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-base font-semibold leading-tight">Activiteit</h1>
            <p className="text-xs text-muted-foreground">Alle gebeurtenissen in jouw bemiddeling</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg border border-input bg-card px-3 py-1.5 text-sm text-muted-foreground sm:flex">
            <Search className="h-4 w-4" />
            <span>Zoek in tijdlijn</span>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-input bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Timeline */}
        <main className="min-w-0 flex-1 overflow-y-auto px-6 py-5">
          {days.map((day) => (
            <section key={day.label} className="mb-6 last:mb-0">
              {/* Day header */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-display text-sm font-semibold text-foreground">
                    {day.label}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{day.sub}</span>
                <span className="h-px flex-1 bg-border" />
                <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                  {day.items.length} items
                </span>
              </div>

              {/* Items on the vertical line */}
              <div className="relative pl-9">
                <span className="absolute bottom-1 left-[14px] top-1 w-px bg-border" aria-hidden />
                <div className="space-y-3">
                  {day.items.map((item) => {
                    const meta = kindMeta[item.kind];
                    const Icon = meta.icon;
                    return (
                      <article
                        key={item.id}
                        className="group relative rounded-xl border border-border bg-card p-4 shadow-sm ring-1 ring-border/40 transition-shadow hover:shadow-md hover:ring-ring/30"
                      >
                        {/* Dot on the line */}
                        <span
                          className={`absolute -left-[31px] top-4 flex h-7 w-7 items-center justify-center rounded-full ${meta.dot} ring-4 ring-background`}
                          aria-hidden
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>

                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold ${avatarTones[item.avatarTone]}`}
                          >
                            {item.initials}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="font-display text-sm font-semibold leading-tight text-card-foreground">
                                    {item.title}
                                  </h3>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.chip}`}
                                  >
                                    {meta.label}
                                  </span>
                                </div>
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                  {item.who}
                                </p>
                              </div>
                              <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                                {item.time}
                              </span>
                            </div>

                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                              {item.detail}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTones[item.status]}`}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                {item.status}
                              </span>
                              {item.amount ? (
                                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs font-medium text-foreground">
                                  <Euro className="h-3 w-3 text-muted-foreground" />
                                  {item.amount}
                                </span>
                              ) : null}
                              {item.metaLabel ? (
                                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground">
                                  {item.metaLabel}
                                  <span className="font-mono font-medium text-foreground">
                                    {item.metaValue}
                                  </span>
                                </span>
                              ) : null}
                              <button className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-primary opacity-0 transition-opacity hover:underline group-hover:opacity-100">
                                Bekijk
                                <ArrowUpRight className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          ))}
        </main>

        {/* Right meta column */}
        <aside className="hidden w-72 shrink-0 flex-col gap-4 border-l border-border bg-card/40 px-5 py-5 lg:flex">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm font-semibold">Deze week</h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {weekStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border bg-card p-3 shadow-sm ring-1 ring-border/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className={`font-mono text-[11px] font-medium ${stat.tone}`}>
                      {stat.trend}
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-lg font-semibold leading-none text-foreground">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* Fill rate */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm ring-1 ring-border/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Vulgraad diensten</span>
              <span className="font-mono text-sm font-semibold text-success">{fillRate}%</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-success"
                style={{ width: `${fillRate}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              42 van 49 diensten ingevuld voor week 24.
            </p>
          </div>

          {/* Verified pros */}
          <div className="rounded-xl border border-border bg-primary/5 p-4 ring-1 ring-primary/15">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="font-display text-sm font-semibold text-foreground">
                Geverifieerd team
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Alle actieve zorgprofessionals dragen een geldig zegel.
            </p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex -space-x-2">
                {[
                  { i: "IH", t: "bg-primary/15 text-primary" },
                  { i: "MJ", t: "bg-warning/15 text-warning" },
                  { i: "SV", t: "bg-accent/15 text-accent-foreground" },
                  { i: "FA", t: "bg-success/15 text-success" },
                ].map((a) => (
                  <span
                    key={a.i}
                    className={`flex h-7 w-7 items-center justify-center rounded-full font-display text-[11px] font-semibold ring-2 ring-card ${a.t}`}
                  >
                    {a.i}
                  </span>
                ))}
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                +18
              </span>
            </div>
          </div>

          <button className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
            <FileText className="h-4 w-4" />
            Volledig logboek
          </button>
        </aside>
      </div>
    </div>
  );
}
