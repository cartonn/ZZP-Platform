"use client";

// Concept 53 — "Bauhaus" · geometrische primaire vormen (Bauhaus / De Stijl).
// Primaire kleuren (rood, kobaltblauw, geel) + zwart op warm off-white, dikke zwarte kaderlijnen,
// pure geometrie (cirkels, halve cirkels, driehoeken, kwarten) als functionele UI-elementen en
// dividers, een streng maar speels raster (Mondriaan-vlakken), geometrische sans-display. KPI's als
// kleurvlak-composities, avatar/rol als geometrisch zegel. Strak, zelfverzekerd, kunsthistorisch.
// Onderscheidend van Swiss (grid-typografie), Art-deco en Neo-brutalisme (offset-schaduw): dit is
// Bauhaus-geometrie met primaire kleurvlakken en dikke kaderlijnen.
// Palet: paper #f1ebdd, ink #16130f, rood #df3b2c, blauw #2440bf, geel #f3c018, wit #ffffff.
// Fonts: --font-lab-bricolage (display) + --font-lab-space (body/labels).

import { useEffect, useState } from "react";
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

/* ---------- Palet & typografie ---------- */

const C = {
  paper: "#f1ebdd",
  paperAlt: "#e8e0cf",
  ink: "#16130f",
  white: "#ffffff",
  red: "#df3b2c",
  blue: "#2440bf",
  yellow: "#f3c018",
  muted: "#5a544a",
  faint: "#8a8375",
};

const display = { fontFamily: "var(--font-lab-bricolage)" };
const body = { fontFamily: "var(--font-lab-space)" };

const BORDER = `2.5px solid ${C.ink}`;
const BORDER_THIN = `2px solid ${C.ink}`;

/* ---------- Status → primaire kleur + vorm ---------- */

type Shape = "circle" | "half" | "triangle" | "square";
type Prim = "red" | "blue" | "yellow" | "ink";
const PRIM: Record<Prim, string> = { red: C.red, blue: C.blue, yellow: C.yellow, ink: C.ink };

function credMeta(s: CredStatus): { label: string; prim: Prim; shape: Shape } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", prim: "blue", shape: "circle" };
    case "SUBMITTED":
      return { label: "In beoordeling", prim: "yellow", shape: "half" };
    case "EXPIRING":
      return { label: "Verloopt bijna", prim: "red", shape: "triangle" };
    case "REJECTED":
      return { label: "Afgewezen", prim: "ink", shape: "square" };
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Geometrische primitieven ---------- */

// Losse vorm-glyph in SVG — de dragende visuele taal van dit concept.
function Glyph({ shape, color, size = 16 }: { shape: Shape; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      {shape === "circle" && <circle cx={8} cy={8} r={6.5} fill={color} />}
      {shape === "half" && <path d="M1.5 8 A6.5 6.5 0 0 1 14.5 8 Z" fill={color} />}
      {shape === "triangle" && <path d="M8 1.5 L14.5 14 L1.5 14 Z" fill={color} />}
      {shape === "square" && <rect x={2} y={2} width={12} height={12} fill={color} />}
    </svg>
  );
}

