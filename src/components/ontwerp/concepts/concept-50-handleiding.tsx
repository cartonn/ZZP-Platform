"use client";

// Concept 50 — "Handleiding" · Technische documentatie / API-referentie (LICHT).
// Het platform gepresenteerd als ontwikkelaars-documentatie in Stripe-docs-stijl: een
// twee-koloms docs-layout met links een inhoudsopgave (de kernschermen als doc-secties),
// een middenkolom met doc-koppen, ankerlinks, definitielijsten, notice-/callout-boxen
// (info/waarschuwing), monospace annotatieblokken en data als nette gedocumenteerde tabellen,
// en rechts een "op deze pagina"-rail. Kalm, precies, ultra-leesbaar, developer-grade.
// Dit is de anti-decoratieve, informatie-eerst richting: geen kleurverloop, geen ruis.
// Palet: bg #fbfbfd, panel #ffffff, ink #1a1f2b, muted #5b6472, hairline #e7e9ef,
// indigo #635bff, groen #12805c.
// Fonts: --font-lab-inter (body) + --font-lab-geist-mono (code/annotaties).

import { useMemo, useRef, useState } from "react";
import {
  Search,
  ChevronRight,
  Hash,
  Info,
  AlertTriangle,
  Check,
  Clock,
  BookOpen,
  Copy,
  Link2,
  Send,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Menu,
  type LucideIcon,
} from "lucide-react";
import {
  SCREENS,
  KPIS,
  OPDRACHTEN,
  CREDENTIALS,
  ACTIES,
  FACTUREN,
  PROFIEL,
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

/* ---------- Palet & typografie ---------- */

const C = {
  bg: "#fbfbfd",
  panel: "#ffffff",
  panelAlt: "#f6f7f9",
  code: "#f4f5f8",
  ink: "#1a1f2b",
  inkSoft: "#3a4250",
  muted: "#5b6472",
  faint: "#98a0ad",
  line: "#e7e9ef",
  lineSoft: "#f0f1f5",
  indigo: "#635bff",
  indigoSoft: "#efeeff",
  indigoLine: "#d8d6ff",
  green: "#12805c",
  greenSoft: "#e4f4ee",
  amber: "#a86400",
  amberSoft: "#fbf0da",
  red: "#c62b45",
  redSoft: "#fbe8ec",
};

const body = { fontFamily: "var(--font-lab-inter)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

/* ---------- Status-taal ---------- */

type Tone = "green" | "amber" | "red" | "indigo" | "muted";

const TONE: Record<Tone, { fg: string; bg: string; line: string }> = {
  green: { fg: C.green, bg: C.greenSoft, line: "#bfe3d4" },
  amber: { fg: C.amber, bg: C.amberSoft, line: "#efd9a8" },
  red: { fg: C.red, bg: C.redSoft, line: "#f2c2cd" },
  indigo: { fg: C.indigo, bg: C.indigoSoft, line: C.indigoLine },
  muted: { fg: C.muted, bg: C.panelAlt, line: C.line },
};

function statusMeta(s: CredStatus): { label: string; tone: Tone; code: string; Icon: LucideIcon } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", tone: "green", code: "VERIFIED", Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", tone: "indigo", code: "SUBMITTED", Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", tone: "amber", code: "EXPIRING", Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", tone: "red", code: "REJECTED", Icon: AlertTriangle };
  }
}

/* ---------- TOC-structuur ---------- */

type Anchor = { id: string; label: string };

const GROUPS: { label: string; keys: ScreenKey[] }[] = [
  { label: "Aan de slag", keys: ["dashboard", "marktplaats"] },
  { label: "Kernmodules", keys: ["opdracht", "verificatie"] },
  { label: "Beheer", keys: ["acties", "facturen"] },
];

const ANCHORS: Partial<Record<ScreenKey, Anchor[]>> = {
  dashboard: [
    { id: "overzicht", label: "Overzicht" },
    { id: "kpi", label: "Kernindicatoren" },
    { id: "matches", label: "Aanbevolen matches" },
    { id: "activiteit", label: "Recente activiteit" },
  ],
  marktplaats: [
    { id: "introductie", label: "Introductie" },
    { id: "zoeken", label: "Zoeken & filteren" },
    { id: "opdrachten", label: "Opdrachtenlijst" },
    { id: "matchlogica", label: "Match-logica" },
  ],
  opdracht: [
    { id: "resource", label: "De opdracht-resource" },
    { id: "eigenschappen", label: "Eigenschappen" },
    { id: "redenen", label: "Match-onderbouwing" },
    { id: "reageren", label: "Reageren" },
  ],
  verificatie: [
    { id: "statussen", label: "Statuswaarden" },
    { id: "certificaten", label: "Certificaten" },
    { id: "documenten", label: "Documenten" },
  ],
  acties: [
    { id: "introductie", label: "Introductie" },
    { id: "openstaand", label: "Openstaande acties" },
  ],
  facturen: [
    { id: "overzicht", label: "Overzicht" },
    { id: "tabel", label: "Facturentabel" },
    { id: "statussen", label: "Statuswaarden" },
  ],
};

const BREADCRUMB: Partial<Record<ScreenKey, string>> = {
  dashboard: "Overzicht",
  marktplaats: "Marktplaats",
  opdracht: "Kernmodules",
  verificatie: "Kernmodules",
  acties: "Beheer",
  facturen: "Beheer",
};

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Doc-primitieven ---------- */

