import {
  Search,
  SlidersHorizontal,
  ShieldCheck,
  Sparkles,
  MapPin,
  Clock,
  TrendingUp,
  Plus,
  MoreHorizontal,
  CalendarCheck,
  ArrowUpRight,
} from "lucide-react";

type Stage = "voorgesteld" | "actief" | "afgerond";

type PipelineCard = {
  id: string;
  name: string;
  initials: string;
  accent: string;
  role: string;
  institution: string;
  location: string;
  match: number;
  rate: number;
  verified: boolean;
  status: string;
  meta: string;
};

const columns: {
  key: Stage;
  title: string;
  hint: string;
  cards: PipelineCard[];
}[] = [
  {
    key: "voorgesteld",
    title: "Voorgesteld",
    hint: "Wacht op reactie",
    cards: [
      {
        id: "c1",
        name: "Iris Hendriks",
        initials: "IH",
        accent: "bg-primary/15 text-primary",
        role: "Verpleegkundige (BIG)",
        institution: "ZorgGroep Midden",
        location: "Utrecht",
        match: 96,
        rate: 58,
        verified: true,
        status: "Voorgesteld",
        meta: "Nachtdienst · 32u",
      },
      {
        id: "c2",
        name: "Mark Jansen",
        initials: "MJ",
        accent: "bg-accent/40 text-accent-foreground",
        role: "Verzorgende IG",
        institution: "Verpleeghuis De Noorderbrug",
        location: "Groningen",
        match: 88,
        rate: 44,
        verified: true,
        status: "Voorgesteld",
        meta: "Dagdienst · 24u",
      },
      {
        id: "c3",
        name: "Fatima El Amrani",
        initials: "FE",
        accent: "bg-warning/15 text-warning",
        role: "Wijkverpleegkundige",
        institution: "ZorgGroep Midden",
        location: "Amersfoort",
        match: 82,
        rate: 52,
        verified: false,
        status: "In behandeling",
        meta: "Verificatie loopt",
      },
    ],
  },
  {
    key: "actief",
    title: "Actief",
    hint: "Lopende plaatsing",
    cards: [
      {
        id: "c4",
        name: "Sanne de Vries",
        initials: "SV",
        accent: "bg-success/15 text-success",
        role: "Verpleegkundige (BIG)",
        institution: "Verpleeghuis De Noorderbrug",
        location: "Groningen",
        match: 94,
        rate: 61,
        verified: true,
        status: "Actief",
        meta: "Wk 24 · 36u",
      },
      {
        id: "c5",
        name: "Mark Jansen",
        initials: "MJ",
        accent: "bg-accent/40 text-accent-foreground",
        role: "Verzorgende IG",
        institution: "ZorgGroep Midden",
        location: "Utrecht",
        match: 90,
        rate: 46,
        verified: true,
        status: "Actief",
        meta: "Wk 24 · 28u",
      },
    ],
  },
  {
    key: "afgerond",
    title: "Afgerond",
    hint: "Klaar voor facturatie",
    cards: [
      {
        id: "c6",
        name: "Iris Hendriks",
        initials: "IH",
        accent: "bg-primary/15 text-primary",
        role: "Verpleegkundige (BIG)",
        institution: "ZorgGroep Midden",
        location: "Utrecht",
        match: 97,
        rate: 58,
        verified: true,
        status: "Afgerond",
        meta: "€ 4.176 · 72u",
      },
      {
        id: "c7",
        name: "Sanne de Vries",
        initials: "SV",
        accent: "bg-success/15 text-success",
        role: "Wijkverpleegkundige",
        institution: "Verpleeghuis De Noorderbrug",
        location: "Groningen",
        match: 91,
        rate: 53,
        verified: true,
        status: "Afgerond",
        meta: "€ 2.226 · 42u",
      },
    ],
  },
];

function matchTone(match: number): string {
  if (match >= 92) return "bg-success/10 text-success";
  if (match >= 85) return "bg-primary/10 text-primary";
  return "bg-warning/10 text-warning";
}

export default function OntwerpKanban() {
  return (
    <div className="flex min-h-[620px] w-full flex-col overflow-hidden rounded-2xl border border-border bg-background text-foreground">
      {/* Kop met filters */}
      <header className="flex flex-col gap-3 border-b border-border bg-card/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-display text-base font-semibold leading-tight text-card-foreground">
              Bemiddelingspijplijn
            </h2>
            <p className="text-xs text-muted-foreground">
              ZorgGroep Midden · 7 trajecten in beweging
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              readOnly
              value="Zoek op functie of regio"
              className="w-40 bg-transparent text-xs text-muted-foreground outline-none"
            />
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            Filters
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            Voorstellen
          </button>
        </div>
      </header>

      {/* Pijplijn-kolommen */}
      <div className="flex flex-1 gap-4 overflow-x-auto bg-muted/30 p-4">
        {columns.map((col) => (
          <section
            key={col.key}
            className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-card/40"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-semibold text-card-foreground">
                  {col.title}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] font-medium text-muted-foreground">
                  {col.cards.length}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">{col.hint}</span>
            </div>

            <div className="flex flex-1 flex-col gap-3 px-3 pb-4">
              {col.cards.map((card) => (
                <article
                  key={card.id}
                  className="group rounded-lg border border-border bg-card p-3 shadow-sm ring-1 ring-border/40 transition hover:shadow-md hover:ring-ring/50"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-xs font-semibold ${card.accent}`}
                    >
                      {card.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="truncate text-sm font-medium text-card-foreground">
                          {card.name}
                        </h3>
                        {card.verified ? (
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" />
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{card.role}</p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-muted group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{card.institution}</span>
                      <span className="text-border">·</span>
                      <span className="shrink-0">{card.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {col.key === "afgerond" ? (
                        <CalendarCheck className="h-3.5 w-3.5" />
                      ) : (
                        <Clock className="h-3.5 w-3.5" />
                      )}
                      <span className="truncate">{card.meta}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${matchTone(
                        card.match,
                      )}`}
                    >
                      <Sparkles className="h-3 w-3" />
                      <span className="font-mono">{card.match}%</span> match
                    </span>
                    <span className="inline-flex items-baseline gap-0.5 font-mono text-sm font-semibold text-card-foreground">
                      € {card.rate}
                      <span className="text-[11px] font-normal text-muted-foreground">/u</span>
                    </span>
                  </div>
                </article>
              ))}

              <button
                type="button"
                className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted-foreground transition hover:border-input hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Kaart toevoegen
              </button>
            </div>
          </section>
        ))}
      </div>

      {/* Voettekst met pijplijn-metriek */}
      <footer className="flex items-center justify-between border-t border-border bg-card/60 px-5 py-3 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5 text-success" />
          <span>
            Vulgraad deze week <span className="font-mono font-semibold text-foreground">87%</span>{" "}
            · gemiddelde matchscore{" "}
            <span className="font-mono font-semibold text-foreground">91%</span>
          </span>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 font-medium text-primary transition hover:opacity-80"
        >
          Pijplijnrapport
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </footer>
    </div>
  );
}