// Geometrisch zegel als avatar: kwartcirkel + driehoek + cirkel + initialen.
function Seal({ initials, size = 44 }: { initials: string; size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden"
      style={{ width: size, height: size, border: BORDER_THIN, background: C.white }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox="0 0 44 44" className="absolute inset-0">
        <path d="M0 0 L22 0 A22 22 0 0 0 0 22 Z" fill={C.blue} />
        <path d="M44 44 L44 22 L22 44 Z" fill={C.red} />
        <circle cx={33} cy={11} r={7} fill={C.yellow} />
      </svg>
      <span
        className="relative text-[13px] font-bold"
        style={{ ...display, color: C.ink, mixBlendMode: "normal" }}
      >
        {initials}
      </span>
    </span>
  );
}

// Bauhaus-scheidingslijn: dikke regel met een cirkel-/driehoek-accent.
function Rule({ accent = "red" }: { accent?: Prim }) {
  return (
    <div className="flex items-center gap-0" aria-hidden="true">
      <span className="h-[3px] w-6" style={{ background: C.ink }} />
      <Glyph shape={accent === "yellow" ? "triangle" : "circle"} color={PRIM[accent]} size={14} />
      <span className="h-[3px] flex-1" style={{ background: C.ink }} />
    </div>
  );
}

function Kicker({ children, prim = "red" }: { children: React.ReactNode; prim?: Prim }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Glyph shape="circle" color={PRIM[prim]} size={13} />
      <span
        className="text-[11px] font-bold uppercase tracking-[0.22em]"
        style={{ ...body, color: C.ink }}
      >
        {children}
      </span>
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-2 text-[28px] font-extrabold leading-[0.98] tracking-tight sm:text-[36px]"
      style={{ ...display, color: C.ink }}
    >
      {children}
    </h1>
  );
}

function StatusPill({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em]"
      style={{
        ...body,
        color: m.prim === "yellow" ? C.ink : C.white,
        background: PRIM[m.prim],
        border: BORDER_THIN,
      }}
    >
      <Glyph shape={m.shape} color={m.prim === "yellow" ? C.ink : C.white} size={12} />
      {m.label}
    </span>
  );
}

/* ---------- Hoofdcomponent ---------- */

const NAV_SHAPES: Record<ScreenKey, { shape: Shape; prim: Prim }> = {
  dashboard: { shape: "circle", prim: "red" },
  marktplaats: { shape: "triangle", prim: "blue" },
  opdracht: { shape: "square", prim: "yellow" },
  verificatie: { shape: "half", prim: "red" },
  acties: { shape: "triangle", prim: "yellow" },
  facturen: { shape: "circle", prim: "blue" },
  documenten: { shape: "square", prim: "red" },
  berichten: { shape: "half", prim: "blue" },
};

