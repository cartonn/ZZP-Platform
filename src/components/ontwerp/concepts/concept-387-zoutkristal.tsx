"use client";

// Concept 387 — "Zoutkristal" · Toegankelijk hoog-contrast met kristallijne geometrie.
// Bewijs dat WCAG-AAA mooi kan zijn: bijna-zwart op zuiver wit (≥ 7:1 op elk paar),
// royale leesbare typografie, dikke focusringen (3px), grote raakvlakken en één diep
// verzadigd accent (diepblauw). De vormtaal is kristallijn: hoekige facetten, ruiten en
// geslepen randen — nergens ronde vormen. Status wordt NOOIT op kleur alleen getoond:
// altijd label + icoon + facet-patroon. Zelfverzekerd, glashelder, inclusief.
// Palet: zuiver wit (#ffffff), bijna-zwart (#0a0a0a), diepblauw accent (#1636c7).
// Fonts: Manrope (koppen), Inter (body).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  XOctagon,
  Search,
  Plus,
  Minus,
  Gem,
  ShieldCheck,
  Bell,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: bijna-zwart op zuiver wit met één diepblauw accent (alle paren ≥ 7:1) —
const C = {
  white: "#ffffff",
  paper: "#f4f5f8",
  ink: "#0a0a0a",
  ink2: "#1c1d22", // ~15:1 op wit
  muted: "#3a3c44", // ~9.7:1 op wit — AAA-body
  faint: "#54565f", // ~7.1:1 op wit — AAA-grens, alleen labels
  blue: "#1636c7", // ~8.8:1 wit-op-blauw, ~7.0:1 blauw-op-wit
  blueDeep: "#0f238a",
  line: "#0a0a0a",
  lineSoft: "rgba(10,10,10,0.16)",
};

const head = { fontFamily: "var(--font-lab-manrope), system-ui, sans-serif" };
const body = { fontFamily: "var(--font-lab-inter), system-ui, sans-serif" };

// Dikke focusring — zelfde blauw, ruim contrast, overal identiek.
const RING =
  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#1636c7] focus-visible:ring-offset-2 focus-visible:ring-offset-white";

// — Status: label + icoon + facet-patroon (nooit kleur alleen) —
type Pattern = "solid" | "hatch" | "grid" | "cross";
function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  pattern: Pattern;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, alarm: false, pattern: "solid" };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, alarm: false, pattern: "hatch" };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, alarm: true, pattern: "grid" };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XOctagon, alarm: true, pattern: "cross" };
  }
}

function patternStyle(p: Pattern, tone: string): React.CSSProperties {
  switch (p) {
    case "hatch":
      return {
        backgroundImage: `repeating-linear-gradient(45deg, ${tone} 0 2px, transparent 2px 6px)`,
      };
    case "grid":
      return {
        backgroundImage: `repeating-linear-gradient(0deg, ${tone} 0 1.5px, transparent 1.5px 6px), repeating-linear-gradient(90deg, ${tone} 0 1.5px, transparent 1.5px 6px)`,
      };
    case "cross":
      return {
        backgroundImage: `repeating-linear-gradient(45deg, ${tone} 0 2px, transparent 2px 7px), repeating-linear-gradient(-45deg, ${tone} 0 2px, transparent 2px 7px)`,
      };
    default:
      return { background: tone };
  }
}

// — Kristal-facet: hoekig ruit-icoon opgebouwd uit geslepen vlakken —
function Facet({
  size = 40,
  tone = C.ink,
  glass = C.white,
}: {
  size?: number;
  tone?: string;
  glass?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <polygon
        points="20,2 34,14 20,38 6,14"
        fill={glass}
        stroke={tone}
        strokeWidth="2"
        strokeLinejoin="miter"
      />
      <line x1="20" y1="2" x2="20" y2="38" stroke={tone} strokeWidth="1.4" />
      <line x1="6" y1="14" x2="34" y2="14" stroke={tone} strokeWidth="1.4" />
      <line x1="6" y1="14" x2="20" y2="38" stroke={tone} strokeWidth="0.9" opacity="0.5" />
      <line x1="34" y1="14" x2="20" y2="38" stroke={tone} strokeWidth="0.9" opacity="0.5" />
    </svg>
  );
}

