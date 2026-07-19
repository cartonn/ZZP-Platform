"use client";

// Concept 424 — "Vlakverdeling" · De Stijl / neo-plasticisme (Mondriaan).
// Nederlands modernisme: een asymmetrisch raster van vlakken, gescheiden door DIKKE zwarte lijnen
// (4–6px), gevuld met wit + spaarzame primaire vlakken. Kleur draagt betekenis: rood = urgent /
// aandacht, blauw = geverifieerd / vertrouwen, geel = in behandeling / wacht. Tekst staat altijd op
// een wit/licht vlak — nooit op een verzadigd primair vlak — voor scherp WCAG-contrast. Strak,
// hoog-contrast, kunstzinnig maar bruikbaar. Grotesk/schreefloos bold, tabellaire cijfers.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  Square,
  X,
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

// — Palet: papier-linnen, inkt-zwart raster, drie primaire vlakken (rood/blauw/geel) —
const C = {
  paper: "#f4f2ea",
  paperSoft: "#ece9df",
  card: "#ffffff",
  ink: "#12100e",
  inkSoft: "#3d3a34",
  inkMute: "#6b675e",
  inkFaint: "#98938a",
  line: "#12100e",
  hair: "rgba(18,16,14,0.14)",
  hairSoft: "rgba(18,16,14,0.08)",
  rood: "#d7263d",
  roodInk: "#a01326",
  roodWash: "#fbe6e9",
  blauw: "#1035ac",
  blauwInk: "#0a2678",
  blauwWash: "#e4e9f8",
  geel: "#f5c518",
  geelInk: "#8a6d02",
  geelWash: "#fdf4d4",
  groen: "#1f7a4d",
  groenInk: "#155838",
  groenWash: "#e0f0e7",
};

const display = {
  fontFamily:
    "'Archivo', 'Helvetica Neue', 'Arial Narrow', Helvetica, Arial, system-ui, sans-serif",
  letterSpacing: "-0.02em",
};
const body = {
  fontFamily: "'Inter', 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif",
};
const num = {
  fontFamily: "'Inter', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

const BORDER = `3px solid ${C.line}`;
const BORDER_THICK = `5px solid ${C.line}`;

type Prim = { fill: string; ink: string; wash: string };
const ROOD: Prim = { fill: C.rood, ink: C.roodInk, wash: C.roodWash };
const BLAUW: Prim = { fill: C.blauw, ink: C.blauwInk, wash: C.blauwWash };
const GEEL: Prim = { fill: C.geel, ink: C.geelInk, wash: C.geelWash };

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  prim: Prim;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, alarm: false, prim: BLAUW };
    case "SUBMITTED":
      return { label: "In behandeling", Icon: Clock, alarm: false, prim: GEEL };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: AlertTriangle, alarm: true, prim: ROOD };
    case "REJECTED":
      return { label: "Afgewezen", Icon: X, alarm: true, prim: ROOD };
  }
}

// — Vlak: een wit module-vlak met dik zwart kader; het raster ontstaat door aangrenzende vlakken —
function Vlak({
  children,
  className = "",
  as: Tag = "div",
  bg = C.card,
  thick = false,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  bg?: string;
  thick?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <Tag
      className={`relative ${className}`}
      style={{ background: bg, border: thick ? BORDER_THICK : BORDER, color: C.ink, ...style }}
    >
      {children}
    </Tag>
  );
}

function Eyebrow({ children, prim = ROOD }: { children: React.ReactNode; prim?: Prim }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-extrabold uppercase tracking-[0.24em]"
      style={{ color: C.ink, ...body }}
    >
      <span aria-hidden="true" className="inline-block h-3 w-3" style={{ background: prim.fill }} />
      {children}
    </p>
  );
}