export function Concept53() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, background: C.paper, color: C.ink }}
    >
      <div className="relative flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk */}
        <aside className="shrink-0 md:w-[236px]" style={{ borderRight: undefined }}>
          <div className="flex h-full flex-col" style={{ borderBottom: BORDER }}>
            {/* Merk-blok */}
            <div
              className="flex items-center gap-3 p-4"
              style={{ borderBottom: BORDER, background: C.yellow }}
            >
              <span
                className="flex h-9 w-9 items-center justify-center"
                style={{ border: BORDER_THIN, background: C.white }}
                aria-hidden="true"
              >
                <svg width={22} height={22} viewBox="0 0 22 22">
                  <rect x={0} y={0} width={11} height={11} fill={C.red} />
                  <circle cx={16} cy={5.5} r={5} fill={C.blue} />
                  <path d="M0 22 L11 22 L0 11 Z" fill={C.ink} />
                </svg>
              </span>
              <div className="leading-none">
                <div className="text-[16px] font-extrabold tracking-tight" style={display}>
                  BAUHAUS
                </div>
                <div
                  className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: C.ink }}
                >
                  ZZP · werk
                </div>
              </div>
            </div>

            {/* Navigatie */}
            <nav
              className="flex flex-row overflow-x-auto md:flex-1 md:flex-col"
              aria-label="Hoofdnavigatie"
              style={{ background: C.paper }}
            >
              {SCREENS.map((s) => {
                const on = s.key === screen;
                const g = NAV_SHAPES[s.key];
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className="flex shrink-0 items-center gap-3 px-4 py-3 text-left text-[13.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2440bf] md:w-full"
                    style={{
                      color: on ? C.white : C.ink,
                      background: on ? C.ink : "transparent",
                      borderBottom: BORDER_THIN,
                    }}
                  >
                    <Glyph shape={g.shape} color={on ? PRIM[g.prim] : PRIM[g.prim]} size={16} />
                    <span style={body}>{s.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Profiel-zegel */}
            <div
              className="hidden items-center gap-3 p-4 md:flex"
              style={{ borderTop: BORDER, background: C.paperAlt }}
            >
              <Seal initials={PROFIEL.initialen} />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold" style={display}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.06em]"
                  style={{ color: C.blue }}
                >
                  <Glyph shape="circle" color={C.blue} size={10} /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col" style={{ borderTop: BORDER }}>
          <div className="flex-1 overflow-y-auto p-5 sm:p-7">
            {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
            {screen === "marktplaats" && (
              <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
            )}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({
  onOpen,
  onGo,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
}) {
  const warn = ACTIES[0];
  const [loading, setLoading] = useState(false);
  const refresh = () => setLoading(true);
  useEffect(() => {
    if (!loading) return;
    const t = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(t);
  }, [loading]);

  const primFor = (i: number): Prim => (["red", "blue", "yellow", "ink"] as Prim[])[i % 4]!;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker prim="red">Overzicht</Kicker>
          <Title>Goedendag, {PROFIEL.naam.split(" ")[0]}</Title>
          <p className="mt-2 text-[13.5px]" style={{ color: C.muted }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <div className="hidden sm:block">
          <svg width={96} height={64} viewBox="0 0 96 64" aria-hidden="true">
            <rect
              x={0}
              y={0}
              width={96}
              height={64}
              fill={C.white}
              stroke={C.ink}
              strokeWidth={2.5}
            />
            <circle cx={26} cy={32} r={18} fill={C.blue} />
            <path d="M48 4 L92 4 L92 60 Z" fill={C.red} />
            <rect x={40} y={40} width={16} height={20} fill={C.yellow} />
          </svg>
        </div>
      </div>

      {/* Waarschuwing — verlopende VOG */}
      {warn && (
        <div
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
          style={{ border: BORDER, background: C.red }}
          role="alert"
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center self-start"
            style={{ background: C.white, border: BORDER_THIN }}
          >
            <Glyph shape="triangle" color={C.red} size={18} />
          </span>
          <p className="text-[13px] font-medium leading-snug text-white">
            <span className="font-extrabold" style={display}>
              {warn.titel}.
            </span>{" "}
            {warn.detail}
          </p>
          <button
            onClick={() => onGo("verificatie")}
            className="ml-auto shrink-0 px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.04em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{ background: C.white, color: C.ink, border: BORDER_THIN }}
          >
            {warn.cta}
          </button>
        </div>
      )}

      {/* KPI's als Mondriaan-vlakken */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const prim = primFor(i);
          const filled = prim === "red" || prim === "blue";
          return (
            <div
              key={k.label}
              className="flex flex-col justify-between p-4"
              style={{ border: BORDER, background: filled ? PRIM[prim] : C.white, minHeight: 128 }}
            >
              <div className="flex items-start justify-between">
                <p
                  className="text-[10.5px] font-bold uppercase leading-tight tracking-[0.08em]"
                  style={{ color: filled ? C.white : C.ink, maxWidth: "70%" }}
                >
                  {k.label}
                </p>
                <Glyph
                  shape={(["circle", "triangle", "square", "half"] as Shape[])[i % 4]!}
                  color={filled ? C.white : PRIM[prim]}
                  size={16}
                />
              </div>
              <div>
                <p
                  className="text-[30px] font-extrabold tabular-nums leading-none"
                  style={{ ...display, color: filled ? C.white : C.ink }}
                >
                  {k.value}
                </p>
                <p
                  className="mt-1 text-[11px] font-bold tabular-nums"
                  style={{ color: filled ? C.white : C.muted }}
                >
                  {k.up ? "▲" : "▼"} {k.trend}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matches */}
        <section className="lg:col-span-2" style={{ border: BORDER, background: C.white }}>
          <div
            className="flex items-center justify-between p-4"
            style={{ borderBottom: BORDER_THIN }}
          >
            <h3 className="flex items-center gap-2 text-[14px] font-extrabold" style={display}>
              <Glyph shape="circle" color={C.blue} size={15} /> Beste matches
            </h3>
            <button
              onClick={refresh}
              className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2440bf]"
              style={{ border: BORDER_THIN, color: C.ink }}
            >
              Vernieuw
            </button>
          </div>
          {loading ? (
            <div className="space-y-3 p-4" role="status" aria-live="polite">
              <span className="sr-only">Matches worden geladen…</span>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3"
                  style={{ border: BORDER_THIN }}
                >
                  <span className="h-10 w-10 animate-pulse" style={{ background: C.paperAlt }} />
                  <div className="flex-1 space-y-2">
                    <span
                      className="block h-3 w-2/3 animate-pulse"
                      style={{ background: C.paperAlt }}
                    />
                    <span
                      className="block h-2.5 w-1/2 animate-pulse"
                      style={{ background: C.paperAlt }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li
                  key={o.id}
                  style={{ borderBottom: i === OPDRACHTEN.length - 1 ? "none" : BORDER_THIN }}
                >
                  <button
                    onClick={() => onOpen(o.id)}
                    className="flex w-full items-center gap-3.5 p-4 text-left transition-colors hover:bg-[#f1ebdd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2440bf]"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center text-[13px] font-extrabold tabular-nums"
                      style={{
                        ...display,
                        background: o.match >= 90 ? C.blue : C.yellow,
                        color: o.match >= 90 ? C.white : C.ink,
                        border: BORDER_THIN,
                      }}
                    >
                      {o.match}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-bold">{o.titel}</span>
                      <span className="block truncate text-[11.5px]" style={{ color: C.muted }}>
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <Glyph shape="triangle" color={C.red} size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Certificaten + berichten */}
        <div className="space-y-6">
          <section style={{ border: BORDER, background: C.white }}>
            <div className="p-4" style={{ borderBottom: BORDER_THIN }}>
              <h3 className="flex items-center gap-2 text-[14px] font-extrabold" style={display}>
                <Glyph shape="half" color={C.red} size={15} /> Certificaten
              </h3>
            </div>
            <div className="divide-y-2" style={{ borderColor: C.ink }}>
              {CREDENTIALS.map((c) => (
                <div
                  key={c.naam}
                  className="flex items-center gap-3 p-3"
                  style={{ borderTop: BORDER_THIN }}
                >
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">
                    {c.naam}
                  </span>
                  <Glyph
                    shape={credMeta(c.status).shape}
                    color={PRIM[credMeta(c.status).prim]}
                    size={15}
                  />
                </div>
              ))}
            </div>
          </section>

          <section style={{ border: BORDER, background: C.yellow }}>
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: BORDER_THIN }}
            >
              <h3 className="flex items-center gap-2 text-[14px] font-extrabold" style={display}>
                <Glyph shape="square" color={C.ink} size={15} /> Berichten
              </h3>
              <span className="text-[11px] font-bold">
                {BERICHTEN.filter((b) => b.ongelezen).length} nieuw
              </span>
            </div>
            {BERICHTEN.slice(0, 2).map((b, i) => (
              <div
                key={b.van}
                className="flex items-center gap-3 p-3"
                style={{ borderTop: i === 0 ? "none" : BORDER_THIN }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center text-[11px] font-extrabold"
                  style={{ ...display, background: C.white, border: BORDER_THIN }}
                >
                  {b.initialen}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-bold">{b.van}</p>
                  <p className="truncate text-[11px]" style={{ color: C.ink }}>
                    {b.preview}
                  </p>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({
  activeId,
  onSelect,
  onOpen,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onOpen: (id?: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  const sel = filtered.find((o) => o.id === activeId) ?? filtered[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Kicker prim="blue">Marktplaats</Kicker>
        <Title>Open opdrachten</Title>
        <div className="mt-3">
          <Rule accent="blue" />
        </div>
      </div>

      <div className="flex items-center gap-3 p-3" style={{ border: BORDER, background: C.white }}>
        <Glyph shape="circle" color={C.red} size={16} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] font-medium outline-none placeholder:text-[#8a8375]"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[11.5px] font-bold tabular-nums" style={{ color: C.faint }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div
          className="p-12 text-center"
          style={{ border: BORDER, background: C.white }}
          role="status"
        >
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center"
            style={{ border: BORDER }}
            aria-hidden="true"
          >
            <Glyph shape="triangle" color={C.yellow} size={26} />
          </span>
          <p className="mt-4 text-[17px] font-extrabold" style={display}>
            Niets gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Geen opdracht past bij &quot;{q}&quot;. Verbreed je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 px-4 py-2 text-[12.5px] font-bold uppercase tracking-[0.04em] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2440bf]"
            style={{ background: C.blue, border: BORDER_THIN }}
          >
            Zoekopdracht wissen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-4">
            {filtered.map((o, i) => {
              const on = sel?.id === o.id;
              const prim = (["red", "blue", "yellow"] as Prim[])[i % 3]!;
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  className="w-full p-4 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2440bf]"
                  style={{ border: BORDER, background: on ? C.paperAlt : C.white }}
                >
                  <div className="flex items-start gap-3.5">
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center text-[14px] font-extrabold tabular-nums"
                      style={{
                        ...display,
                        background: PRIM[prim],
                        color: prim === "yellow" ? C.ink : C.white,
                        border: BORDER_THIN,
                      }}
                    >
                      {o.match}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
                          style={{ color: C.faint }}
                        >
                          {o.id}
                        </span>
                        {on && <Glyph shape="circle" color={C.red} size={11} />}
                      </div>
                      <p className="truncate text-[15px] font-bold">{o.titel}</p>
                      <p className="mt-0.5 truncate text-[11.5px]" style={{ color: C.muted }}>
                        {o.opdrachtgever} · {o.plaats} · {o.uren}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 text-[10.5px] font-bold"
                            style={{ border: BORDER_THIN, color: C.ink }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {sel && (
            <aside
              className="h-fit lg:sticky lg:top-4"
              style={{ border: BORDER, background: C.white }}
            >
              <div
                className="flex items-center justify-between p-4"
                style={{ borderBottom: BORDER_THIN, background: C.blue }}
              >
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-white">
                  {sel.id}
                </span>
                <Glyph shape="square" color={C.yellow} size={15} />
              </div>
              <div className="p-4">
                <p className="text-[16px] font-extrabold leading-snug" style={display}>
                  {sel.titel}
                </p>
                <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
                  {sel.opdrachtgever} · {sel.plaats}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-[12.5px]">
                  {[
                    { l: "Tarief", v: sel.tarief },
                    { l: "Omvang", v: sel.uren },
                    { l: "Start", v: sel.start },
                    { l: "Match", v: `${sel.match}%` },
                  ].map((m) => (
                    <div key={m.l} className="p-2.5" style={{ border: BORDER_THIN }}>
                      <dt
                        className="text-[10px] font-bold uppercase tracking-[0.06em]"
                        style={{ color: C.muted }}
                      >
                        {m.l}
                      </dt>
                      <dd className="mt-0.5 font-extrabold tabular-nums" style={display}>
                        {m.v}
                      </dd>
                    </div>
                  ))}
                </dl>
                <button
                  onClick={() => onOpen(sel.id)}
                  className="mt-4 w-full px-4 py-2.5 text-[12.5px] font-bold uppercase tracking-[0.04em] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2440bf]"
                  style={{ background: C.ink, border: BORDER_THIN }}
                >
                  Open opdracht
                </button>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div style={{ border: BORDER, background: C.white }}>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div>
            <Kicker prim="yellow">{opdracht.id}</Kicker>
            <Title>{opdracht.titel}</Title>
            <p className="mt-2 text-[12.5px] font-medium" style={{ color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 text-[11px] font-bold"
                  style={{ border: BORDER_THIN }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <span
            className="flex h-20 w-20 shrink-0 flex-col items-center justify-center"
            style={{
              background: opdracht.match >= 90 ? C.blue : C.yellow,
              border: BORDER,
              color: opdracht.match >= 90 ? C.white : C.ink,
            }}
          >
            <span className="text-[28px] font-extrabold tabular-nums leading-none" style={display}>
              {opdracht.match}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.1em]">match</span>
          </span>
        </div>
        <div className="p-5 pt-0 sm:p-6 sm:pt-0">
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="flex w-full items-center justify-center gap-2 px-5 py-3 text-[13px] font-bold uppercase tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2440bf] disabled:translate-y-0"
            style={{
              background: state === "sent" ? C.blue : C.red,
              color: C.white,
              border: BORDER,
            }}
          >
            {state === "idle" && (
              <>
                <Glyph shape="triangle" color={C.white} size={14} /> Reageer op opdracht
              </>
            )}
            {state === "sending" && "Versturen…"}
            {state === "sent" && (
              <>
                <Glyph shape="circle" color={C.white} size={14} /> Reactie verstuurd
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m, i) => (
          <div
            key={m.l}
            className="p-4"
            style={{ border: BORDER, background: i === 3 ? C.yellow : C.white }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-[0.08em]"
              style={{ color: C.muted }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[18px] font-extrabold tabular-nums" style={display}>
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <div style={{ border: BORDER, background: C.white }}>
        <div className="flex items-center gap-2 p-4" style={{ borderBottom: BORDER_THIN }}>
          <Glyph shape="circle" color={C.blue} size={15} />
          <h3 className="text-[14px] font-extrabold" style={display}>
            Waarom deze match
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
          <div className="p-5" style={{ borderRight: BORDER_THIN }}>
            <p
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.blue }}
            >
              <Glyph shape="circle" color={C.blue} size={12} /> Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px] font-medium">
                  <Glyph shape="circle" color={C.blue} size={12} />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-5" style={{ borderTop: BORDER_THIN }}>
            <p
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.red }}
            >
              <Glyph shape="triangle" color={C.red} size={12} /> Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px] font-medium"
                  style={{ color: C.muted }}
                >
                  <Glyph shape="triangle" color={C.red} size={12} />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Kicker prim="red">Verificatie</Kicker>
        <Title>Certificaten</Title>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div
          className="flex flex-col justify-between p-4"
          style={{ border: BORDER, background: C.blue, color: C.white, minHeight: 110 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.08em]">
              Geverifieerd
            </span>
            <Glyph shape="circle" color={C.white} size={16} />
          </div>
          <p className="text-[30px] font-extrabold tabular-nums" style={display}>
            {verified}/{total}
          </p>
        </div>
        <div
          className="flex flex-col justify-between p-4"
          style={{ border: BORDER, background: C.red, color: C.white, minHeight: 110 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.08em]">
              Verloopt bijna
            </span>
            <Glyph shape="triangle" color={C.white} size={16} />
          </div>
          <p className="text-[30px] font-extrabold tabular-nums" style={display}>
            1
          </p>
        </div>
        <div
          className="flex flex-col justify-between p-4"
          style={{ border: BORDER, background: C.yellow, minHeight: 110 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.08em]">
              In beoordeling
            </span>
            <Glyph shape="half" color={C.ink} size={16} />
          </div>
          <p className="text-[30px] font-extrabold tabular-nums" style={display}>
            1
          </p>
        </div>
      </div>

      <div style={{ border: BORDER, background: C.white }}>
        {CREDENTIALS.map((c, i) => {
          const m = credMeta(c.status);
          return (
            <div
              key={c.naam}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4"
              style={{ borderTop: i === 0 ? "none" : BORDER_THIN }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center"
                style={{ background: C.paper, border: BORDER_THIN }}
              >
                <Glyph shape={m.shape} color={PRIM[m.prim]} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold">{c.naam}</p>
                <p className="text-[11.5px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <StatusPill status={c.status} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Kicker prim="yellow">Prioriteiten</Kicker>
        <Title>Volgende acties</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          Op volgorde van urgentie — begin bovenaan.
        </p>
      </div>

      <div className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const prim: Prim = warn ? "red" : "blue";
          return (
            <div
              key={a.titel}
              className="flex items-stretch"
              style={{ border: BORDER, background: C.white }}
            >
              <div
                className="flex w-14 shrink-0 flex-col items-center justify-center gap-2"
                style={{
                  background: PRIM[prim],
                  borderRight: BORDER_THIN,
                  color: C.white,
                }}
              >
                <span className="text-[16px] font-extrabold tabular-nums" style={display}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Glyph shape={warn ? "triangle" : "circle"} color={C.white} size={15} />
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: prim === "red" ? C.red : C.blue }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-1 text-[14.5px] font-bold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 self-center px-4 py-2 text-[12px] font-bold uppercase tracking-[0.04em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2440bf] sm:mr-4"
                style={{ border: BORDER_THIN, color: C.ink }}
              >
                {a.cta}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 p-4" style={{ border: BORDER, background: C.yellow }}>
        <Glyph shape="circle" color={C.ink} size={20} />
        <p className="text-[12.5px] font-medium">
          Verder is alles bijgewerkt. Nieuwe acties verschijnen automatisch op deze plek.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusMeta2: Record<string, { prim: Prim; shape: Shape }> = {
    Betaald: { prim: "blue", shape: "circle" },
    Openstaand: { prim: "red", shape: "triangle" },
    Concept: { prim: "yellow", shape: "half" },
  };
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker prim="blue">Financiën</Kicker>
          <Title>Facturen</Title>
        </div>
        <button
          className="inline-flex shrink-0 items-center gap-2 px-4 py-2.5 text-[12.5px] font-bold uppercase tracking-[0.04em] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2440bf]"
          style={{ background: C.ink, border: BORDER_THIN }}
        >
          <Glyph shape="square" color={C.yellow} size={13} /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-5" style={{ border: BORDER, background: C.blue, color: C.white }}>
          <div className="flex items-center justify-between">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.1em]">Ontvangen</p>
            <Glyph shape="circle" color={C.white} size={16} />
          </div>
          <p className="mt-2 text-[24px] font-extrabold tabular-nums" style={display}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </div>
        <div className="p-5" style={{ border: BORDER, background: C.red, color: C.white }}>
          <div className="flex items-center justify-between">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.1em]">Openstaand</p>
            <Glyph shape="triangle" color={C.white} size={16} />
          </div>
          <p className="mt-2 text-[24px] font-extrabold tabular-nums" style={display}>
            € {open.toLocaleString("nl-NL")}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto" style={{ border: BORDER, background: C.white }}>
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
              style={{ borderBottom: BORDER }}
            >
              <th className="p-4">Nummer</th>
              <th className="p-4">Klant</th>
              <th className="hidden p-4 sm:table-cell">Datum</th>
              <th className="p-4 text-right">Bedrag</th>
              <th className="p-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => {
              const m = statusMeta2[f.status] ?? statusMeta2.Concept!;
              return (
                <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : BORDER_THIN }}>
                  <td className="p-4 text-[12px] font-bold tabular-nums">{f.nr}</td>
                  <td className="p-4 text-[13px] font-semibold">{f.klant}</td>
                  <td
                    className="hidden p-4 text-[12px] tabular-nums sm:table-cell"
                    style={{ color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="p-4 text-right text-[13px] font-extrabold tabular-nums"
                    style={display}
                  >
                    {f.bedrag}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Glyph shape={m.shape} color={PRIM[m.prim]} size={14} />
                      <span className="text-[11.5px] font-bold">{f.status}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
