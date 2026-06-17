import {
  LayoutDashboard,
  Briefcase,
  Users,
  LineChart,
  FileText,
  Search,
  Bell,
  ShieldCheck,
  BadgeCheck,
  ArrowUpRight,
  Plus,
  Clock,
  MapPin,
  TrendingUp,
  Euro,
  Sparkle,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Opdrachten", icon: Briefcase, active: false },
  { label: "ZZP-pool", icon: Users, active: false },
  { label: "Inzicht", icon: LineChart, active: false },
  { label: "Administratie", icon: FileText, active: false },
];

const pool = [
  {
    naam: "Iris Hendriks",
    functie: "Verpleegkundige (BIG)",
    initialen: "IH",
    tint: "bg-primary/15 text-primary",
    tarief: "€ 62",
    match: 96,
    status: "Voorgesteld",
    statusTint: "bg-warning/10 text-warning",
    geverifieerd: true,
    plaats: "Utrecht",
  },
  {
    naam: "Mark Jansen",
    functie: "Verzorgende IG",
    initialen: "MJ",
    tint: "bg-accent/40 text-accent-foreground",
    tarief: "€ 41",
    match: 91,
    status: "Actief",
    statusTint: "bg-success/10 text-success",
    geverifieerd: true,
    plaats: "Amersfoort",
  },
  {
    naam: "Sanne de Vries",
    functie: "Wijkverpleegkundige",
    initialen: "SV",
    tint: "bg-success/15 text-success",
    tarief: "€ 58",
    match: 88,
    status: "In behandeling",
    statusTint: "bg-muted text-muted-foreground",
    geverifieerd: false,
    plaats: "Zeist",
  },
  {
    naam: "Fatima El Amrani",
    functie: "Verpleegkundige (BIG)",
    initialen: "FA",
    tint: "bg-primary/15 text-primary",
    tarief: "€ 64",
    match: 94,
    status: "Afgerond",
    statusTint: "bg-muted text-muted-foreground",
    geverifieerd: true,
    plaats: "Nieuwegein",
  },
];

const opdrachten = [
  {
    titel: "Nachtdienst geriatrie",
    instelling: "ZorgGroep Midden",
    uur: "€ 60 / uur",
    vulgraad: 75,
    open: "3 van 4 diensten gevuld",
  },
  {
    titel: "Wijkzorg ochtendroute",
    instelling: "Verpleeghuis De Noorderbrug",
    uur: "€ 52 / uur",
    vulgraad: 40,
    open: "2 van 5 diensten gevuld",
  },
];

export default function OntwerpTopNav() {
  return (
    <div className="flex min-h-[620px] w-full flex-col overflow-hidden rounded-2xl border border-border bg-background text-foreground">
      {/* Top navigation */}
      <header className="flex items-center gap-6 border-b border-border bg-card/80 px-6 py-3.5 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20">
            <Sparkle className="h-4 w-4" />
          </div>
          <span className="font-display text-base font-semibold tracking-tight">ZorgMatch</span>
        </div>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                item.active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground sm:flex">
            <Search className="h-4 w-4" />
            <span>Zoek in ZZP-pool…</span>
          </div>
          <button className="relative flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition hover:text-foreground">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-danger" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/40 text-sm font-semibold text-accent-foreground ring-1 ring-border">
            BM
          </div>
        </div>
      </header>

      {/* Full-bleed content */}
      <main className="flex flex-1 flex-col gap-6 overflow-y-auto bg-muted/30 px-6 py-6">
        {/* Hero band */}
        <section className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm ring-1 ring-border/40">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                <ShieldCheck className="h-3.5 w-3.5" />
                Compliance op orde — 0 verlopen certificaten
              </div>
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                Goedemorgen, bemiddelaar
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Vandaag wachten 7 nieuwe matches op voorstel en moeten 2 diensten nog gevuld worden.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  Nieuwe opdracht
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted">
                  Bekijk pool
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:w-80">
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Gem. matchscore
                </div>
                <div className="mt-1 font-mono text-2xl font-semibold tracking-tight">92%</div>
                <div className="mt-0.5 text-xs text-success">+4% deze week</div>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Euro className="h-3.5 w-3.5" />
                  Omzet (mnd)
                </div>
                <div className="mt-1 font-mono text-2xl font-semibold tracking-tight">€ 48.2k</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  126 gefactureerde diensten
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Card grid */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ZZP-pool — spans 2 */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm ring-1 ring-border/40 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <div>
                <h2 className="font-display text-sm font-semibold">
                  Voorgestelde zorgprofessionals
                </h2>
                <p className="text-xs text-muted-foreground">
                  Gerangschikt op matchscore en beschikbaarheid
                </p>
              </div>
              <button className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                Alles
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <ul className="divide-y divide-border">
              {pool.map((p) => (
                <li
                  key={p.naam}
                  className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-muted/40"
                >
                  <div
                    className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${p.tint}`}
                  >
                    {p.initialen}
                    {p.geverifieerd && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-card ring-1 ring-border">
                        <BadgeCheck className="h-3.5 w-3.5 text-success" />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{p.naam}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${p.statusTint}`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{p.functie}</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {p.plaats}
                      </span>
                    </div>
                  </div>

                  <div className="hidden text-right sm:block">
                    <div className="font-mono text-sm font-semibold">{p.tarief}</div>
                    <div className="text-[11px] text-muted-foreground">per uur</div>
                  </div>

                  <div className="flex w-14 flex-col items-end">
                    <span className="font-mono text-sm font-semibold text-primary">{p.match}%</span>
                    <span className="text-[11px] text-muted-foreground">match</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Open opdrachten */}
          <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm ring-1 ring-border/40">
              <div className="border-b border-border px-5 py-3.5">
                <h2 className="font-display text-sm font-semibold">Open diensten</h2>
                <p className="text-xs text-muted-foreground">Vulgraad per opdracht</p>
              </div>
              <ul className="divide-y divide-border">
                {opdrachten.map((o) => (
                  <li key={o.titel} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{o.titel}</div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {o.instelling}
                        </div>
                      </div>
                      <span className="shrink-0 font-mono text-xs font-semibold text-foreground">
                        {o.uur}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${
                            o.vulgraad >= 60 ? "bg-success" : "bg-warning"
                          }`}
                          style={{ width: `${o.vulgraad}%` }}
                        />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {o.open}
                        </span>
                        <span className="font-mono font-medium text-foreground">{o.vulgraad}%</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-primary/5 p-5 shadow-sm ring-1 ring-primary/10">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <BadgeCheck className="h-4 w-4" />
                Verificatie-overzicht
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                42 van de 45 actieve professionals zijn volledig geverifieerd.
              </p>
              <button className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                Bekijk verificatiequeue
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