function Chip({
  prim,
  children,
  alarm = false,
}: {
  prim: Prim;
  children: React.ReactNode;
  alarm?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em]"
      style={{ color: prim.ink, background: prim.wash, border: `2px solid ${C.line}`, ...body }}
    >
      {children}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  className = "",
  prim = ROOD,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  prim?: Prim;
}) {
  const isGeel = prim.fill === C.geel;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[12.5px] font-extrabold uppercase tracking-[0.08em] transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12100e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f2ea] active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`}
      style={{
        color: isGeel ? C.ink : "#ffffff",
        background: prim.fill,
        border: BORDER,
        boxShadow: `4px 4px 0 ${C.line}`,
        ...body,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  active = false,
  className = "",
  ariaPressed,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  ariaPressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-extrabold uppercase tracking-[0.08em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12100e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f2ea] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? "#ffffff" : C.ink,
        background: active ? C.ink : C.card,
        border: BORDER,
        ...body,
      }}
    >
      {children}
    </button>
  );
}

// — Stapel-sparkline: neo-plastische staafjes in primaire kleur, zwart omkaderd —
function BarSpark({ data, prim }: { data: number[]; prim: Prim }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  return (
    <div className="flex h-9 items-end gap-[3px]" aria-hidden="true">
      {data.map((d, i) => {
        const h = 22 + ((d - min) / span) * 14;
        const last = i === data.length - 1;
        return (
          <span
            key={i}
            className="flex-1"
            style={{
              height: `${h}px`,
              background: last ? prim.fill : C.paperSoft,
              border: `1.5px solid ${C.line}`,
            }}
          />
        );
      })}
    </div>
  );
}

// — Peil-balk: dikke zwart-omkaderde meter met primair-gevuld deel —
function Meter({ value, prim = BLAUW }: { value: number; prim?: Prim }) {
  return (
    <span className="hidden items-center gap-2.5 sm:flex" aria-hidden="true">
      <span
        className="relative block h-2.5 w-24 overflow-hidden"
        style={{ background: C.card, border: `2px solid ${C.line}` }}
      >
        <span className="block h-full" style={{ width: `${value}%`, background: prim.fill }} />
      </span>
      <span className="text-[12.5px] font-extrabold" style={{ color: C.ink, ...num }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept424() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...body, color: C.ink, background: C.paper }}
    >
      <style>{`
        @keyframes vvIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .vv-in { animation: vvIn 0.32s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
        @media (prefers-reduced-motion: reduce) { .vv-in { animation: none !important; } }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="vv-in pt-6">
          {screen === "dashboard" && (
            <Dashboard onOpen={() => setScreen("opdracht")} onActies={() => setScreen("acties")} />
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
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex items-center justify-between gap-4 pt-8">
      <div className="flex items-center gap-3.5">
        <span
          className="grid h-11 w-11 grid-cols-2 grid-rows-2 overflow-hidden"
          style={{ border: BORDER }}
          aria-hidden="true"
        >
          <span style={{ background: C.rood }} />
          <span style={{ background: C.card }} />
          <span style={{ background: C.card }} />
          <span style={{ background: C.blauw }} />
        </span>
        <div>
          <p
            className="text-[20px] font-extrabold uppercase leading-none"
            style={{ color: C.ink, ...display }}
          >
            Vlakverdeling
          </p>
          <p
            className="mt-1.5 text-[11px] font-semibold uppercase leading-none tracking-[0.12em]"
            style={{ color: C.inkMute, ...body }}
          >
            {PROFIEL.plaats} · neo-plasticisme
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] sm:inline-flex"
          style={{
            color: BLAUW.ink,
            background: BLAUW.wash,
            border: `2px solid ${C.line}`,
            ...body,
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center"
          style={{ background: C.card, border: `2px solid ${C.line}`, color: C.ink }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center text-[9px] font-extrabold"
              style={{
                background: C.rood,
                color: "#ffffff",
                border: `1.5px solid ${C.line}`,
                ...num,
              }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[14px] font-bold" style={{ color: C.ink, ...body }}>
            {PROFIEL.naam}
          </span>
          <span
            className="block text-[10.5px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: C.inkMute, ...body }}
          >
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center text-[13px] font-extrabold"
          style={{ background: C.geel, border: BORDER, color: C.ink, ...body }}
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
    <nav aria-label="Hoofdnavigatie" className="mt-6">
      <div className="flex items-stretch overflow-x-auto" style={{ border: BORDER }}>
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative flex shrink-0 items-center gap-2 px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.08em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#12100e] motion-reduce:transition-none"
              style={{
                color: on ? "#ffffff" : C.ink,
                background: on ? C.ink : C.card,
                borderLeft: i === 0 ? "none" : BORDER,
                ...body,
              }}
            >
              {on && (
                <span
                  className="inline-block h-2 w-2"
                  style={{ background: C.geel }}
                  aria-hidden="true"
                />
              )}
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-6">
      {/* — Compositie A: begroeting-vlak + primaire kleurvelden + aandacht-vlak — */}
      <section className="grid grid-cols-1 gap-0 lg:grid-cols-[1.5fr_1fr]">
        <Vlak thick className="p-7 md:p-9" bg={C.card}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Eyebrow prim={BLAUW}>Vandaag · {PROFIEL.plaats}</Eyebrow>
              <h1
                className="mt-4 text-[34px] font-extrabold uppercase leading-[0.94] md:text-[46px]"
                style={{ color: C.ink, ...display }}
              >
                Goedemorgen,
                <br />
                {PROFIEL.naam.split(" ")[0]}.
              </h1>
              <p
                className="mt-4 max-w-md text-[13.5px] font-medium leading-relaxed"
                style={{ color: C.inkSoft }}
              >
                Alles ligt in het raster. Loop je acties af, houd je praktijk verifieerbaar en
                betaald — helder en zonder ruis.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <PrimaryButton onClick={onActies} prim={ROOD}>
                  Volgende actie
                  <ArrowRight
                    size={14}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  />
                </PrimaryButton>
                <GhostButton onClick={onOpen}>Marktplaats</GhostButton>
              </div>
            </div>
            <div
              className="hidden shrink-0 grid-cols-2 grid-rows-3 gap-0 sm:grid"
              style={{ width: 78, border: BORDER }}
              aria-hidden="true"
            >
              <span style={{ background: C.rood, borderRight: BORDER, borderBottom: BORDER }} />
              <span style={{ background: C.card, borderBottom: BORDER }} />
              <span style={{ background: C.geel, borderRight: BORDER, borderBottom: BORDER }} />
              <span style={{ background: C.blauw, borderBottom: BORDER }} />
              <span style={{ background: C.card, borderRight: BORDER }} />
              <span style={{ background: C.rood }} />
            </div>
          </div>
        </Vlak>

        <Vlak thick className="flex flex-col p-7" bg={C.card} style={{}}>
          <div className="flex items-center justify-between">
            <Eyebrow prim={ROOD}>Vraagt aandacht</Eyebrow>
            <Square size={16} aria-hidden="true" style={{ color: C.rood }} />
          </div>
          <h2
            className="mt-4 text-[19px] font-extrabold uppercase leading-tight"
            style={{ color: C.ink, ...display }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] font-medium leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-auto pt-6">
            <PrimaryButton onClick={onActies} prim={ROOD} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <div className="mt-5 pt-4" style={{ borderTop: `2px solid ${C.hair}` }}>
            <p
              className="flex items-center gap-2 text-[11.5px] font-semibold"
              style={{ color: C.inkMute, ...num }}
            >
              <span
                className="inline-block h-2.5 w-2.5"
                style={{ background: C.blauw }}
                aria-hidden="true"
              />
              {verified}/{CREDENTIALS.length} certificaten geverifieerd · 7 open reacties
            </p>
          </div>
        </Vlak>
      </section>

      {/* — Compositie B: KPI-vlakken in een strak raster — */}
      <section>
        <div className="mb-3">
          <Eyebrow prim={GEEL}>Peil · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const prim = k.up ? BLAUW : ROOD;
            return (
              <Vlak
                key={k.label}
                className="p-5"
                style={{ marginLeft: i > 0 ? "-3px" : 0, marginTop: "-3px" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[10px] font-extrabold uppercase tracking-[0.1em]"
                    style={{ color: C.inkMute, ...body }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9.5px] font-extrabold"
                    style={{
                      color: prim.ink,
                      background: prim.wash,
                      border: `1.5px solid ${C.line}`,
                      ...num,
                    }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <p
                  className="mt-3 text-[28px] font-extrabold leading-none"
                  style={{ color: C.ink, ...num }}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <BarSpark data={k.spark} prim={prim} />
                </div>
              </Vlak>
            );
          })}
        </div>
      </section>

      {/* — Compositie C: matchlijst-vlak + certificaten-vlak — */}
      <section className="grid grid-cols-1 gap-0 lg:grid-cols-[1.5fr_1fr]">
        <Vlak thick className="overflow-hidden">
          <div
            className="flex items-baseline justify-between px-5 py-4"
            style={{ borderBottom: BORDER }}
          >
            <Eyebrow prim={BLAUW}>Open opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12100e]"
              style={{ color: C.ink, ...body }}
            >
              Alle →
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => {
              const strong = o.match >= 90;
              const prim = strong ? BLAUW : GEEL;
              return (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `2px solid ${C.hair}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#ece9df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#12100e] motion-reduce:transition-none"
                  >
                    <span
                      className="inline-flex h-11 w-11 items-center justify-center"
                      style={{ background: prim.wash, border: `2px solid ${C.line}` }}
                    >
                      <span
                        className="text-[13px] font-extrabold leading-none"
                        style={{ color: prim.ink, ...num }}
                      >
                        {o.match}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-bold"
                        style={{ color: C.ink, ...body }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px] font-medium"
                        style={{ color: C.inkMute }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <Meter value={o.match} prim={prim} />
                      <ChevronRight
                        size={18}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: C.ink }}
                      />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Vlak>

        <Vlak thick className="p-5" style={{ marginTop: 0 }}>
          <div className="mb-3">
            <Eyebrow prim={GEEL}>Certificaten</Eyebrow>
          </div>
          <ul>
            {CREDENTIALS.map((c, i) => {
              const st = statusMeta(c.status);
              return (
                <li
                  key={c.naam}
                  className="flex items-center gap-3 py-2.5"
                  style={{ borderTop: i === 0 ? "none" : `2px solid ${C.hair}` }}
                >
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center"
                    style={{
                      color: st.prim.ink,
                      background: st.prim.wash,
                      border: `2px solid ${C.line}`,
                    }}
                    aria-hidden="true"
                  >
                    <st.Icon size={14} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[12.5px] font-bold"
                      style={{ color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="block truncate text-[10.5px] font-semibold uppercase tracking-[0.04em]"
                      style={{ color: st.prim.ink }}
                    >
                      {st.label}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Vlak>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow prim={ROOD}>Marktplaats</Eyebrow>
          <h1
            className="mt-3 text-[32px] font-extrabold uppercase leading-none"
            style={{ color: C.ink, ...display }}
          >
            Open opdrachten
          </h1>
        </div>
        <p
          className="text-[12px] font-bold uppercase tracking-[0.08em]"
          style={{ color: C.inkMute, ...num }}
        >
          {String(filtered.length).padStart(2, "0")} / {String(OPDRACHTEN.length).padStart(2, "0")}{" "}
          getoond
        </p>
      </div>

      <div className="flex flex-col gap-0 sm:flex-row">
        <div
          className="flex flex-1 items-center gap-2.5 px-5 py-3"
          style={{ background: C.card, border: BORDER }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.ink }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] font-semibold outline-none placeholder:font-medium placeholder:text-[#98938a]"
            style={{ color: C.ink, ...body }}
          />
        </div>
        <div className="flex items-center gap-0 sm:-ml-[3px]" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <GhostButton
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
              className="sm:-ml-[3px]"
            >
              {s === "match" ? "Beste match" : "Tarief"}
            </GhostButton>
          ))}
          <GhostButton
            onClick={() => setLoading((v) => !v)}
            active={loading}
            ariaPressed={loading}
            className="sm:-ml-[3px]"
          >
            {loading ? "Stop" : "Laden…"}
          </GhostButton>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Vlak className="p-6">
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24" style={{ background: C.paperSoft }} />
                  <div className="h-5 w-2/3" style={{ background: C.paperSoft }} />
                  <div className="h-3 w-1/2" style={{ background: C.paperSoft }} />
                  <div className="h-2 w-full" style={{ background: C.paperSoft }} />
                </div>
              </Vlak>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Vlak thick className="p-6">
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="grid h-16 w-16 grid-cols-2 grid-rows-2"
              style={{ border: BORDER }}
              aria-hidden="true"
            >
              <span style={{ background: C.rood, borderRight: BORDER, borderBottom: BORDER }} />
              <span style={{ background: C.card, borderBottom: BORDER }} />
              <span style={{ background: C.card, borderRight: BORDER }} />
              <span style={{ background: C.geel }} />
            </span>
            <p
              className="mt-5 text-[22px] font-extrabold uppercase"
              style={{ color: C.ink, ...display }}
            >
              Leeg vlak
            </p>
            <p
              className="mx-auto mt-2 max-w-xs text-[13px] font-medium"
              style={{ color: C.inkSoft }}
            >
              Niets gevonden bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm en probeer
              opnieuw.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")} prim={BLAUW}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Vlak>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MarktKaart({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  const prim = strong ? BLAUW : GEEL;
  return (
    <Vlak thick className="overflow-hidden">
      <div className="grid grid-cols-[1fr_auto]">
        <div className="min-w-0 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.1em]"
              style={{ color: C.ink, border: `2px solid ${C.line}`, ...num }}
            >
              № {String(index + 1).padStart(2, "0")}
            </span>
            <span
              className="text-[11px] font-bold uppercase tracking-[0.06em]"
              style={{ color: C.inkFaint, ...num }}
            >
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-3 text-[20px] font-extrabold uppercase leading-tight"
            style={{ color: C.ink, ...display }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1.5 text-[12.5px] font-medium" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.04em]"
                style={{
                  color: C.inkSoft,
                  background: C.paperSoft,
                  border: `2px solid ${C.hair}`,
                  ...body,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div
          className="flex flex-col items-center justify-center gap-1 px-5"
          style={{ borderLeft: BORDER, background: prim.wash }}
        >
          <span
            className="text-[26px] font-extrabold leading-none"
            style={{ color: prim.ink, ...num }}
          >
            {opdracht.match}
          </span>
          <span
            className="text-[8px] font-extrabold uppercase tracking-[0.16em]"
            style={{ color: prim.ink }}
          >
            match
          </span>
          <span className="mt-2 text-[13px] font-extrabold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div
        className="flex flex-wrap items-center gap-3 px-6 py-4"
        style={{ borderTop: `2px solid ${C.hair}` }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12100e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffffff]"
          style={{ color: C.ink, border: `2px solid ${C.line}`, ...body }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <PrimaryButton onClick={onOpen} prim={ROOD}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </PrimaryButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ borderTop: BORDER }}>
            <RedenBlok
              titel="Voor"
              prim={BLAUW}
              Icon={Check}
              items={opdracht.redenen.plus}
              border={false}
            />
            <RedenBlok
              titel="Aandacht"
              prim={ROOD}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
              border
            />
          </div>
        </div>
      </div>
    </Vlak>
  );
}

function RedenBlok({
  titel,
  prim,
  Icon,
  items,
  border,
}: {
  titel: string;
  prim: Prim;
  Icon: LucideIcon;
  items: string[];
  border: boolean;
}) {
  return (
    <div className="p-5" style={{ borderLeft: border ? BORDER : "none", background: C.card }}>
      <p className="flex items-center gap-2 text-[10.5px] font-extrabold uppercase tracking-[0.12em]">
        <span
          className="inline-block h-2.5 w-2.5"
          style={{ background: prim.fill }}
          aria-hidden="true"
        />
        <span style={{ color: prim.ink }}>{titel}</span>
      </p>
      <ul className="mt-3 space-y-2.5">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2 text-[12.5px] font-medium"
            style={{ color: C.inkSoft }}
          >
            <Icon
              size={13}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: prim.ink }}
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  const prim = strong ? BLAUW : GEEL;
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12100e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f2ea]"
        style={{ color: C.ink, border: BORDER, background: C.card, ...body }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug
      </button>

      <Vlak thick className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto]">
          <div className="p-7 md:p-9">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.08em]"
                style={{ color: C.ink, border: `2px solid ${C.line}`, ...num }}
              >
                {opdracht.id}
              </span>
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.06em]"
                style={{
                  color: prim.ink,
                  background: prim.wash,
                  border: `2px solid ${C.line}`,
                  ...body,
                }}
              >
                {strong ? "Sterke match" : "Match"} · {opdracht.match}%
              </span>
            </div>
            <h1
              className="mt-4 max-w-2xl text-[30px] font-extrabold uppercase leading-[0.96] md:text-[42px]"
              style={{ color: C.ink, ...display }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-3 text-[14px] font-medium" style={{ color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <PrimaryButton prim={ROOD}>
                Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
              <GhostButton>Bewaren</GhostButton>
            </div>
          </div>
          <div
            className="hidden grid-rows-3 md:grid"
            style={{ width: 84, borderLeft: BORDER }}
            aria-hidden="true"
          >
            <span style={{ background: C.rood, borderBottom: BORDER }} />
            <span style={{ background: C.card, borderBottom: BORDER }} />
            <span style={{ background: prim.fill }} />
          </div>
        </div>
      </Vlak>

      <Vlak thick>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m, i) => (
            <div
              key={m.l}
              className="p-5"
              style={{
                borderLeft: i % 4 === 0 ? "none" : `2px solid ${C.hair}`,
                borderTop: i >= 2 ? `2px solid ${C.hair}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-extrabold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...body }}
              >
                {m.l}
              </p>
              <p className="mt-1.5 text-[18px] font-extrabold" style={{ color: C.ink, ...num }}>
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Vlak>

      <section>
        <Eyebrow prim={BLAUW}>Verklaarbare matching</Eyebrow>
        <p
          className="mt-3 max-w-xl text-[13.5px] font-medium leading-relaxed"
          style={{ color: C.inkSoft }}
        >
          Afgeleid van je geverifieerde profiel — wat aansluit én waar je op moet letten, zonder
          verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-0 md:grid-cols-2">
          <Vlak thick className="p-6">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center"
                style={{ color: BLAUW.ink, background: BLAUW.wash, border: `2px solid ${C.line}` }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[11px] font-extrabold uppercase tracking-[0.12em]"
                style={{ color: BLAUW.ink }}
              >
                Voor
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px] font-medium"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: BLAUW.ink }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Vlak>
          <Vlak thick className="p-6" style={{ marginTop: 0, marginLeft: "-3px" }}>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center"
                style={{ color: ROOD.ink, background: ROOD.wash, border: `2px solid ${C.line}` }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[11px] font-extrabold uppercase tracking-[0.12em]"
                style={{ color: ROOD.ink }}
              >
                Aandacht
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px] font-medium"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: ROOD.ink }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Vlak>
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
    <div className="space-y-6">
      <Vlak thick className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto]">
          <div className="p-7 md:p-9">
            <Eyebrow prim={BLAUW}>Verificatie · vertrouwen</Eyebrow>
            <h1
              className="mt-3 text-[28px] font-extrabold uppercase leading-tight"
              style={{ color: C.ink, ...display }}
            >
              Jouw certificaten
            </h1>
            <p
              className="mt-3 max-w-md text-[13.5px] font-medium leading-relaxed"
              style={{ color: C.inkSoft }}
            >
              <span className="font-bold" style={{ color: BLAUW.ink }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten staan geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing. Documenten blijven versleuteld en privé.
            </p>
            <div className="mt-4 max-w-xs">
              <Meter value={ratio} prim={BLAUW} />
            </div>
          </div>
          <div
            className="flex items-center justify-center p-7"
            style={{ borderLeft: BORDER, background: BLAUW.wash }}
          >
            <span className="flex flex-col items-center">
              <span
                className="text-[44px] font-extrabold leading-none"
                style={{ color: BLAUW.ink, ...num }}
              >
                {ratio}
              </span>
              <span
                className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.16em]"
                style={{ color: BLAUW.ink }}
              >
                % geverifieerd
              </span>
            </span>
          </div>
        </div>
      </Vlak>

      <Vlak thick className="overflow-hidden">
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-6 py-3.5 sm:grid"
          style={{ borderBottom: BORDER }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9.5px] font-extrabold uppercase tracking-[0.18em]"
              style={{ color: C.inkMute, ...body }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {CREDENTIALS.map((c, idx) => {
            const st = statusMeta(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam} style={{ borderTop: idx === 0 ? "none" : `2px solid ${C.hair}` }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[#ece9df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#12100e] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center"
                      style={{
                        color: st.prim.ink,
                        background: st.prim.wash,
                        border: `2px solid ${C.line}`,
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-bold"
                        style={{ color: C.ink, ...body }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px] font-medium"
                        style={{ color: C.inkMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                  </span>
                  <span className="hidden sm:flex">
                    <Chip prim={st.prim} alarm={st.alarm}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                    </Chip>
                  </span>
                  <span
                    className="hidden justify-self-end transition-transform motion-reduce:transition-none sm:block"
                    style={{ color: C.ink, transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                    aria-hidden="true"
                  >
                    <Plus size={16} />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-5 sm:pl-[76px]">
                      <div
                        className="p-4"
                        style={{ background: C.paperSoft, border: `2px solid ${C.hair}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] font-medium leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na jouw
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-3">
                          <PrimaryButton prim={c.status === "EXPIRING" ? ROOD : BLAUW}>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </PrimaryButton>
                          <GhostButton>Historie</GhostButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Vlak>

      <div>
        <div className="mb-3">
          <Eyebrow prim={GEEL}>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
          {DOCUMENTEN.map((d, i) => {
            const st = statusMeta(d.status);
            return (
              <Vlak
                key={d.naam}
                className="flex items-center gap-3 p-4"
                style={{ marginLeft: i % 2 === 1 ? "-3px" : 0, marginTop: i >= 2 ? "-3px" : 0 }}
              >
                <span
                  className="inline-flex h-10 w-10 items-center justify-center"
                  style={{ background: C.paperSoft, border: `2px solid ${C.line}`, color: C.ink }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold" style={{ color: C.ink }}>
                    {d.naam}
                  </span>
                  <span
                    className="block text-[10.5px] font-medium"
                    style={{ color: C.inkMute, ...num }}
                  >
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase"
                  style={{
                    color: st.prim.ink,
                    background: st.prim.wash,
                    border: `2px solid ${C.line}`,
                  }}
                >
                  <st.Icon size={10} aria-hidden="true" />
                  {st.label}
                </span>
              </Vlak>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow prim={ROOD}>Acties · op volgorde</Eyebrow>
        <h1
          className="mt-3 text-[32px] font-extrabold uppercase leading-none"
          style={{ color: C.ink, ...display }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px] font-medium" style={{ color: C.inkSoft }}>
          Van boven naar beneden — zo blijf je verifieerbaar en betaald, zonder ruis.
        </p>
      </div>

      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const prim = warn ? ROOD : BLAUW;
          return (
            <li key={a.titel}>
              <Vlak thick className="overflow-hidden">
                <div className="grid grid-cols-[auto_1fr] items-stretch">
                  <div
                    className="flex w-14 flex-col items-center justify-center"
                    style={{ background: prim.wash, borderRight: BORDER }}
                    aria-hidden="true"
                  >
                    <span
                      className="text-[16px] font-extrabold"
                      style={{ color: prim.ink, ...num }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[1fr_auto]">
                      <div className="min-w-0">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-[0.12em]"
                          style={{
                            color: prim.ink,
                            background: prim.wash,
                            border: `2px solid ${C.line}`,
                            ...body,
                          }}
                        >
                          {warn ? (
                            <AlertTriangle size={10} aria-hidden="true" />
                          ) : (
                            <ArrowUpRight size={10} aria-hidden="true" />
                          )}
                          {warn ? "Urgent" : "Aanbevolen"}
                        </span>
                        <h2
                          className="mt-2 text-[19px] font-extrabold uppercase leading-tight"
                          style={{ color: C.ink, ...display }}
                        >
                          {a.titel}
                        </h2>
                        <p
                          className="mt-1.5 max-w-lg text-[13.5px] font-medium leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {a.detail}
                        </p>
                      </div>
                      <div className="sm:self-center">
                        <PrimaryButton prim={prim}>
                          {a.cta}
                          <ArrowRight size={13} aria-hidden="true" />
                        </PrimaryButton>
                      </div>
                    </div>
                  </div>
                </div>
              </Vlak>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurPrim(status: string): { prim: Prim; Icon: LucideIcon | null; label: string } {
  if (status === "Openstaand") return { prim: ROOD, Icon: AlertTriangle, label: "Openstaand" };
  if (status === "Betaald") return { prim: BLAUW, Icon: Check, label: "Betaald" };
  return { prim: GEEL, Icon: FileText, label: "Concept" };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow prim={BLAUW}>Facturen</Eyebrow>
          <h1
            className="mt-3 text-[32px] font-extrabold uppercase leading-none"
            style={{ color: C.ink, ...display }}
          >
            Facturen
          </h1>
        </div>
        <PrimaryButton prim={ROOD}>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <section className="grid grid-cols-1 gap-0 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", prim: BLAUW, alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", prim: ROOD, alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", prim: GEEL, alarm: false },
        ].map((s, i) => (
          <Vlak key={s.l} className="p-6" style={{ marginLeft: i > 0 ? "-3px" : 0 }}>
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-extrabold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute, ...body }}
              >
                {s.l}
              </p>
              <span
                className="inline-block h-3 w-3"
                style={{ background: s.prim.fill }}
                aria-hidden="true"
              />
            </div>
            <p
              className="mt-2 text-[27px] font-extrabold"
              style={{ color: s.alarm ? ROOD.ink : C.ink, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px] font-medium" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Vlak>
        ))}
      </section>

      <Vlak thick className="overflow-hidden">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-6 pb-3 pt-5 sm:grid"
          style={{ borderBottom: BORDER }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-extrabold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.inkMute, ...body }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f, i) => {
            const ft = factuurPrim(f.status);
            const acc = f.status === "Openstaand";
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-6 py-4 transition-colors hover:bg-[#ece9df] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `2px solid ${C.hair}` }}
              >
                <span
                  className="order-1 text-[11.5px] font-bold"
                  style={{ color: C.inkMute, ...num }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-bold sm:order-2"
                  style={{ color: C.ink, ...body }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11.5px] font-medium sm:order-3 sm:inline"
                  style={{ color: C.inkMute, ...num }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-bold uppercase"
                    style={{
                      color: ft.prim.ink,
                      background: ft.prim.wash,
                      border: `2px solid ${C.line}`,
                      ...body,
                    }}
                  >
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {ft.label}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-extrabold sm:order-5"
                  style={{ color: acc ? ROOD.ink : C.ink, ...num }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-6 py-4"
          style={{ borderTop: BORDER, background: C.paperSoft }}
        >
          <span
            className="text-[10px] font-extrabold uppercase tracking-[0.18em]"
            style={{ color: C.inkMute, ...body }}
          >
            Totaal betaald
          </span>
          <span className="text-[20px] font-extrabold" style={{ color: C.ink, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </Vlak>
    </div>
  );
}