function Badge({
  tone,
  mono: useMono,
  children,
}: {
  tone: Tone;
  mono?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium"
      style={{
        color: TONE[tone].fg,
        background: TONE[tone].bg,
        border: `1px solid ${TONE[tone].line}`,
        ...(useMono ? mono : body),
      }}
    >
      {children}
    </span>
  );
}

function AnchorHeading({
  id,
  children,
  onAnchor,
}: {
  id: string;
  children: React.ReactNode;
  onAnchor: (id: string) => void;
}) {
  return (
    <h2
      id={id}
      className="group mt-10 flex scroll-mt-6 items-center gap-2 text-[18px] font-semibold tracking-tight first:mt-0"
      style={{ color: C.ink }}
    >
      <button
        onClick={() => onAnchor(id)}
        aria-label={`Link naar sectie ${id}`}
        className="-ml-6 flex h-5 w-5 items-center justify-center rounded opacity-0 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635bff] group-hover:opacity-100"
        style={{ color: C.indigo }}
      >
        <Hash size={15} aria-hidden="true" />
      </button>
      {children}
    </h2>
  );
}

function Lede({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 max-w-2xl text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
      {children}
    </p>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 max-w-2xl text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
      {children}
    </p>
  );
}

function Callout({
  kind,
  title,
  children,
}: {
  kind: "info" | "waarschuwing" | "let-op";
  title: string;
  children: React.ReactNode;
}) {
  const map = {
    info: { tone: "indigo" as Tone, Icon: Info },
    waarschuwing: { tone: "amber" as Tone, Icon: AlertTriangle },
    "let-op": { tone: "red" as Tone, Icon: AlertTriangle },
  };
  const m = map[kind];
  return (
    <div
      className="mt-5 flex gap-3 rounded-lg p-4"
      style={{ background: TONE[m.tone].bg, border: `1px solid ${TONE[m.tone].line}` }}
      role="note"
    >
      <m.Icon
        size={17}
        className="mt-0.5 shrink-0"
        style={{ color: TONE[m.tone].fg }}
        aria-hidden="true"
      />
      <div>
        <p className="text-[13px] font-semibold" style={{ color: TONE[m.tone].fg }}>
          {title}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
          {children}
        </p>
      </div>
    </div>
  );
}

function Annotation({ lines }: { lines: { k: string; v: string; comment?: string }[] }) {
  return (
    <div
      className="mt-5 overflow-x-auto rounded-lg"
      style={{ background: C.code, border: `1px solid ${C.line}` }}
    >
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        <span
          className="text-[11px] font-medium uppercase tracking-[0.12em]"
          style={{ color: C.muted, ...mono }}
        >
          voorbeeld · object
        </span>
        <button
          className="flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635bff]"
          style={{ color: C.muted, ...mono }}
          aria-label="Kopieer voorbeeld"
        >
          <Copy size={12} aria-hidden="true" /> kopieer
        </button>
      </div>
      <pre
        className="overflow-x-auto px-4 py-3 text-[12.5px] leading-relaxed"
        style={{ ...mono, color: C.inkSoft }}
      >
        <span style={{ color: C.faint }}>{"{"}</span>
        {lines.map((l) => (
          <span key={l.k} className="block pl-4">
            <span style={{ color: C.indigo }}>&quot;{l.k}&quot;</span>
            <span style={{ color: C.faint }}>: </span>
            <span style={{ color: C.green }}>&quot;{l.v}&quot;</span>
            <span style={{ color: C.faint }}>,</span>
            {l.comment && <span style={{ color: C.faint }}>{"  // " + l.comment}</span>}
          </span>
        ))}
        <span style={{ color: C.faint }}>{"}"}</span>
      </pre>
    </div>
  );
}

