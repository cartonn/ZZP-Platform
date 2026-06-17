import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Clock,
  Euro,
  MapPin,
  ShieldCheck,
  Sparkle,
  TrendingUp,
  Users,
} from "lucide-react";

export default function OntwerpEditorial() {
  const stats = [
    {
      label: "Actieve samenwerkingen",
      value: "24",
      sub: "deze maand",
      delta: "+3",
      icon: Users,
    },
    {
      label: "Gemiddelde matchscore",
      value: "92%",
      sub: "voorgestelde plaatsingen",
      delta: "+5%",
      icon: TrendingUp,
    },
    {
      label: "Geverifieerd uurtarief",
      value: "€ 68",
      sub: "mediaan per uur",
      delta: "stabiel",
      icon: Euro,
    },
  ];

  const team = [
    { initials: "IH", name: "Iris Hendriks", tint: "bg-primary/15 text-primary" },
    { initials: "MJ", name: "Mark Jansen", tint: "bg-accent text-accent-foreground" },
    { initials: "SV", name: "Sanne de Vries", tint: "bg-success/15 text-success" },
    { initials: "FA", name: "Fatima El Amrani", tint: "bg-warning/15 text-warning" },
  ];

  return (
    <div className="flex min-h-[620px] w-full flex-col overflow-hidden rounded-2xl border border-border bg-background text-foreground">
      {/* Kop */}
      <header className="flex items-start justify-between px-12 pt-12">
        <div className="max-w-xl">
          <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkle className="h-3.5 w-3.5 text-primary" />
            Maandag, rustig overzicht
          </p>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-foreground">
            Goedemorgen,
            <br />
            <span className="text-muted-foreground">ZorgGroep Midden</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
            Alles loopt op schema. Drie plaatsingen vragen vandaag uw aandacht, de rest verloopt
            zonder ruis.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-card-foreground shadow-sm ring-1 ring-border/40 transition-colors hover:bg-muted">
          Nieuwe opdracht
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </header>

      {/* Stat-blokken */}
      <section className="grid grid-cols-3 gap-5 px-12 py-12">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="group rounded-xl border border-border bg-card p-7 shadow-sm ring-1 ring-border/30 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-mono text-xs font-medium text-success">{s.delta}</span>
              </div>
              <p className="mt-7 font-mono text-4xl font-semibold tracking-tight text-card-foreground">
                {s.value}
              </p>
              <p className="mt-2 text-sm font-medium text-card-foreground">{s.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p>
            </div>
          );
        })}
      </section>

      {/* Brede samenwerkingskaart */}
      <section className="px-12 pb-12">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm ring-1 ring-border/30">
          <div className="flex items-center justify-between border-b border-border px-8 py-5">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-semibold text-card-foreground">
                Recente samenwerking
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                <ShieldCheck className="h-3.5 w-3.5" />
                Geverifieerd
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Actief
            </span>
          </div>

          <div className="flex items-center gap-7 px-8 py-7">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display text-xl font-semibold text-primary">
              IH
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-success text-primary-foreground">
                <BadgeCheck className="h-3.5 w-3.5" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-display text-lg font-semibold text-card-foreground">
                  Iris Hendriks
                </p>
                <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                  Verpleegkundige (BIG)
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  Verpleeghuis De Noorderbrug
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  Sinds 3 maart
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  32 uur per week
                </span>
              </div>
            </div>

            <div className="hidden shrink-0 flex-col items-end gap-1 border-l border-border pl-7 sm:flex">
              <p className="font-mono text-2xl font-semibold tracking-tight text-card-foreground">
                € 71
              </p>
              <p className="text-xs text-muted-foreground">per uur</p>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-xs font-medium text-primary">
                96% match
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border bg-muted/40 px-8 py-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {team.map((m) => (
                  <span
                    key={m.initials}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-card text-xs font-semibold ${m.tint}`}
                    title={m.name}
                  >
                    {m.initials}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Iris werkt samen met Mark, Sanne en Fatima in dit team
              </p>
            </div>
            <button className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-80">
              Bekijk dossier
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
