"use client";

// Concept 368 — "Draaiboek" · Productie-callsheet / storyboard (film & theater).
// Een strak draaiboek: scène-genummerde secties, een cue-lijst met tijdkolommen, regie-aanwijzingen
// in de kantlijn (kleine mono-notities) en storyboard-frames met hoek-crop-markeringen. Koel
// productie-papier (#f4f4f2) met inkt (#1a1a1c), clapperboard-strepen als motief en markeer-geel
// (#f5c518) + regie-rood (#d3352b) als accenten. Fonts: Space Mono (cues/tijden), Bricolage (koppen).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  Clapperboard,
  Film,
  MapPin,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: productie-papier met inkt, geel markeer + regie-rood —
const C = {
  paper: "#f4f4f2",
  card: "#fbfbfa",
  ink: "#1a1a1c",
  inkSoft: "#3a3a3d",
  muted: "#6c6c70",
  faint: "#9a9a9d",
  line: "rgba(26,26,28,0.16)",
  lineSoft: "rgba(26,26,28,0.08)",
  marker: "#f5c518",
  red: "#d3352b",
  redSoft: "#f6ddda",
};

const head = { fontFamily: "var(--font-lab-bricolage), system-ui, sans-serif" };
const body = { fontFamily: "var(--font-lab-geist), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-space-mono), ui-monospace, monospace" };

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; alarm: boolean } {
  switch (s) {
    case "VERIFIED":
      return { label: "In beeld", Icon: Check, alarm: false };
    case "SUBMITTED":
      return { label: "In montage", Icon: Clock, alarm: false };
    case "EXPIRING":
      return { label: "Verloopt — cue", Icon: AlertTriangle, alarm: true };
    case "REJECTED":
      return { label: "Cut — afgewezen", Icon: AlertTriangle, alarm: true };
  }
}

// — Clapperboard-strepenband: schuine zwart/wit stroken als productie-motief —
function ClapStripe({ height = 10 }: { height?: number }) {
  return (
    <div
      className="w-full"
      aria-hidden="true"
      style={{
        height,
        backgroundImage: `repeating-linear-gradient(-63deg, ${C.ink} 0 12px, ${C.paper} 12px 24px)`,
      }}
    />
  );
}