function DefList({
  items,
}: {
  items: { term: string; type: string; desc: string; tone?: Tone }[];
}) {
  return (
    <dl className="mt-5 divide-y" style={{ borderColor: C.line }}>
      {items.map((it) => (
        <div
          key={it.term}
          className="grid grid-cols-1 gap-1 py-3.5 sm:grid-cols-[200px_1fr] sm:gap-4"
        >
          <dt className="flex items-start gap-2">
            <code
              className="rounded px-1.5 py-0.5 text-[12.5px] font-medium"
              style={{ background: C.code, border: `1px solid ${C.line}`, color: C.ink, ...mono }}
            >
              {it.term}
            </code>
          </dt>
          <dd>
            <span
              className="text-[11px] font-medium uppercase tracking-[0.08em]"
              style={{ color: it.tone ? TONE[it.tone].fg : C.faint, ...mono }}
            >
              {it.type}
            </span>
            <p className="mt-1 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {it.desc}
            </p>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept50() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const [activeAnchor, setActiveAnchor] = useState<string>("");
  const [navOpen, setNavOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const anchors = ANCHORS[screen] ?? [];
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const go = (key: ScreenKey) => {
    setScreen(key);
    setActiveAnchor("");
    setNavOpen(false);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const openOpdracht = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
    setActiveAnchor("");
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const scrollToAnchor = (id: string) => {
    setActiveAnchor(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const label = SCREENS.find((s) => s.key === screen)?.label ?? "";

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, color: C.ink, background: C.bg }}
    >
      <div className="flex min-h-[680px]">
        {/* ---------- Links: TOC-zijbalk ---------- */}
        <aside
          className={`${navOpen ? "flex" : "hidden"} absolute inset-y-0 left-0 z-20 w-[248px] shrink-0 flex-col md:relative md:flex`}
          style={{ background: C.panel, borderRight: `1px solid ${C.line}` }}
        >
          <div
            className="flex items-center gap-2.5 px-5 py-4"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: C.indigo }}
            >
              <BookOpen size={16} color="#fff" aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <div className="text-[13.5px] font-semibold tracking-tight">Handleiding</div>
              <div className="text-[10.5px]" style={{ color: C.muted, ...mono }}>
                v2.4 · docs
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Documentatie-inhoudsopgave">
            {GROUPS.map((g) => (
              <div key={g.label} className="mb-5">
                <p
                  className="px-2.5 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: C.faint }}
                >
                  {g.label}
                </p>
                <div className="flex flex-col">
                  {g.keys.map((key) => {
                    const s = SCREENS.find((x) => x.key === key);
                    if (!s) return null;
                    const on = key === screen;
                    return (
                      <button
                        key={key}
                        onClick={() => go(key)}
                        aria-current={on ? "page" : undefined}
                        className="relative flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635bff]"
                        style={{
                          color: on ? C.indigo : C.inkSoft,
                          background: on ? C.indigoSoft : "transparent",
                          fontWeight: on ? 600 : 400,
                        }}
                      >
                        {on && (
                          <span
                            className="absolute -left-3 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full"
                            style={{ background: C.indigo }}
                            aria-hidden="true"
                          />
                        )}
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="px-4 py-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold"
                style={{ background: C.indigoSoft, color: C.indigo, ...mono }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12px] font-medium">{PROFIEL.naam}</div>
                <div className="flex items-center gap-1 text-[10.5px]" style={{ color: C.green }}>
                  <Check size={10} aria-hidden="true" /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {navOpen && (
          <button
            className="absolute inset-0 z-10 bg-black/20 md:hidden"
            aria-label="Sluit navigatie"
            onClick={() => setNavOpen(false)}
          />
        )}

        {/* ---------- Midden + rechts ---------- */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbalk met zoeken */}
          <header
            className="flex h-14 shrink-0 items-center gap-3 px-4 sm:px-6"
            style={{ borderBottom: `1px solid ${C.line}`, background: C.panel }}
          >
            <button
              className="rounded-md p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635bff] md:hidden"
              style={{ border: `1px solid ${C.line}`, color: C.muted }}
              aria-label="Open navigatie"
              onClick={() => setNavOpen(true)}
            >
              <Menu size={16} aria-hidden="true" />
            </button>
            <label className="relative flex-1 sm:max-w-sm">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: C.faint }}
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Zoek in de documentatie…"
                aria-label="Zoek in de documentatie"
                className="w-full rounded-lg py-2 pl-9 pr-14 text-[13px] outline-none transition-colors focus:border-[#635bff]"
                style={{ background: C.panelAlt, border: `1px solid ${C.line}`, color: C.ink }}
              />
              <kbd
                className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded px-1.5 py-0.5 text-[10.5px] sm:block"
                style={{
                  background: C.panel,
                  border: `1px solid ${C.line}`,
                  color: C.faint,
                  ...mono,
                }}
              >
                ⌘K
              </kbd>
            </label>
            <div
              className="ml-auto hidden items-center gap-2 text-[12px] sm:flex"
              style={{ color: C.muted }}
            >
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1"
                style={{ background: C.greenSoft, color: C.green, ...mono }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: C.green }}
                  aria-hidden="true"
                />
                status · online
              </span>
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            {/* Middenkolom */}
            <div ref={scrollRef} className="min-w-0 flex-1 overflow-y-auto">
              <div className="mx-auto max-w-3xl px-5 py-8 pl-10 sm:px-8 sm:pl-14">
                {/* Breadcrumb */}
                <nav
                  aria-label="Kruimelpad"
                  className="flex items-center gap-1.5 text-[12px]"
                  style={{ color: C.muted }}
                >
                  <span>Documentatie</span>
                  <ChevronRight size={13} aria-hidden="true" style={{ color: C.faint }} />
                  <span>{BREADCRUMB[screen]}</span>
                  <ChevronRight size={13} aria-hidden="true" style={{ color: C.faint }} />
                  <span style={{ color: C.ink }}>{label}</span>
                </nav>

                <div className="mt-4">
                  {screen === "dashboard" && (
                    <DashboardDoc onAnchor={scrollToAnchor} onOpen={openOpdracht} />
                  )}
                  {screen === "marktplaats" && (
                    <MarktplaatsDoc onAnchor={scrollToAnchor} onOpen={openOpdracht} />
                  )}
                  {screen === "opdracht" && (
                    <OpdrachtDoc opdracht={active} onAnchor={scrollToAnchor} />
                  )}
                  {screen === "verificatie" && <VerificatieDoc onAnchor={scrollToAnchor} />}
                  {screen === "acties" && <ActiesDoc onAnchor={scrollToAnchor} />}
                  {screen === "facturen" && <FacturenDoc onAnchor={scrollToAnchor} />}
                </div>

                {/* Paginavoet */}
                <div
                  className="mt-14 flex items-center justify-between border-t pt-5 text-[12.5px]"
                  style={{ borderColor: C.line, color: C.muted }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <FileText size={13} aria-hidden="true" /> Laatst bijgewerkt · 3 juli
                  </span>
                  <a
                    href="#top"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="inline-flex items-center gap-1 rounded transition-colors hover:text-[#635bff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635bff]"
                    style={{ color: C.indigo }}
                  >
                    Terug naar boven <ArrowUpRight size={13} aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>

            {/* Rechterrail: op deze pagina */}
            <aside
              className="hidden w-[212px] shrink-0 overflow-y-auto px-5 py-8 lg:block"
              style={{ borderLeft: `1px solid ${C.line}` }}
              aria-label="Op deze pagina"
            >
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.faint }}
              >
                Op deze pagina
              </p>
              <ul className="mt-3 space-y-0.5">
                {anchors.map((a) => {
                  const on = a.id === activeAnchor;
                  return (
                    <li key={a.id}>
                      <button
                        onClick={() => scrollToAnchor(a.id)}
                        className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-[12.5px] leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635bff]"
                        style={{
                          color: on ? C.indigo : C.muted,
                          background: on ? C.indigoSoft : "transparent",
                          fontWeight: on ? 600 : 400,
                        }}
                      >
                        <Link2
                          size={11}
                          className="shrink-0"
                          style={{ color: on ? C.indigo : C.faint }}
                          aria-hidden="true"
                        />
                        {a.label}
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div
                className="mt-8 rounded-lg p-3.5"
                style={{ background: C.panelAlt, border: `1px solid ${C.line}` }}
              >
                <p className="text-[12px] font-semibold">Hulp nodig?</p>
                <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: C.muted }}>
                  Elke sectie is gedocumenteerd met voorbeelden en definities.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Dashboard-doc ---------- */

function DashboardDoc({
  onAnchor,
  onOpen,
}: {
  onAnchor: (id: string) => void;
  onOpen: (id?: string) => void;
}) {
  return (
    <article>
      <span
        className="text-[12px] font-medium uppercase tracking-[0.12em]"
        style={{ color: C.indigo, ...mono }}
      >
        Overzicht
      </span>
      <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-tight">Dashboard</h1>
      <Lede>
        Het dashboard is je startpagina. Het beantwoordt in één oogopslag vier vragen: wat is je
        status, wat moet je nu doen, wat is de beste volgende actie en wie kun je vertrouwen. Alle
        waarden hieronder zijn server-side bepaald en alleen ter weergave.
      </Lede>

      <AnchorHeading id="overzicht" onAnchor={onAnchor}>
        Overzicht
      </AnchorHeading>
      <Prose>
        Voor <strong>{PROFIEL.naam}</strong> ({PROFIEL.rol}) toont het dashboard actuele
        kernindicatoren, aanbevolen opdrachten en recente activiteit. Het vertrouwensniveau is{" "}
        <Badge tone="green" mono>
          hoog
        </Badge>
        .
      </Prose>
      <Callout kind="info" title="Server-side waarheid">
        Statussen zoals verificatie, verloopdatum en toegang worden nooit in de browser bepaald. De
        client toont wat de server teruggeeft.
      </Callout>

      <AnchorHeading id="kpi" onAnchor={onAnchor}>
        Kernindicatoren
      </AnchorHeading>
      <Prose>
        Elke indicator bevat een waarde en een trend ten opzichte van de vorige periode.
      </Prose>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="rounded-lg p-4"
            style={{ background: C.panel, border: `1px solid ${C.line}` }}
          >
            <div className="flex items-center justify-between">
              <code className="text-[11px]" style={{ color: C.muted, ...mono }}>
                {k.label}
              </code>
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums"
                style={{ color: k.up ? C.green : C.amber, ...mono }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <p className="mt-2 text-[24px] font-semibold tabular-nums tracking-tight">{k.value}</p>
          </div>
        ))}
      </div>

      <AnchorHeading id="matches" onAnchor={onAnchor}>
        Aanbevolen matches
      </AnchorHeading>
      <Prose>
        Opdrachten worden verklaarbaar gesorteerd op relevantie. Klik een rij om de volledige
        opdracht-resource te openen.
      </Prose>
      <div className="mt-5 overflow-hidden rounded-lg" style={{ border: `1px solid ${C.line}` }}>
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[11px] uppercase tracking-[0.08em]"
              style={{ background: C.panelAlt, color: C.muted, ...mono }}
            >
              <th className="px-4 py-2.5 font-medium">Match</th>
              <th className="px-4 py-2.5 font-medium">Opdracht</th>
              <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Tarief</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {OPDRACHTEN.map((o, i) => (
              <tr
                key={o.id}
                className="cursor-pointer transition-colors hover:bg-[#f6f7f9]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                onClick={() => onOpen(o.id)}
              >
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="text-[13px] font-semibold tabular-nums"
                      style={{ color: o.match >= 90 ? C.green : C.amber, ...mono }}
                    >
                      {o.match}%
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-[13px] font-medium">{o.titel}</p>
                  <p className="text-[11.5px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats}
                  </p>
                </td>
                <td
                  className="hidden px-4 py-3 text-[12.5px] tabular-nums sm:table-cell"
                  style={{ color: C.inkSoft, ...mono }}
                >
                  {o.tarief}
                </td>
                <td className="px-4 py-3 text-right">
                  <ChevronRight size={15} aria-hidden="true" style={{ color: C.faint }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnchorHeading id="activiteit" onAnchor={onAnchor}>
        Recente activiteit
      </AnchorHeading>
      <Prose>Berichten en meldingen uit je gesprekken, nieuwste eerst.</Prose>
      <ul className="mt-5 space-y-2">
        {BERICHTEN.map((b) => (
          <li
            key={b.van}
            className="flex items-center gap-3 rounded-lg p-3"
            style={{ background: C.panel, border: `1px solid ${C.line}` }}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
              style={{
                background: b.ongelezen ? C.indigoSoft : C.panelAlt,
                color: b.ongelezen ? C.indigo : C.muted,
                ...mono,
              }}
            >
              {b.initialen}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[13px] font-medium">{b.van}</p>
                {b.ongelezen && <Badge tone="indigo">nieuw</Badge>}
              </div>
              <p className="truncate text-[12px]" style={{ color: C.muted }}>
                {b.preview}
              </p>
            </div>
            <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
              {b.tijd}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

/* ---------- Marktplaats-doc ---------- */

function MarktplaatsDoc({
  onAnchor,
  onOpen,
}: {
  onAnchor: (id: string) => void;
  onOpen: (id?: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () =>
      OPDRACHTEN.filter(
        (o) =>
          o.titel.toLowerCase().includes(q.toLowerCase()) ||
          o.plaats.toLowerCase().includes(q.toLowerCase()) ||
          o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
      ),
    [q],
  );

  return (
    <article>
      <span
        className="text-[12px] font-medium uppercase tracking-[0.12em]"
        style={{ color: C.indigo, ...mono }}
      >
        Marktplaats
      </span>
      <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-tight">Marktplaats</h1>
      <Lede>
        De marktplaats bevat alle open opdrachten die bij je profiel passen. Elke opdracht heeft een
        match-percentage dat verklaarbaar is opgebouwd uit je geverifieerde certificaten,
        beschikbaarheid en voorkeuren.
      </Lede>

      <AnchorHeading id="introductie" onAnchor={onAnchor}>
        Introductie
      </AnchorHeading>
      <Prose>
        Opdrachten worden gesorteerd op relevantie. Een hoger percentage betekent een betere
        aansluiting; de onderbouwing vind je in de opdracht-resource onder{" "}
        <em>Match-onderbouwing</em>.
      </Prose>

      <AnchorHeading id="zoeken" onAnchor={onAnchor}>
        Zoeken &amp; filteren
      </AnchorHeading>
      <Prose>
        Filter de lijst op titel, plaats of opdrachtgever. Het filter werkt hoofdletterongevoelig.
      </Prose>
      <label className="relative mt-5 block">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: C.faint }}
          aria-hidden="true"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full rounded-lg py-2.5 pl-9 pr-16 text-[13px] outline-none transition-colors focus:border-[#635bff]"
          style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.ink }}
        />
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] tabular-nums"
          style={{ color: C.faint, ...mono }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </label>

      <AnchorHeading id="opdrachten" onAnchor={onAnchor}>
        Opdrachtenlijst
      </AnchorHeading>
      {filtered.length === 0 ? (
        <div
          className="mt-5 rounded-lg px-6 py-12 text-center"
          style={{ background: C.panelAlt, border: `1px dashed ${C.line}` }}
        >
          <Search size={22} className="mx-auto" style={{ color: C.faint }} aria-hidden="true" />
          <p className="mt-3 text-[14px] font-semibold">Geen resultaten</p>
          <p className="mx-auto mt-1 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Er zijn geen opdrachten voor &quot;{q}&quot;. Pas je zoekopdracht aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-4 rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635bff]"
            style={{ background: C.indigo, color: "#fff" }}
          >
            Filter wissen
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={() => onOpen(o.id)}
              className="group block w-full rounded-lg p-4 text-left transition-colors hover:border-[#635bff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635bff]"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-[11px]" style={{ color: C.faint, ...mono }}>
                      {o.id}
                    </code>
                    <Badge tone={o.match >= 90 ? "green" : "amber"} mono>
                      match {o.match}%
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-[15px] font-semibold leading-snug transition-colors group-hover:text-[#635bff]">
                    {o.titel}
                  </p>
                  <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats}
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  className="mt-1 shrink-0"
                  style={{ color: C.faint }}
                  aria-hidden="true"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded px-1.5 py-0.5 text-[10.5px]"
                    style={{
                      background: C.panelAlt,
                      border: `1px solid ${C.line}`,
                      color: C.inkSoft,
                      ...mono,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-3 flex items-center gap-4 border-t pt-3 text-[12px] tabular-nums"
                style={{ borderColor: C.lineSoft, ...mono }}
              >
                <span style={{ color: C.green }}>{o.tarief}</span>
                <span style={{ color: C.muted }}>{o.uren}</span>
                <span style={{ color: C.muted }}>{o.start}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <AnchorHeading id="matchlogica" onAnchor={onAnchor}>
        Match-logica
      </AnchorHeading>
      <Prose>
        Het match-percentage is opgebouwd uit gewogen factoren. Een voorbeeld van de terugkerende
        factoren:
      </Prose>
      <DefList
        items={[
          {
            term: "certificaten",
            type: "gewicht 40%",
            desc: "Geverifieerde diploma's en registraties die de opdracht vereist.",
            tone: "green",
          },
          {
            term: "reistijd",
            type: "gewicht 25%",
            desc: "Geschatte reistijd tussen je woonplaats en de opdrachtlocatie.",
          },
          {
            term: "beschikbaarheid",
            type: "gewicht 20%",
            desc: "Aansluiting op je opgegeven dagen en uren.",
          },
          {
            term: "tarief",
            type: "gewicht 15%",
            desc: "Ligt het geboden tarief op of boven je ondergrens.",
            tone: "indigo",
          },
        ]}
      />
    </article>
  );
}

/* ---------- Opdracht-doc (resource-referentie) ---------- */

function OpdrachtDoc({
  opdracht,
  onAnchor,
}: {
  opdracht: Opdracht;
  onAnchor: (id: string) => void;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 900);
  };

  return (
    <article>
      <span
        className="text-[12px] font-medium uppercase tracking-[0.12em]"
        style={{ color: C.indigo, ...mono }}
      >
        Kernmodules · Opdracht
      </span>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-[30px] font-semibold leading-tight tracking-tight">{opdracht.titel}</h1>
        <Badge tone={opdracht.match >= 90 ? "green" : "amber"} mono>
          match {opdracht.match}%
        </Badge>
      </div>
      <Lede>
        Een <code style={{ ...mono, color: C.indigo }}>Opdracht</code> beschrijft een concrete
        inzet: de opdrachtgever, locatie, omvang, tarief en de vereiste certificaten. Hieronder de
        volledige resource.
      </Lede>

      <AnchorHeading id="resource" onAnchor={onAnchor}>
        De opdracht-resource
      </AnchorHeading>
      <Prose>
        Elke opdracht heeft een unieke identifier. Deze resource is alleen-lezen; je reageert erop
        via de actie onderaan.
      </Prose>
      <Annotation
        lines={[
          { k: "id", v: opdracht.id },
          { k: "opdrachtgever", v: opdracht.opdrachtgever },
          { k: "plaats", v: opdracht.plaats },
          { k: "tarief", v: opdracht.tarief.trim() },
          { k: "uren", v: opdracht.uren, comment: "omvang per week" },
          { k: "start", v: opdracht.start },
        ]}
      />

      <AnchorHeading id="eigenschappen" onAnchor={onAnchor}>
        Eigenschappen
      </AnchorHeading>
      <DefList
        items={[
          {
            term: "opdrachtgever",
            type: "string",
            desc: `De organisatie: ${opdracht.opdrachtgever}.`,
          },
          {
            term: "plaats",
            type: "string",
            desc: `Standplaats van de opdracht: ${opdracht.plaats}.`,
          },
          {
            term: "tarief",
            type: "currency / uur",
            desc: `Het geboden uurtarief: ${opdracht.tarief}.`,
            tone: "green",
          },
          { term: "uren", type: "string", desc: `Verwachte omvang: ${opdracht.uren}.` },
          { term: "start", type: "date-hint", desc: `Gewenste startdatum: ${opdracht.start}.` },
          {
            term: "tags",
            type: "string[]",
            desc: `Kenmerken: ${opdracht.tags.join(", ")}.`,
            tone: "indigo",
          },
        ]}
      />

      <AnchorHeading id="redenen" onAnchor={onAnchor}>
        Match-onderbouwing
      </AnchorHeading>
      <Prose>
        De score wordt transparant onderbouwd. Pluspunten verhogen de match, aandachtspunten
        verlagen hem.
      </Prose>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div
          className="rounded-lg p-4"
          style={{ background: C.greenSoft, border: `1px solid ${TONE.green.line}` }}
        >
          <p
            className="text-[12px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: C.green }}
          >
            Pluspunten
          </p>
          <ul className="mt-3 space-y-2">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ color: C.inkSoft }}
              >
                <Check
                  size={15}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div
          className="rounded-lg p-4"
          style={{ background: C.amberSoft, border: `1px solid ${TONE.amber.line}` }}
        >
          <p
            className="text-[12px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: C.amber }}
          >
            Aandachtspunten
          </p>
          <ul className="mt-3 space-y-2">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ color: C.inkSoft }}
              >
                <AlertTriangle
                  size={14}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.amber }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <AnchorHeading id="reageren" onAnchor={onAnchor}>
        Reageren
      </AnchorHeading>
      <Prose>
        Een reactie stuurt je geverifieerde profiel naar de opdrachtgever. Dit is de enige
        schrijfactie op deze pagina.
      </Prose>
      <Callout kind="waarschuwing" title="Controleer je certificaten">
        Zorg dat de vereiste certificaten geverifieerd zijn voordat je reageert. Een verlopen
        certificaat kan tot afwijzing leiden.
      </Callout>
      <button
        onClick={react}
        disabled={state !== "idle"}
        aria-live="polite"
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635bff] disabled:opacity-90"
        style={{ background: state === "sent" ? C.green : C.indigo, color: "#fff" }}
      >
        {state === "sending" && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
        {state === "sent" && <Check size={15} aria-hidden="true" />}
        {state === "idle" && <Send size={14} aria-hidden="true" />}
        {state === "idle"
          ? "Reageer op opdracht"
          : state === "sending"
            ? "Versturen…"
            : "Reactie verstuurd"}
      </button>
    </article>
  );
}

/* ---------- Verificatie-doc ---------- */

function VerificatieDoc({ onAnchor }: { onAnchor: (id: string) => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const statuses: CredStatus[] = ["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"];

  return (
    <article>
      <span
        className="text-[12px] font-medium uppercase tracking-[0.12em]"
        style={{ color: C.indigo, ...mono }}
      >
        Kernmodules · Verificatie
      </span>
      <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-tight">Verificatie</h1>
      <Lede>
        Verificatie is de kern van vertrouwen op het platform. Elk certificaat doorloopt een
        expliciete statusovergang en wordt onafhankelijk gecontroleerd. Op dit moment zijn{" "}
        <strong>{verified}</strong> van <strong>{total}</strong> certificaten geverifieerd.
      </Lede>

      <AnchorHeading id="statussen" onAnchor={onAnchor}>
        Statuswaarden
      </AnchorHeading>
      <Prose>
        Een certificaat heeft altijd precies één status. De volgende waarden zijn mogelijk:
      </Prose>
      <div className="mt-5 overflow-hidden rounded-lg" style={{ border: `1px solid ${C.line}` }}>
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[11px] uppercase tracking-[0.08em]"
              style={{ background: C.panelAlt, color: C.muted, ...mono }}
            >
              <th className="px-4 py-2.5 font-medium">Waarde</th>
              <th className="px-4 py-2.5 font-medium">Label</th>
              <th className="px-4 py-2.5 font-medium">Betekenis</th>
            </tr>
          </thead>
          <tbody>
            {statuses.map((s, i) => {
              const m = statusMeta(s);
              const uitleg: Record<CredStatus, string> = {
                VERIFIED: "Onafhankelijk gecontroleerd en geldig.",
                SUBMITTED: "Ingediend en in behandeling bij een beoordelaar.",
                EXPIRING: "Nog geldig, maar verloopt binnenkort.",
                REJECTED: "Afgewezen; een reden is verplicht vastgelegd.",
              };
              return (
                <tr key={s} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <td className="px-4 py-3">
                    <code
                      className="text-[12px] font-medium"
                      style={{ color: m.tone === "green" ? C.green : C.ink, ...mono }}
                    >
                      {m.code}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={m.tone}>
                      <m.Icon size={11} aria-hidden="true" /> {m.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[13px]" style={{ color: C.inkSoft }}>
                    {uitleg[s]}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Callout kind="info" title="Geldige overgangen">
        Statusovergangen verlopen via een expliciete map. Een sprong van{" "}
        <code style={mono}>DRAFT</code> naar <code style={mono}>VERIFIED</code> wordt geweigerd;
        alleen een <code style={mono}>VERIFIED</code>-certificaat kan verlopen.
      </Callout>

      <AnchorHeading id="certificaten" onAnchor={onAnchor}>
        Certificaten
      </AnchorHeading>
      <Prose>Je huidige certificaten met hun actuele status en detail.</Prose>
      <div
        className="mt-5 divide-y overflow-hidden rounded-lg"
        style={{ borderColor: C.lineSoft, border: `1px solid ${C.line}` }}
      >
        {CREDENTIALS.map((c) => {
          const m = statusMeta(c.status);
          return (
            <div
              key={c.naam}
              className="flex items-center gap-4 px-4 py-3.5"
              style={{ borderTop: `1px solid ${C.lineSoft}` }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: TONE[m.tone].bg, border: `1px solid ${TONE[m.tone].line}` }}
              >
                {c.status === "SUBMITTED" ? (
                  <Loader2
                    size={16}
                    className="motion-safe:animate-spin"
                    style={{ color: TONE[m.tone].fg }}
                    aria-hidden="true"
                  />
                ) : (
                  <m.Icon size={16} style={{ color: TONE[m.tone].fg }} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium">{c.naam}</p>
                <p className="text-[12px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <Badge tone={m.tone}>{m.label}</Badge>
            </div>
          );
        })}
      </div>

      <AnchorHeading id="documenten" onAnchor={onAnchor}>
        Documenten
      </AnchorHeading>
      <Prose>
        Documenten zijn standaard privé en worden gevalideerd op type en grootte bij het uploaden.
      </Prose>
      <div className="mt-5 overflow-hidden rounded-lg" style={{ border: `1px solid ${C.line}` }}>
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[11px] uppercase tracking-[0.08em]"
              style={{ background: C.panelAlt, color: C.muted, ...mono }}
            >
              <th className="px-4 py-2.5 font-medium">Bestand</th>
              <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Type</th>
              <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Grootte</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {DOCUMENTEN.map((d, i) => {
              const m = statusMeta(d.status);
              return (
                <tr
                  key={d.naam}
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <FileText size={14} style={{ color: C.faint }} aria-hidden="true" />
                      <code className="text-[12.5px]" style={{ color: C.ink, ...mono }}>
                        {d.naam}
                      </code>
                    </span>
                  </td>
                  <td
                    className="hidden px-4 py-3 text-[12px] sm:table-cell"
                    style={{ color: C.muted, ...mono }}
                  >
                    {d.type}
                  </td>
                  <td
                    className="hidden px-4 py-3 text-[12px] tabular-nums sm:table-cell"
                    style={{ color: C.muted, ...mono }}
                  >
                    {d.grootte}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={m.tone}>{m.label}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}

/* ---------- Acties-doc ---------- */

function ActiesDoc({ onAnchor }: { onAnchor: (id: string) => void }) {
  const kind: Record<"warning" | "info", { c: "waarschuwing" | "info"; label: string }> = {
    warning: { c: "waarschuwing", label: "Urgent" },
    info: { c: "info", label: "Ter info" },
  };
  return (
    <article>
      <span
        className="text-[12px] font-medium uppercase tracking-[0.12em]"
        style={{ color: C.indigo, ...mono }}
      >
        Beheer · Acties
      </span>
      <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-tight">Acties</h1>
      <Lede>
        De actie-engine bepaalt server-side wat nu telt en zet dit op volgorde van urgentie. Je
        hoeft niets zelf te bewaken; nieuwe acties verschijnen automatisch zodra ze relevant worden.
      </Lede>

      <AnchorHeading id="introductie" onAnchor={onAnchor}>
        Introductie
      </AnchorHeading>
      <Prose>
        Elke actie bevat een titel, een toelichting en een aanbevolen vervolgstap. De urgentie is
        een van <code style={mono}>warning</code> of <code style={mono}>info</code>.
      </Prose>

      <AnchorHeading id="openstaand" onAnchor={onAnchor}>
        Openstaande acties
      </AnchorHeading>
      <ol className="mt-5 space-y-3">
        {ACTIES.map((a, i) => {
          const k = kind[a.urgentie];
          const tone: Tone = a.urgentie === "warning" ? "amber" : "indigo";
          return (
            <li
              key={a.titel}
              className="flex items-start gap-4 rounded-lg p-4"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums"
                style={{
                  background: C.panelAlt,
                  border: `1px solid ${C.line}`,
                  color: C.muted,
                  ...mono,
                }}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <Badge tone={tone}>{k.label}</Badge>
                <p className="mt-1.5 text-[14px] font-semibold">{a.titel}</p>
                <p className="mt-0.5 text-[13px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 self-center rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635bff]"
                style={{
                  color: TONE[tone].fg,
                  background: TONE[tone].bg,
                  border: `1px solid ${TONE[tone].line}`,
                }}
              >
                {a.cta}
              </button>
            </li>
          );
        })}
      </ol>
      <Callout kind="info" title="Alles bekeken?">
        Wanneer er geen openstaande acties zijn, blijft deze lijst leeg. Dat is precies de bedoeling
        — geen ruis, alleen wat aandacht vraagt.
      </Callout>
    </article>
  );
}

/* ---------- Facturen-doc ---------- */

function FacturenDoc({ onAnchor }: { onAnchor: (id: string) => void }) {
  const statusTone: Record<string, Tone> = {
    Betaald: "green",
    Openstaand: "amber",
    Concept: "muted",
  };
  const totaalOpen = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const totaalBetaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );

  return (
    <article>
      <span
        className="text-[12px] font-medium uppercase tracking-[0.12em]"
        style={{ color: C.indigo, ...mono }}
      >
        Beheer · Facturen
      </span>
      <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-tight">Facturen</h1>
      <Lede>
        Een overzicht van je facturen met hun status. Bedragen zijn inclusief btw en worden
        server-side berekend.
      </Lede>

      <AnchorHeading id="overzicht" onAnchor={onAnchor}>
        Overzicht
      </AnchorHeading>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div
          className="rounded-lg p-4"
          style={{ background: C.greenSoft, border: `1px solid ${TONE.green.line}` }}
        >
          <p
            className="text-[11px] font-medium uppercase tracking-[0.1em]"
            style={{ color: C.green, ...mono }}
          >
            Ontvangen
          </p>
          <p className="mt-1.5 text-[22px] font-semibold tabular-nums" style={{ color: C.green }}>
            € {totaalBetaald.toLocaleString("nl-NL")}
          </p>
        </div>
        <div
          className="rounded-lg p-4"
          style={{ background: C.amberSoft, border: `1px solid ${TONE.amber.line}` }}
        >
          <p
            className="text-[11px] font-medium uppercase tracking-[0.1em]"
            style={{ color: C.amber, ...mono }}
          >
            Openstaand
          </p>
          <p className="mt-1.5 text-[22px] font-semibold tabular-nums" style={{ color: C.amber }}>
            € {totaalOpen.toLocaleString("nl-NL")}
          </p>
        </div>
      </div>

      <AnchorHeading id="tabel" onAnchor={onAnchor}>
        Facturentabel
      </AnchorHeading>
      <Prose>
        Alle facturen, nieuwste eerst. Klik op een kolomkop-conventie is niet nodig; de lijst is al
        gesorteerd.
      </Prose>
      <div className="mt-5 overflow-hidden rounded-lg" style={{ border: `1px solid ${C.line}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[11px] uppercase tracking-[0.08em]"
                style={{ background: C.panelAlt, color: C.muted, ...mono }}
              >
                <th className="px-4 py-2.5 font-medium">Nummer</th>
                <th className="px-4 py-2.5 font-medium">Klant</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Datum</th>
                <th className="px-4 py-2.5 text-right font-medium">Bedrag</th>
                <th className="px-4 py-2.5 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const tone = statusTone[f.status] ?? "muted";
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#f6f7f9]"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-4 py-3 text-[12.5px] tabular-nums"
                      style={{ color: C.inkSoft, ...mono }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-medium">{f.klant}</td>
                    <td
                      className="hidden px-4 py-3 text-[12.5px] tabular-nums sm:table-cell"
                      style={{ color: C.muted, ...mono }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[13px] font-semibold tabular-nums"
                      style={mono}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge tone={tone}>{f.status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnchorHeading id="statussen" onAnchor={onAnchor}>
        Statuswaarden
      </AnchorHeading>
      <DefList
        items={[
          {
            term: "Betaald",
            type: "afgerond",
            desc: "De factuur is volledig voldaan.",
            tone: "green",
          },
          {
            term: "Openstaand",
            type: "wacht op betaling",
            desc: "Verstuurd, nog niet voldaan. Een herinnering is mogelijk.",
            tone: "amber",
          },
          {
            term: "Concept",
            type: "nog niet verstuurd",
            desc: "Een opgeslagen concept dat je nog kunt bewerken.",
            tone: "muted",
          },
        ]}
      />
    </article>
  );
}