// — Kristallijne divider: rij van geslepen ruitjes —
function CrystalRule({ tone = C.line, count = 9 }: { tone?: string; count?: number }) {
  return (
    <svg
      width="100%"
      height="10"
      viewBox={`0 0 ${count * 16} 10`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="block"
    >
      <line x1="0" y1="5" x2={count * 16} y2="5" stroke={tone} strokeWidth="1" opacity="0.28" />
      {Array.from({ length: count }).map((_, i) => (
        <polygon
          key={i}
          points={`${i * 16 + 8},1 ${i * 16 + 13},5 ${i * 16 + 8},9 ${i * 16 + 3},5`}
          fill={i % 2 === 0 ? tone : "transparent"}
          stroke={tone}
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

// — Facet-sparkline: hoekige lijn met kristal-knooppunten —
function FacetLine({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 34;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 8) - 4;
    return { x, y };
  });
  const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="2"
        strokeLinejoin="miter"
        strokeLinecap="square"
      />
      {pts.map((p, i) => (
        <polygon
          key={i}
          points={`${p.x},${p.y - 3} ${p.x + 3},${p.y} ${p.x},${p.y + 3} ${p.x - 3},${p.y}`}
          fill={i === pts.length - 1 ? tone : C.white}
          stroke={tone}
          strokeWidth="1.4"
        />
      ))}
    </svg>
  );
}

function Overline({ children, tone = C.blue }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="text-[12px] font-bold uppercase tracking-[0.2em]"
      style={{ color: tone, ...body }}
    >
      {children}
    </p>
  );
}

// Facet-kaart: strakke rechte hoeken, dikke rand, geen ronde vormen.
function Card({
  children,
  className = "",
  accent = false,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative bg-white ${className}`}
      style={{
        border: `2px solid ${accent ? C.blue : C.line}`,
        boxShadow: `5px 5px 0 ${accent ? C.blue : C.ink}`,
      }}
    >
      <span
        className="pointer-events-none absolute right-0 top-0"
        aria-hidden="true"
        style={{
          width: 0,
          height: 0,
          borderTop: `14px solid ${accent ? C.blue : C.ink}`,
          borderLeft: "14px solid transparent",
        }}
      />
      {children}
    </div>
  );
}

function Chip({
  children,
  alarm,
  pattern = "solid",
}: {
  children: React.ReactNode;
  alarm?: boolean;
  pattern?: Pattern;
}) {
  const tone = alarm ? C.blue : C.ink;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.06em]"
      style={{ color: tone, border: `2px solid ${tone}`, ...body }}
    >
      <span
        className="inline-block h-2.5 w-2.5 shrink-0"
        aria-hidden="true"
        style={{ border: `1.5px solid ${tone}`, ...patternStyle(pattern, tone) }}
      />
      {children}
    </span>
  );
}

export function Concept387() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ ...body, color: C.ink, background: C.paper }}
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pb-24 pt-8">
          {screen === "dashboard" && (
            <Dashboard
              onOpen={() => setScreen("opdracht")}
              onActies={() => setScreen("acties")}
              onMarkt={() => setScreen("marktplaats")}
            />
          )}
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
    <header className="flex flex-wrap items-center justify-between gap-4 pt-7">
      <div className="flex items-center gap-3.5">
        <span className="shrink-0" aria-hidden="true">
          <Facet size={44} tone={C.ink} glass={C.white} />
        </span>
        <div>
          <p className="text-[24px] font-extrabold leading-none tracking-[-0.02em]" style={head}>
            Zoutkristal
          </p>
          <p
            className="mt-1.5 text-[12px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.faint }}
          >
            Helder & geverifieerd · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-2 px-3.5 py-2 text-[13px] font-bold sm:inline-flex"
          style={{ color: C.blue, border: `2px solid ${C.blue}` }}
        >
          <ShieldCheck size={16} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <div className="hidden text-right sm:block">
          <span className="block text-[14px] font-bold" style={{ color: C.ink }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[12px] font-medium" style={{ color: C.muted }}>
            {PROFIEL.rol}
          </span>
        </div>
        <span
          className="flex h-11 w-11 items-center justify-center text-[14px] font-extrabold"
          style={{ background: C.ink, color: C.white }}
          aria-label={`Profiel van ${PROFIEL.naam}`}
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
      className="mt-6 flex items-stretch gap-2 overflow-x-auto"
      aria-label="Hoofdnavigatie"
      style={{ borderBottom: `2px solid ${C.line}` }}
    >
      {SCREENS.map((s) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className={`relative shrink-0 px-4 py-3 text-[14px] font-bold transition-colors ${RING}`}
            style={{ color: on ? C.white : C.ink2, background: on ? C.ink : "transparent" }}
          >
            {s.label}
            {on && (
              <span
                className="absolute -bottom-[2px] left-1/2 -translate-x-1/2"
                aria-hidden="true"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "7px solid transparent",
                  borderRight: "7px solid transparent",
                  borderTop: `7px solid ${C.blue}`,
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function MatchBadge({ value, big = false }: { value: number; big?: boolean }) {
  const strong = value >= 90;
  return (
    <span className="inline-flex flex-col items-end" aria-label={`Match ${value} procent`}>
      <span
        className={`${big ? "text-[26px]" : "text-[18px]"} font-extrabold tabular-nums leading-none`}
        style={{ color: strong ? C.blue : C.ink, ...head }}
      >
        {value}%
      </span>
      <span className="mt-1.5 flex gap-[3px]" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < Math.round(value / 20);
          return (
            <span
              key={i}
              className="inline-block"
              style={{
                width: big ? 8 : 6,
                height: big ? 10 : 8,
                background: filled ? (strong ? C.blue : C.ink) : "transparent",
                border: `1.5px solid ${strong ? C.blue : C.ink}`,
                clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)",
              }}
            />
          );
        })}
      </span>
    </span>
  );
}

function Dashboard({
  onOpen,
  onActies,
  onMarkt,
}: {
  onOpen: () => void;
  onActies: () => void;
  onMarkt: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="space-y-12">
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.35fr_1fr]">
        <div className="self-center">
          <Overline>Vandaag · {PROFIEL.plaats}</Overline>
          <h1
            className="mt-4 text-[46px] font-extrabold leading-[0.98] tracking-[-0.03em] md:text-[60px]"
            style={head}
          >
            Goedemorgen,
            <br />
            {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p
            className="mt-5 max-w-lg text-[17px] font-medium leading-relaxed"
            style={{ color: C.muted }}
          >
            Alles helder en verifieerbaar. Eén ding vraagt vandaag je aandacht — de rest staat
            scherp.
          </p>
          <div className="mt-6 max-w-sm">
            <CrystalRule count={11} />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onActies}
              className={`group inline-flex items-center gap-2 px-6 py-3.5 text-[15px] font-bold transition-transform hover:-translate-y-0.5 motion-reduce:transform-none ${RING}`}
              style={{ background: C.ink, color: C.white }}
            >
              Volgende actie
              <ArrowRight
                size={17}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
              />
            </button>
            <button
              onClick={onMarkt}
              className={`inline-flex items-center gap-2 px-5 py-3.5 text-[15px] font-bold transition-transform hover:-translate-y-0.5 motion-reduce:transform-none ${RING}`}
              style={{ color: C.ink, border: `2px solid ${C.ink}`, background: C.white }}
            >
              <Bell size={16} aria-hidden="true" style={{ color: C.blue }} />
              {ongelezen} nieuwe berichten
            </button>
          </div>
        </div>

        <Card accent className="p-6">
          <div className="flex items-start justify-between gap-3">
            <Overline>Belangrijkste actie</Overline>
            <span aria-hidden="true">
              <Facet size={34} tone={C.blue} glass={C.white} />
            </span>
          </div>
          <h2
            className="mt-4 text-[26px] font-extrabold leading-tight tracking-[-0.02em]"
            style={head}
          >
            {primair.titel}
          </h2>
          <p className="mt-3 text-[15px] font-medium leading-relaxed" style={{ color: C.muted }}>
            {primair.detail}
          </p>
          <button
            onClick={onActies}
            className={`group mt-6 inline-flex items-center gap-2 px-6 py-3 text-[15px] font-bold transition-transform hover:-translate-y-0.5 motion-reduce:transform-none ${RING}`}
            style={{ background: C.blue, color: C.white }}
          >
            {primair.cta}
            <ArrowRight
              size={17}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
            />
          </button>
        </Card>
      </section>

      <section>
        <div
          className="mb-5 flex items-baseline justify-between border-b-2 pb-3"
          style={{ borderColor: C.line }}
        >
          <Overline tone={C.ink}>Kerncijfers · deze maand</Overline>
          <span
            className="text-[12px] font-bold uppercase tracking-[0.14em]"
            style={{ color: C.faint }}
          >
            Geverifieerd profiel
          </span>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Card key={k.label} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[13px] font-bold uppercase tracking-[0.08em]"
                  style={{ color: C.muted }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-1 text-[13px] font-extrabold tabular-nums"
                  style={{ color: k.up ? C.blue : C.ink }}
                >
                  <span aria-hidden="true">{k.up ? "▲" : "▼"}</span>
                  {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-3 text-[34px] font-extrabold tabular-nums leading-none tracking-[-0.03em]"
                style={head}
              >
                {k.value}
              </p>
              <div className="mt-4">
                <FacetLine data={k.spark} tone={k.up ? C.blue : C.ink} />
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div
          className="mb-5 flex items-baseline justify-between border-b-2 pb-3"
          style={{ borderColor: C.line }}
        >
          <Overline tone={C.ink}>Open opdrachten</Overline>
          <button
            onClick={onMarkt}
            className={`text-[13px] font-bold uppercase tracking-[0.1em] ${RING}`}
            style={{ color: C.blue }}
          >
            Alle bekijken
          </button>
        </div>
        <ul className="space-y-4">
          {OPDRACHTEN.map((o, i) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className={`group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 bg-white p-4 text-left transition-transform hover:-translate-y-0.5 motion-reduce:transform-none ${RING}`}
                style={{ border: `2px solid ${C.line}` }}
              >
                <span
                  className="flex h-11 w-11 items-center justify-center text-[15px] font-extrabold tabular-nums"
                  style={{ background: i === 0 ? C.blue : C.ink, color: C.white }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span
                    className="block truncate text-[18px] font-extrabold tracking-[-0.01em]"
                    style={head}
                  >
                    {o.titel}
                  </span>
                  <span
                    className="mt-0.5 block truncate text-[13.5px] font-medium"
                    style={{ color: C.muted }}
                  >
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </span>
                </span>
                <span className="flex items-center gap-4">
                  <MatchBadge value={o.match} />
                  <ArrowRight
                    size={18}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
                    style={{ color: C.ink }}
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
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
      <div className="border-b-2 pb-6" style={{ borderColor: C.line }}>
        <Overline>Marktplaats</Overline>
        <h1
          className="mt-3 text-[42px] font-extrabold leading-none tracking-[-0.03em]"
          style={head}
        >
          Open opdrachten
        </h1>
        <p className="mt-3 text-[15px] font-medium" style={{ color: C.muted }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten · gesorteerd op{" "}
          {sort === "match" ? "match" : "tarief"}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label
          className="flex flex-1 items-center gap-3 bg-white px-4 py-3"
          style={{ border: `2px solid ${C.ink}` }}
        >
          <Search size={18} aria-hidden="true" style={{ color: C.ink }} />
          <span className="sr-only">Opdrachten zoeken</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            className="w-full bg-transparent text-[15px] font-medium outline-none placeholder:text-[#54565f]"
            style={{ color: C.ink }}
          />
        </label>
        <div className="flex items-stretch gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className={`px-5 py-3 text-[14px] font-bold uppercase tracking-[0.06em] transition-colors ${RING}`}
                style={
                  on
                    ? { background: C.ink, color: C.white }
                    : { color: C.ink, border: `2px solid ${C.ink}`, background: C.white }
                }
              >
                {s === "match" ? "Match" : "Tarief"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-0">
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Gem size={48} aria-hidden="true" style={{ color: C.ink }} strokeWidth={1.5} />
            <p className="mt-5 text-[26px] font-extrabold tracking-[-0.02em]" style={head}>
              Geen opdracht gevonden
            </p>
            <p className="mx-auto mt-2 max-w-sm text-[15px] font-medium" style={{ color: C.muted }}>
              Geen resultaat voor {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm om alles weer
              te tonen.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-6 inline-flex items-center gap-2 px-6 py-3 text-[15px] font-bold ${RING}`}
              style={{ background: C.ink, color: C.white }}
            >
              Zoekterm wissen <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </Card>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <OpdrachtRij opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtRij({
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
    <Card className="p-5">
      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-4">
        <span
          className="mt-0.5 flex h-11 w-11 items-center justify-center text-[15px] font-extrabold tabular-nums"
          style={{ border: `2px solid ${C.ink}`, color: C.ink }}
          aria-hidden="true"
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <h3 className="text-[21px] font-extrabold leading-tight tracking-[-0.01em]" style={head}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[13.5px] font-semibold" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.04em]"
                style={{ color: C.ink2, border: `2px solid ${C.lineSoft}` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <MatchBadge value={opdracht.match} big />
          <span className="text-[15px] font-extrabold tabular-nums" style={{ color: C.ink }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div
        className="mt-4 flex flex-wrap items-center gap-4 border-t-2 pt-3"
        style={{ borderColor: C.lineSoft }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-2 text-[13.5px] font-bold uppercase tracking-[0.06em] ${RING}`}
          style={{ color: C.ink }}
        >
          {open ? <Minus size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
          Waarom deze match
        </button>
        <button
          onClick={onOpen}
          className={`ml-auto inline-flex items-center gap-2 px-4 py-2 text-[13.5px] font-bold ${RING}`}
          style={{ background: C.blue, color: C.white }}
        >
          Reageer <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <RedenBlok titel="Pluspunten" items={opdracht.redenen.plus} kind="plus" />
            <RedenBlok titel="Aandachtspunten" items={opdracht.redenen.min} kind="min" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function RedenBlok({
  titel,
  items,
  kind,
}: {
  titel: string;
  items: string[];
  kind: "plus" | "min";
}) {
  const plus = kind === "plus";
  return (
    <div className="p-4" style={{ border: `2px solid ${plus ? C.ink : C.blue}` }}>
      <p
        className="text-[12px] font-bold uppercase tracking-[0.14em]"
        style={{ color: plus ? C.ink : C.blue }}
      >
        {titel}
      </p>
      <ul className="mt-3 space-y-2.5">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 text-[14.5px] font-medium leading-snug"
            style={{ color: C.ink2 }}
          >
            <span className="mt-0.5 shrink-0" aria-hidden="true">
              {plus ? (
                <Check size={16} style={{ color: C.ink }} />
              ) : (
                <AlertTriangle size={15} style={{ color: C.blue }} />
              )}
            </span>
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className={`inline-flex items-center gap-2 text-[13.5px] font-bold uppercase tracking-[0.1em] ${RING}`}
        style={{ color: C.ink }}
      >
        <ArrowLeft size={16} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <div
        className="relative overflow-hidden p-7 md:p-10"
        style={{ background: C.ink, color: C.white }}
      >
        <span
          className="pointer-events-none absolute right-0 top-0"
          aria-hidden="true"
          style={{
            width: 0,
            height: 0,
            borderTop: `56px solid ${C.blue}`,
            borderLeft: "56px solid transparent",
          }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="text-[13px] font-bold uppercase tracking-[0.14em]"
            style={{ color: "#9fb0f2" }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center px-3 py-1 text-[13px] font-extrabold"
            style={{ background: C.blue, color: C.white }}
          >
            {opdracht.match}% match
          </span>
        </div>
        <h1
          className="mt-4 max-w-3xl text-[40px] font-extrabold leading-[1.02] tracking-[-0.03em] md:text-[54px]"
          style={head}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[16px] font-medium" style={{ color: "rgba(255,255,255,0.82)" }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            className={`inline-flex items-center gap-2 px-6 py-3.5 text-[15px] font-bold ${RING} focus-visible:ring-offset-[#0a0a0a]`}
            style={{ background: C.blue, color: C.white }}
          >
            Reageer op opdracht <ArrowRight size={17} aria-hidden="true" />
          </button>
          <button
            className={`inline-flex items-center gap-2 px-6 py-3.5 text-[15px] font-bold ${RING} focus-visible:ring-offset-[#0a0a0a]`}
            style={{ color: C.white, border: "2px solid rgba(255,255,255,0.5)" }}
          >
            Bewaar opdracht
          </button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Card key={m.l} className="p-4">
            <p
              className="text-[12px] font-bold uppercase tracking-[0.12em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p
              className="mt-2 text-[24px] font-extrabold tabular-nums tracking-[-0.02em]"
              style={head}
            >
              {m.v}
            </p>
          </Card>
        ))}
      </section>

      <section>
        <div className="border-b-2 pb-3" style={{ borderColor: C.line }}>
          <Overline>Onderbouwing · waarom deze match</Overline>
        </div>
        <p
          className="mt-5 max-w-2xl text-[16px] font-medium leading-relaxed"
          style={{ color: C.muted }}
        >
          Transparant opgebouwd op je geverifieerde profiel — wat ervoor pleit én de
          aandachtspunten, zonder verborgen score.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div
            className="p-6"
            style={{ border: `2px solid ${C.ink}`, boxShadow: `5px 5px 0 ${C.ink}` }}
          >
            <Overline tone={C.ink}>Pluspunten</Overline>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t-2 pt-3 text-[15px] font-medium"
                  style={{ borderColor: C.lineSoft, color: C.ink2 }}
                >
                  <Check
                    size={18}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.ink }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="p-6"
            style={{ border: `2px solid ${C.blue}`, boxShadow: `5px 5px 0 ${C.blue}` }}
          >
            <Overline tone={C.blue}>Aandachtspunten</Overline>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t-2 pt-3 text-[15px] font-medium"
                  style={{ borderColor: "rgba(22,54,199,0.2)", color: C.ink2 }}
                >
                  <AlertTriangle
                    size={17}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.blue }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
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
      <div
        className="flex flex-wrap items-end justify-between gap-6 border-b-2 pb-8"
        style={{ borderColor: C.line }}
      >
        <div className="max-w-lg">
          <Overline>Verificatie · authenticatie</Overline>
          <h1
            className="mt-3 text-[42px] font-extrabold leading-none tracking-[-0.03em]"
            style={head}
          >
            Certificaten
          </h1>
          <p className="mt-4 text-[16px] font-medium leading-relaxed" style={{ color: C.muted }}>
            <span className="font-extrabold" style={{ color: C.ink }}>
              {PROFIEL.trust}.
            </span>{" "}
            {verified} van {CREDENTIALS.length} certificaten geverifieerd. Eén verloopt binnenkort
            en vraagt actie.
          </p>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex flex-col items-end">
            <p
              className="text-[52px] font-extrabold tabular-nums leading-none tracking-[-0.03em]"
              style={head}
            >
              {ratio}
              <span className="text-[24px]" style={{ color: C.muted }}>
                %
              </span>
            </p>
            <p
              className="mt-1 text-[12px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.faint }}
            >
              geverifieerd
            </p>
          </div>
          <div className="flex flex-col gap-[3px]" aria-hidden="true">
            {Array.from({ length: CREDENTIALS.length }).map((_, i) => (
              <span
                key={i}
                className="inline-block"
                style={{
                  width: 22,
                  height: 10,
                  background: i < verified ? C.blue : "transparent",
                  border: `2px solid ${C.ink}`,
                  clipPath: "polygon(12% 0, 100% 0, 88% 100%, 0 100%)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <ul className="space-y-4">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Card className="p-5" accent={st.alarm}>
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 text-left ${RING}`}
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center"
                    style={{ border: `2px solid ${st.alarm ? C.blue : C.ink}` }}
                    aria-hidden="true"
                  >
                    <st.Icon size={20} style={{ color: st.alarm ? C.blue : C.ink }} />
                  </span>
                  <span className="min-w-0">
                    <span
                      className="block truncate text-[18px] font-extrabold tracking-[-0.01em]"
                      style={head}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 block text-[13.5px] font-semibold"
                      style={{ color: C.muted }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-4">
                    <span className="hidden sm:inline-flex">
                      <Chip alarm={st.alarm} pattern={st.pattern}>
                        {st.label}
                      </Chip>
                    </span>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{ color: C.ink, transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                      aria-hidden="true"
                    >
                      <Plus size={18} />
                    </span>
                  </span>
                </button>
                <div className="sm:hidden">
                  <div className="mt-3">
                    <Chip alarm={st.alarm} pattern={st.pattern}>
                      {st.label}
                    </Chip>
                  </div>
                </div>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div
                      className="mt-4 border-t-2 pt-4 sm:pl-16"
                      style={{ borderColor: C.lineSoft }}
                    >
                      <p
                        className="max-w-2xl text-[14.5px] font-medium leading-relaxed"
                        style={{ color: C.ink2 }}
                      >
                        {c.detail}. Documenten worden versleuteld bewaard en alleen na je expliciete
                        toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          className={`px-5 py-2.5 text-[14px] font-bold ${RING}`}
                          style={{ background: st.alarm ? C.blue : C.ink, color: C.white }}
                        >
                          {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                        </button>
                        <button
                          className={`px-5 py-2.5 text-[14px] font-bold ${RING}`}
                          style={{
                            color: C.ink,
                            border: `2px solid ${C.ink}`,
                            background: C.white,
                          }}
                        >
                          Historie
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
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
      <div className="border-b-2 pb-6" style={{ borderColor: C.line }}>
        <Overline>Volgende acties</Overline>
        <h1
          className="mt-3 text-[42px] font-extrabold leading-none tracking-[-0.03em]"
          style={head}
        >
          Acties
        </h1>
        <p className="mt-3 max-w-lg text-[16px] font-medium" style={{ color: C.muted }}>
          Op volgorde van urgentie. Rond ze af en je profiel blijft scherp en verifieerbaar.
        </p>
      </div>

      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <div
                className="grid grid-cols-1 items-center gap-5 bg-white p-5 sm:grid-cols-[auto_1fr_auto]"
                style={{
                  border: `2px solid ${warn ? C.blue : C.ink}`,
                  boxShadow: `5px 5px 0 ${warn ? C.blue : C.ink}`,
                }}
              >
                <span
                  className="flex h-14 w-14 items-center justify-center text-[18px] font-extrabold tabular-nums"
                  style={
                    warn
                      ? { background: C.blue, color: C.white }
                      : { border: `2px solid ${C.ink}`, color: C.ink }
                  }
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true">
                      {warn ? (
                        <AlertTriangle size={18} style={{ color: C.blue }} />
                      ) : (
                        <Check size={18} style={{ color: C.ink }} />
                      )}
                    </span>
                    <span
                      className="text-[12px] font-bold uppercase tracking-[0.12em]"
                      style={{ color: warn ? C.blue : C.faint }}
                    >
                      {warn ? "Urgent" : "Kans"}
                    </span>
                  </div>
                  <h2
                    className="mt-1.5 text-[20px] font-extrabold leading-tight tracking-[-0.01em]"
                    style={head}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1.5 max-w-xl text-[14.5px] font-medium leading-relaxed"
                    style={{ color: C.muted }}
                  >
                    {a.detail}
                  </p>
                </div>
                <button
                  className={`justify-self-start px-6 py-3 text-[14px] font-bold sm:justify-self-end ${RING}`}
                  style={
                    warn
                      ? { background: C.blue, color: C.white }
                      : { border: `2px solid ${C.ink}`, color: C.ink, background: C.white }
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
      <div
        className="flex flex-wrap items-end justify-between gap-4 border-b-2 pb-6"
        style={{ borderColor: C.line }}
      >
        <div>
          <Overline>Grootboek</Overline>
          <h1
            className="mt-3 text-[42px] font-extrabold leading-none tracking-[-0.03em]"
            style={head}
          >
            Facturen
          </h1>
        </div>
        <button
          className={`inline-flex items-center gap-2 px-6 py-3.5 text-[15px] font-bold ${RING}`}
          style={{ background: C.ink, color: C.white }}
        >
          <Plus size={17} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false },
        ].map((s) => (
          <Card key={s.l} className="p-5" accent={s.alarm}>
            <p
              className="text-[13px] font-bold uppercase tracking-[0.1em]"
              style={{ color: s.alarm ? C.blue : C.muted }}
            >
              {s.l}
            </p>
            <p
              className="mt-2 text-[32px] font-extrabold tabular-nums tracking-[-0.03em]"
              style={{ color: s.alarm ? C.blue : C.ink, ...head }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[13px] font-medium" style={{ color: C.muted }}>
              {s.sub}
            </p>
          </Card>
        ))}
      </section>

      <Card className="p-5">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_7rem] gap-4 border-b-2 pb-3 sm:grid"
          style={{ borderColor: C.ink }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[12px] font-bold uppercase tracking-[0.12em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint }}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-b-2 py-4 transition-colors hover:bg-[#f4f5f8] sm:grid-cols-[8rem_1fr_5rem_9rem_7rem] sm:gap-4"
                style={{ borderColor: C.lineSoft }}
              >
                <span
                  className="order-1 text-[13px] font-bold tabular-nums"
                  style={{ color: C.faint }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[16px] font-extrabold sm:order-2"
                  style={head}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[13.5px] font-semibold tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <Chip alarm={acc} pattern={acc ? "grid" : "solid"}>
                    {f.status}
                  </Chip>
                </span>
                <span
                  className="order-2 text-right text-[16px] font-extrabold tabular-nums sm:order-5"
                  style={{ color: acc ? C.blue : C.ink }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex items-baseline justify-between pt-5">
          <span
            className="text-[12px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.faint }}
          >
            Totaal betaald
          </span>
          <span className="text-[28px] font-extrabold tabular-nums" style={head}>
            {totaalBetaald}
          </span>
        </div>
      </Card>
    </div>
  );
}