// — Storyboard-frame: rechthoekig kader met hoek-crop-markeringen zoals een filmframe —
function Frame({
  children,
  label,
  className = "",
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  const corner = "absolute h-3 w-3 border-[color:var(--fr)] " as const;
  return (
    <div className={`relative ${className}`} style={{ ["--fr" as string]: C.ink }}>
      <span className={`${corner} left-0 top-0 border-l border-t`} aria-hidden="true" />
      <span className={`${corner} right-0 top-0 border-r border-t`} aria-hidden="true" />
      <span className={`${corner} bottom-0 left-0 border-b border-l`} aria-hidden="true" />
      <span className={`${corner} bottom-0 right-0 border-b border-r`} aria-hidden="true" />
      {label && (
        <span
          className="absolute -top-2.5 left-4 px-1.5 text-[10px] uppercase tracking-[0.2em]"
          style={{ background: C.paper, color: C.faint, ...mono }}
        >
          {label}
        </span>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

// — Regie-notitie in de kantlijn —
function Cue({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] leading-relaxed" style={{ color: C.muted, ...mono }}>
      <span style={{ color: C.red }}>▸ </span>
      {children}
    </p>
  );
}

function Scene({ nr, titel }: { nr: number; titel: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] uppercase tracking-[0.14em]"
        style={{ background: C.ink, color: C.marker, ...mono }}
      >
        SCÈNE {String(nr).padStart(2, "0")}
      </span>
      <span className="text-[11px] uppercase tracking-[0.24em]" style={{ color: C.faint, ...mono }}>
        {titel}
      </span>
      <span className="h-px flex-1" style={{ background: C.line }} aria-hidden="true" />
    </div>
  );
}

function Tag({ children, alarm }: { children: React.ReactNode; alarm?: boolean }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10.5px] uppercase tracking-[0.1em]"
      style={{
        color: alarm ? C.red : C.inkSoft,
        border: `1px solid ${alarm ? C.red : C.line}`,
        ...mono,
      }}
    >
      {children}
    </span>
  );
}

function Spark({ data, alarm }: { data: number[]; alarm?: boolean }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const w = 132;
  const h = 34;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={alarm ? C.red : C.ink}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Concept368() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ ...body, background: C.paper, color: C.ink }}
    >
      <ClapStripe />
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pb-20 pt-8">
          {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties />}
          {screen === "facturen" && <Facturen />}
        </main>
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <header
      className="flex items-center justify-between border-b py-6"
      style={{ borderColor: C.ink }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center"
          style={{ background: C.ink }}
          aria-hidden="true"
        >
          <Clapperboard size={20} color={C.marker} />
        </span>
        <div>
          <p className="text-[20px] font-semibold leading-none tracking-[-0.01em]" style={head}>
            Draaiboek
          </p>
          <p
            className="mt-1.5 text-[10.5px] uppercase leading-none tracking-[0.26em]"
            style={{ color: C.faint, ...mono }}
          >
            Productie · call-sheet
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span
          className="hidden items-center gap-1.5 px-2 py-1 text-[10.5px] uppercase tracking-[0.12em] sm:inline-flex"
          style={{ color: C.ink, border: `1px solid ${C.line}`, ...mono }}
        >
          <Film size={12} aria-hidden="true" style={{ color: C.red }} />
          {PROFIEL.trust}
        </span>
        <span
          className="flex h-9 w-9 items-center justify-center text-[12px] font-medium"
          style={{ border: `1px solid ${C.ink}`, color: C.ink, ...mono }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav
      className="flex items-center gap-0 overflow-x-auto border-b"
      style={{ borderColor: C.line }}
      aria-label="Hoofdnavigatie"
    >
      {SCREENS.map((s, i) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="relative shrink-0 px-4 py-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: on ? C.ink : C.muted, ...head }}
          >
            <span
              className="mr-2 text-[10px] tabular-nums"
              style={{ color: on ? C.red : C.faint, ...mono }}
            >
              SC{String(i + 1).padStart(2, "0")}
            </span>
            {s.label}
            {on && (
              <span
                className="absolute inset-x-3 -bottom-px h-[3px]"
                style={{ background: C.marker }}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="space-y-12">
      <section className="grid grid-cols-1 gap-8 md:grid-cols-[1.5fr_1fr]">
        <div>
          <Scene nr={1} titel="Dashboard" />
          <h1
            className="mt-5 text-[38px] font-semibold leading-[1.02] tracking-[-0.02em] md:text-[50px]"
            style={head}
          >
            Goedemorgen,
            <br />
            {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed" style={{ color: C.muted }}>
            De opnamedag is geblokt. Eén cue opent de scène — de rest volgt het draaiboek in
            volgorde.
          </p>
          <div className="mt-6 space-y-1.5">
            <Cue>Regie: begin met de openingscue voordat de rest inzet.</Cue>
            <Cue>Locatie: {PROFIEL.plaats} · dag 12 van de productie.</Cue>
          </div>
        </div>

        <Frame label="Opnameklaar" className="self-start">
          <div className="flex flex-col justify-between" style={{ background: C.ink }}>
            <div className="p-5" style={{ color: C.paper }}>
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]"
                style={{ background: C.marker, color: C.ink, ...mono }}
              >
                Cue 01 · nu draaien
              </span>
              <h2 className="mt-4 text-[19px] font-semibold leading-snug" style={head}>
                {primair.titel}
              </h2>
              <p
                className="mt-2 text-[13px] leading-relaxed"
                style={{ color: "rgba(244,244,242,0.72)" }}
              >
                {primair.detail}
              </p>
              <button
                onClick={onOpen}
                className="group mt-5 inline-flex w-full items-center justify-between gap-2 px-4 py-3 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1c]"
                style={{ background: C.marker, color: C.ink, ...head }}
              >
                {primair.cta}
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </button>
            </div>
          </div>
        </Frame>
      </section>

      <section>
        <Scene nr={2} titel="Dagcijfers" />
        <div
          className="mt-5 grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4"
          style={{ background: C.line }}
        >
          {KPIS.map((k) => (
            <div key={k.label} className="p-5" style={{ background: C.card }}>
              <div className="flex items-baseline justify-between">
                <p
                  className="text-[10.5px] uppercase tracking-[0.14em]"
                  style={{ color: C.muted, ...mono }}
                >
                  {k.label}
                </p>
                <span
                  className="text-[11px] font-medium tabular-nums"
                  style={{ color: k.up ? C.ink : C.red, ...mono }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-2 text-[29px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                style={head}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <Spark data={k.spark} alarm={!k.up} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <Scene nr={3} titel="Cue-lijst · opdrachten" />
        </div>
        <div className="mt-5">
          <div
            className="hidden grid-cols-[3.5rem_1fr_6rem_5rem] gap-4 border-b pb-2 sm:grid"
            style={{ borderColor: C.ink }}
          >
            {["Cue", "Scène / opdracht", "Tijd", "Match"].map((h, i) => (
              <span
                key={h}
                className={`text-[10px] uppercase tracking-[0.16em] ${i === 3 ? "text-right" : ""}`}
                style={{ color: C.faint, ...mono }}
              >
                {h}
              </span>
            ))}
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id}>
                <button
                  onClick={onOpen}
                  className="group grid w-full grid-cols-[3.5rem_1fr_auto] items-center gap-4 border-b py-4 text-left transition-colors hover:bg-[#ffffff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:grid-cols-[3.5rem_1fr_6rem_5rem]"
                  style={{ borderColor: C.lineSoft }}
                >
                  <span className="text-[12px] tabular-nums" style={{ color: C.red, ...mono }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15.5px] font-semibold" style={head}>
                      {o.titel}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[12.5px]"
                      style={{ color: C.muted }}
                    >
                      {o.opdrachtgever} · {o.plaats}
                    </span>
                  </span>
                  <span
                    className="hidden text-[12.5px] tabular-nums sm:block"
                    style={{ color: C.inkSoft, ...mono }}
                  >
                    {o.start}
                  </span>
                  <span className="flex items-center justify-end gap-2">
                    <MatchBadge value={o.match} />
                    <ArrowRight
                      size={15}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none sm:hidden"
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function MatchBadge({ value }: { value: number }) {
  const strong = value >= 90;
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 text-[12px] font-semibold tabular-nums"
      style={
        strong
          ? { background: C.marker, color: C.ink, ...mono }
          : { color: C.inkSoft, border: `1px solid ${C.line}`, ...mono }
      }
    >
      {value}%
    </span>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(needle) ||
        o.plaats.toLowerCase().includes(needle) ||
        o.opdrachtgever.toLowerCase().includes(needle),
    );
    return [...list].sort((a, b) =>
      sort === "match"
        ? b.match - a.match
        : parseInt(b.tarief.replace(/\D/g, ""), 10) - parseInt(a.tarief.replace(/\D/g, ""), 10),
    );
  }, [q, sort]);

  return (
    <div className="space-y-8">
      <div>
        <Scene nr={2} titel="Marktplaats" />
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-[32px] font-semibold leading-none tracking-[-0.02em]" style={head}>
            Locatie-scouting
          </h1>
          <span
            className="text-[11px] uppercase tracking-[0.14em]"
            style={{ color: C.faint, ...mono }}
          >
            {String(filtered.length).padStart(2, "0")} /{" "}
            {String(OPDRACHTEN.length).padStart(2, "0")} scènes
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 border px-3 py-2.5"
          style={{ borderColor: C.ink }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Scout op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#9a9a9d]"
            style={{ color: C.ink, ...body }}
          />
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className="px-3 py-2 text-[12px] font-medium uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  on
                    ? { background: C.ink, color: C.marker, ...mono }
                    : { color: C.muted, border: `1px solid ${C.line}`, ...mono }
                }
              >
                {s === "match" ? "Match" : "Gage"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Frame label="Lege set">
          <div className="flex flex-col items-center py-12 text-center">
            <Film size={36} aria-hidden="true" style={{ color: C.faint }} />
            <p className="mt-4 text-[22px] font-semibold" style={head}>
              Geen scène in beeld
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.muted }}>
              Geen opdracht past bij {q ? `“${q}”` : "je scout-term"}. Verruim de zoekterm om de
              cue-lijst weer te vullen.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.ink, color: C.marker, ...head }}
            >
              Scout opnieuw <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </Frame>
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <OpdrachtKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtKaart({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Frame label={`Frame ${String(index + 1).padStart(2, "0")}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold leading-snug" style={head}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-[12.5px]" style={{ color: C.muted }}>
            <MapPin size={12} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <MatchBadge value={opdracht.match} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-px" style={{ background: C.line }}>
        {[
          { l: "Gage", v: opdracht.tarief },
          { l: "Draaidagen", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
        ].map((m) => (
          <div key={m.l} className="p-2.5" style={{ background: C.card }}>
            <p
              className="text-[9.5px] uppercase tracking-[0.14em]"
              style={{ color: C.faint, ...mono }}
            >
              {m.l}
            </p>
            <p
              className="mt-1 text-[13px] font-semibold tabular-nums"
              style={{ color: C.ink, ...mono }}
            >
              {m.v}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {opdracht.tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.muted, ...mono }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Regie-notities
        </button>
        <button
          onClick={onOpen}
          className="ml-auto inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.red, ...head }}
        >
          Open scène <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-3 space-y-1.5 border-t pt-3" style={{ borderColor: C.lineSoft }}>
            {opdracht.redenen.plus.map((r) => (
              <Cue key={r}>{r}</Cue>
            ))}
            {opdracht.redenen.min.map((r) => (
              <p
                key={r}
                className="text-[11px] leading-relaxed"
                style={{ color: C.muted, ...mono }}
              >
                <span style={{ color: C.marker }}>! </span>
                {r}
              </p>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted, ...mono }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar cue-lijst
      </button>

      <header className="border-b pb-8" style={{ borderColor: C.ink }}>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="inline-flex items-center px-2 py-1 text-[11px] uppercase tracking-[0.14em]"
            style={{ background: C.ink, color: C.marker, ...mono }}
          >
            {opdracht.id}
          </span>
          <Tag>{opdracht.match}% match</Tag>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[36px] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[44px]"
          style={head}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-4 flex items-center gap-1.5 text-[15px]" style={{ color: C.muted }}>
          <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="inline-flex items-center gap-2 px-5 py-3 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.red, color: C.card, ...head }}
          >
            Reageer op scène <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button
            className="inline-flex items-center gap-2 px-5 py-3 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.ink, border: `1px solid ${C.ink}`, ...head }}
          >
            In draaiboek
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-px md:grid-cols-4" style={{ background: C.line }}>
        {[
          { l: "Gage", v: opdracht.tarief },
          { l: "Draaidagen", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div key={m.l} className="p-4" style={{ background: C.card }}>
            <p
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{ color: C.faint, ...mono }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[22px] font-semibold tabular-nums tracking-[-0.01em]"
              style={head}
            >
              {m.v}
            </p>
          </div>
        ))}
      </section>

      <section>
        <Scene nr={3} titel="Regie — waarom deze match" />
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
          Elke cue is onderbouwd op je geverifieerde profiel — de pluspunten én de aandacht, zonder
          verborgen score.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Frame label="In beeld">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px]"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.ink }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Frame>
          <Frame label="Aandacht">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px]"
                  style={{ color: C.muted }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.red }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Frame>
        </div>
      </section>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-8">
      <header className="border-b pb-8" style={{ borderColor: C.ink }}>
        <Scene nr={4} titel="Verificatie · rolbezetting" />
        <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-md">
            <h1 className="text-[32px] font-semibold leading-none tracking-[-0.02em]" style={head}>
              Cast & clearance
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed" style={{ color: C.muted }}>
              <span className="font-medium" style={{ color: C.ink }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten volledig in beeld. Eén vraagt
              binnenkort om een cue.
            </p>
          </div>
          <div className="flex items-end gap-4">
            <p
              className="text-[42px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
              style={head}
            >
              {ratio}
              <span className="text-[22px]" style={{ color: C.muted }}>
                %
              </span>
            </p>
            <div className="flex items-end gap-1.5 pb-1" aria-hidden="true">
              {CREDENTIALS.map((c) => (
                <span
                  key={c.naam}
                  className="w-2.5"
                  style={{
                    height: c.status === "VERIFIED" ? 40 : c.status === "EXPIRING" ? 22 : 30,
                    background:
                      c.status === "VERIFIED" ? C.ink : c.status === "EXPIRING" ? C.marker : C.line,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      <ul className="space-y-3">
        {CREDENTIALS.map((c, i) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Frame label={`Rol ${String(i + 1).padStart(2, "0")}`}>
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <st.Icon
                        size={15}
                        aria-hidden="true"
                        style={{ color: st.alarm ? C.red : C.ink }}
                      />
                      <span className="truncate text-[16px] font-semibold" style={head}>
                        {c.naam}
                      </span>
                    </span>
                    <span className="mt-1 block text-[12.5px]" style={{ color: C.muted }}>
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Tag alarm={st.alarm}>{st.label}</Tag>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{
                        color: C.muted,
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      }}
                      aria-hidden="true"
                    >
                      <Plus size={15} />
                    </span>
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="mt-3 border-t pt-3" style={{ borderColor: C.lineSoft }}>
                      <p
                        className="max-w-xl text-[13.5px] leading-relaxed"
                        style={{ color: C.inkSoft }}
                      >
                        {c.detail}. Documenten worden versleuteld bewaard en alleen na jouw
                        expliciete toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="px-3.5 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{ background: C.ink, color: C.marker, ...head }}
                        >
                          {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                        </button>
                        <button
                          className="px-3.5 py-2 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{ color: C.inkSoft, border: `1px solid ${C.line}`, ...mono }}
                        >
                          Logboek
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Frame>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-8">
      <header className="border-b pb-6" style={{ borderColor: C.ink }}>
        <Scene nr={5} titel="Cue-sheet · volgende acties" />
        <h1 className="mt-5 text-[32px] font-semibold leading-none tracking-[-0.02em]" style={head}>
          Draaischema
        </h1>
        <p className="mt-3 max-w-md text-[14.5px]" style={{ color: C.muted }}>
          Speel de cues op volgorde af — elke afgevinkte cue houdt de productie op schema.
        </p>
      </header>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <div
                className="grid grid-cols-1 items-center gap-4 border-l-[3px] p-5 sm:grid-cols-[auto_1fr_auto]"
                style={{ background: C.card, borderColor: warn ? C.red : C.ink }}
              >
                <span
                  className="flex h-12 w-12 items-center justify-center text-[15px] font-semibold tabular-nums"
                  style={
                    warn
                      ? { background: C.red, color: C.card, ...mono }
                      : { border: `1px solid ${C.ink}`, color: C.ink, ...mono }
                  }
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle size={15} aria-hidden="true" style={{ color: C.red }} />
                    ) : (
                      <Clock size={14} aria-hidden="true" style={{ color: C.ink }} />
                    )}
                    <h2 className="text-[17px] font-semibold leading-snug" style={head}>
                      {a.titel}
                    </h2>
                  </div>
                  <p
                    className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                    style={{ color: C.muted }}
                  >
                    {a.detail}
                  </p>
                </div>
                <button
                  className="justify-self-start px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:justify-self-end"
                  style={
                    warn
                      ? { background: C.red, color: C.card, ...head }
                      : { border: `1px solid ${C.ink}`, color: C.ink, ...head }
                  }
                >
                  {a.cta}
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurAlarm(status: string): boolean {
  return status === "Openstaand";
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-8">
      <header className="border-b pb-6" style={{ borderColor: C.ink }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Scene nr={6} titel="Facturen · nabetaling" />
            <h1
              className="mt-5 text-[32px] font-semibold leading-none tracking-[-0.02em]"
              style={head}
            >
              Gage-overzicht
            </h1>
          </div>
          <button
            className="inline-flex items-center gap-2 px-5 py-3 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.ink, color: C.marker, ...head }}
          >
            <Plus size={15} aria-hidden="true" /> Nieuwe factuur
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-px sm:grid-cols-3" style={{ background: C.line }}>
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false },
        ].map((s) => (
          <div key={s.l} className="p-5" style={{ background: C.card }}>
            <p
              className="text-[10.5px] uppercase tracking-[0.16em]"
              style={{ color: C.muted, ...mono }}
            >
              {s.l}
            </p>
            <p
              className="mt-2 text-[27px] font-semibold tabular-nums tracking-[-0.02em]"
              style={{ color: s.alarm ? C.red : C.ink, ...head }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </div>
        ))}
      </section>

      <div>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_7rem_6rem] gap-4 border-b pb-2 sm:grid"
          style={{ borderColor: C.ink }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[10px] uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint, ...mono }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const acc = factuurAlarm(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-b py-4 transition-colors hover:bg-[#ffffff] sm:grid-cols-[8rem_1fr_5rem_7rem_6rem] sm:gap-4"
                style={{ borderColor: C.lineSoft }}
              >
                <span
                  className="order-1 text-[12px] tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[15px] font-semibold sm:order-2"
                  style={head}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12.5px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <Tag alarm={acc}>{f.status}</Tag>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-semibold tabular-nums sm:order-5"
                  style={{ color: acc ? C.red : C.ink, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex items-baseline justify-between pt-5">
          <span
            className="text-[11px] uppercase tracking-[0.18em]"
            style={{ color: C.faint, ...mono }}
          >
            Totaal betaald
          </span>
          <span className="text-[24px] font-semibold tabular-nums" style={head}>
            {totaalBetaald}
          </span>
        </div>
      </div>
    </div>
  );
}
