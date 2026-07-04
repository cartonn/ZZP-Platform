"use client";

// Concept 63 — "Strip" · graphic-novel / pop-art. Dikke zwarte inktcontouren, Ben-Day halftone-
// stippen als arcering (CSS radial-gradient), comic-panelen met dikke randen en harde offset-schaduw,
// tekstballonnen voor tips en matching-redenen, en "POW"-achtige starburst-accentlabels (met smaak,
// professioneel). Onderscheidend van Riso (duotone drukwerk) en Memphis: dit is expliciet comic/
// pop-art met inktlijn + halftone + panelen.
// Palet: paper #f7f1e1, ink #141210, rood #e5352b, geel #ffcf33, blauw #2b6cff.
// Fonts: --font-lab-bricolage (display, vet) + --font-lab-space (body).

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
  paper: "#f7f1e1",
  paperAlt: "#efe6cf",
  ink: "#141210",
  white: "#ffffff",
  red: "#e5352b",
  yellow: "#ffcf33",
  blue: "#2b6cff",
  green: "#1fa463",
  muted: "#514b3d",
  faint: "#867e6b",
};

const display = { fontFamily: "var(--font-lab-bricolage)" };
const body = { fontFamily: "var(--font-lab-space)" };

const INK3 = `3px solid ${C.ink}`;
const INK2 = `2px solid ${C.ink}`;
const SHADOW = `4px 4px 0 ${C.ink}`;
const SHADOW_SM = `3px 3px 0 ${C.ink}`;

type Pop = "red" | "yellow" | "blue" | "green";
const POP: Record<Pop, string> = { red: C.red, yellow: C.yellow, blue: C.blue, green: C.green };

// Ben-Day halftone-arcering als achtergrond.
function halftone(color: string, size = 8): React.CSSProperties {
  return {
    backgroundImage: `radial-gradient(${color} 1.3px, transparent 1.6px)`,
    backgroundSize: `${size}px ${size}px`,
  };
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

function credMeta(s: CredStatus): { label: string; pop: Pop; glyph: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", pop: "green", glyph: "✓" };
    case "SUBMITTED":
      return { label: "In beoordeling", pop: "blue", glyph: "◷" };
    case "EXPIRING":
      return { label: "Verloopt bijna", pop: "yellow", glyph: "!" };
    case "REJECTED":
      return { label: "Afgewezen", pop: "red", glyph: "✕" };
  }
}

/* ---------- Primitieven ---------- */

// Starburst "POW"-label.
function Burst({
  children,
  pop = "yellow",
  size = 60,
}: {
  children: React.ReactNode;
  pop?: Pop;
  size?: number;
}) {
  const pts = Array.from({ length: 24 })
    .map((_, i) => {
      const ang = (i / 24) * Math.PI * 2;
      const r = i % 2 === 0 ? 50 : 38;
      const x = 50 + Math.cos(ang) * r;
      const y = 50 + Math.sin(ang) * r;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="absolute inset-0"
        aria-hidden="true"
      >
        <polygon
          points={pts}
          fill={POP[pop]}
          stroke={C.ink}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="relative text-center text-[11px] font-extrabold uppercase leading-none"
        style={{ ...display, color: pop === "yellow" ? C.ink : C.white }}
      >
        {children}
      </span>
    </span>
  );
}

// Tekstballon met staart.
function Bubble({ children, tail = true }: { children: React.ReactNode; tail?: boolean }) {
  return (
    <div className="relative">
      <div
        className="rounded-2xl px-4 py-3 text-[12.5px] font-medium leading-snug"
        style={{ background: C.white, border: INK3, boxShadow: SHADOW_SM, color: C.ink }}
      >
        {children}
      </div>
      {tail && (
        <>
          <span
            className="absolute -bottom-[13px] left-7 h-0 w-0"
            style={{ borderLeft: "13px solid transparent", borderTop: `14px solid ${C.ink}` }}
            aria-hidden
          />
          <span
            className="absolute -bottom-[8px] left-[30px] h-0 w-0"
            style={{ borderLeft: "9px solid transparent", borderTop: `10px solid ${C.white}` }}
            aria-hidden
          />
        </>
      )}
    </div>
  );
}

function Panel({
  children,
  className = "",
  bg = C.white,
}: {
  children: React.ReactNode;
  className?: string;
  bg?: string;
}) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{ background: bg, border: INK3, boxShadow: SHADOW }}
    >
      {children}
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block -rotate-1 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em]"
      style={{ ...display, background: C.yellow, border: INK2, color: C.ink }}
    >
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-2.5 text-[28px] font-extrabold uppercase leading-[0.95] tracking-tight sm:text-[34px]"
      style={{ ...display, color: C.ink, WebkitTextStroke: "0px" }}
    >
      {children}
    </h1>
  );
}

function Chip({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide"
      style={{
        ...display,
        background: POP[m.pop],
        color: m.pop === "yellow" ? C.ink : C.white,
        border: INK2,
      }}
    >
      <span aria-hidden>{m.glyph}</span>
      {m.label}
    </span>
  );
}

/* ---------- Hoofdcomponent ---------- */

const NAV_POP: Record<ScreenKey, Pop> = {
  dashboard: "red",
  marktplaats: "blue",
  opdracht: "yellow",
  verificatie: "green",
  acties: "red",
  facturen: "blue",
  documenten: "yellow",
  berichten: "green",
};

export function Concept63() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, background: C.paper, color: C.ink, ...halftone("rgba(20,18,16,0.06)", 7) }}
    >
      <div className="flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk */}
        <aside
          className="shrink-0 md:w-[236px]"
          style={{ borderRight: INK3, background: C.paperAlt }}
        >
          <div
            className="flex items-center gap-2.5 px-4 py-4"
            style={{ borderBottom: INK3, background: C.red }}
          >
            <span
              className="flex h-9 w-9 items-center justify-center"
              style={{ background: C.white, border: INK2, boxShadow: SHADOW_SM }}
              aria-hidden
            >
              <span className="text-[16px] font-extrabold" style={display}>
                Z!
              </span>
            </span>
            <div className="leading-none text-white">
              <div className="text-[16px] font-extrabold uppercase tracking-tight" style={display}>
                Strip
              </div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em]">
                zzp comics
              </div>
            </div>
          </div>

          <nav
            className="flex flex-row gap-1.5 overflow-x-auto p-2.5 md:flex-col"
            aria-label="Hoofdnavigatie"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              const pop = NAV_POP[s.key];
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="flex shrink-0 items-center gap-2.5 px-3 py-2 text-left text-[13px] font-extrabold uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b6cff] focus-visible:ring-offset-1 md:w-full"
                  style={{
                    ...display,
                    background: on ? C.ink : C.white,
                    color: on ? C.white : C.ink,
                    border: INK2,
                    boxShadow: on ? SHADOW_SM : "none",
                    transform: on ? "translate(-1px,-1px)" : "none",
                  }}
                >
                  <span
                    className="h-3 w-3 shrink-0"
                    style={{ background: POP[pop], border: `1.5px solid ${on ? C.white : C.ink}` }}
                    aria-hidden
                  />
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div className="hidden p-2.5 md:block">
            <div
              className="flex items-center gap-2.5 p-3"
              style={{ background: C.white, border: INK2, boxShadow: SHADOW_SM }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center text-[12px] font-extrabold"
                style={{ ...display, background: C.blue, color: C.white, border: INK2 }}
                aria-hidden
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-extrabold" style={display}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="mt-0.5 inline-block px-1.5 text-[9.5px] font-extrabold uppercase"
                  style={{ ...display, background: C.green, color: C.white }}
                >
                  {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
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
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!loading) return;
    const t = window.setTimeout(() => setLoading(false), 750);
    return () => window.clearTimeout(t);
  }, [loading]);

  const warn = ACTIES[0];
  const pops: Pop[] = ["red", "blue", "green", "yellow"];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Kicker>Overzicht</Kicker>
          <Title>Hoi, {PROFIEL.naam.split(" ")[0]}!</Title>
          <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <div className="hidden sm:block">
          <Burst pop="red" size={78}>
            {KPIS[0]?.value}
            <br />
            match
          </Burst>
        </div>
      </div>

      {/* KPI-panelen */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const pop = pops[i] ?? "red";
          return (
            <div
              key={k.label}
              className="relative overflow-hidden p-3.5"
              style={{ background: C.white, border: INK3, boxShadow: SHADOW_SM, minHeight: 118 }}
            >
              <div
                className="pointer-events-none absolute -right-3 -top-3 h-14 w-14 rounded-full opacity-20"
                style={{ ...halftone(C.ink, 5), background: POP[pop] }}
                aria-hidden
              />
              <p
                className="relative text-[10.5px] font-extrabold uppercase tracking-wide"
                style={{ color: C.muted }}
              >
                {k.label}
              </p>
              <p
                className="relative mt-2 text-[27px] font-extrabold tabular-nums leading-none"
                style={display}
              >
                {k.value}
              </p>
              <p
                className="relative mt-1.5 inline-block px-1.5 py-0.5 text-[10.5px] font-extrabold tabular-nums"
                style={{
                  background: k.up ? C.green : C.yellow,
                  color: k.up ? C.white : C.ink,
                  border: INK2,
                }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </p>
            </div>
          );
        })}
      </div>

      {/* Waarschuwing als tekstballon */}
      {warn && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Bubble>
              <span className="font-extrabold uppercase" style={{ ...display, color: C.red }}>
                Let op!{" "}
              </span>
              {warn.titel}. {warn.detail}
            </Bubble>
          </div>
          <button
            onClick={() => onGo("verificatie")}
            className="shrink-0 px-4 py-2.5 text-[12.5px] font-extrabold uppercase tracking-wide text-white transition-transform hover:translate-x-[-1px] hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b6cff] focus-visible:ring-offset-1"
            style={{ ...display, background: C.red, border: INK3, boxShadow: SHADOW_SM }}
          >
            {warn.cta}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Matches als comic-strook */}
        <section className="lg:col-span-2">
          <div className="mb-2.5 flex items-center gap-2">
            <span className="text-[15px] font-extrabold uppercase" style={display}>
              Beste matches
            </span>
            <span className="h-[3px] flex-1" style={{ background: C.ink }} aria-hidden />
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3" role="status" aria-live="polite">
                <span className="sr-only">Matches worden geladen…</span>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3.5"
                    style={{ background: C.white, border: INK3 }}
                  >
                    <span
                      className="h-11 w-11 shrink-0 animate-pulse"
                      style={{ background: C.paperAlt, border: INK2 }}
                    />
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
              OPDRACHTEN.map((o, i) => {
                const pop = pops[i] ?? "blue";
                return (
                  <button
                    key={o.id}
                    onClick={() => onOpen(o.id)}
                    className="group flex w-full items-center gap-3.5 p-3.5 text-left transition-transform hover:translate-x-[-2px] hover:translate-y-[-2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b6cff] focus-visible:ring-offset-1"
                    style={{ background: C.white, border: INK3, boxShadow: SHADOW_SM }}
                  >
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center text-[15px] font-extrabold tabular-nums"
                      style={{
                        ...display,
                        background: POP[pop],
                        color: pop === "yellow" ? C.ink : C.white,
                        border: INK2,
                      }}
                    >
                      {o.match}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-extrabold" style={display}>
                        {o.titel}
                      </span>
                      <span className="block truncate text-[11.5px]" style={{ color: C.muted }}>
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span
                      className="shrink-0 text-[18px] font-extrabold transition-transform group-hover:translate-x-0.5"
                      style={{ color: C.ink }}
                      aria-hidden
                    >
                      →
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Berichten */}
        <section>
          <div className="mb-2.5 flex items-center gap-2">
            <span className="text-[15px] font-extrabold uppercase" style={display}>
              Berichten
            </span>
            <span className="h-[3px] flex-1" style={{ background: C.ink }} aria-hidden />
          </div>
          <Panel bg={C.yellow}>
            <div className="divide-y-[3px]" style={{ borderColor: C.ink }}>
              {BERICHTEN.map((b, i) => (
                <div
                  key={b.van}
                  className="flex items-center gap-2.5 p-3"
                  style={{ borderTop: i === 0 ? "none" : INK3 }}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center text-[10.5px] font-extrabold"
                    style={{ ...display, background: C.white, border: INK2 }}
                    aria-hidden
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className="flex items-center gap-1.5 truncate text-[12px] font-extrabold"
                      style={display}
                    >
                      {b.van}
                      {b.ongelezen && (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: C.red, border: `1.5px solid ${C.ink}` }}
                          aria-label="ongelezen"
                        />
                      )}
                    </p>
                    <p className="truncate text-[11px]" style={{ color: C.ink }}>
                      {b.preview}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </section>
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
  const pops: Pop[] = ["red", "blue", "green"];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <Kicker>Marktplaats</Kicker>
        <Title>Open opdrachten</Title>
      </div>

      <div
        className="flex items-center gap-2.5 p-3"
        style={{ background: C.white, border: INK3, boxShadow: SHADOW_SM }}
      >
        <span className="text-[15px] font-extrabold" style={{ color: C.red }} aria-hidden>
          ⌕
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] font-medium outline-none placeholder:text-[#867e6b]"
          style={{ color: C.ink }}
        />
        <span
          className="shrink-0 text-[11.5px] font-extrabold tabular-nums"
          style={{ color: C.faint }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div
          className="p-12 text-center"
          style={{ background: C.white, border: INK3, boxShadow: SHADOW }}
          role="status"
        >
          <div className="mx-auto w-fit">
            <Burst pop="yellow" size={72}>
              Oeps!
            </Burst>
          </div>
          <p className="mt-4 text-[18px] font-extrabold uppercase" style={display}>
            Niets gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Geen opdracht past bij &quot;{q}&quot;. Verbreed je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 px-4 py-2.5 text-[12.5px] font-extrabold uppercase tracking-wide text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b6cff] focus-visible:ring-offset-1"
            style={{ ...display, background: C.blue, border: INK3, boxShadow: SHADOW_SM }}
          >
            Zoekopdracht wissen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o, i) => {
            const on = o.id === activeId;
            const pop = pops[i % 3] ?? "red";
            return (
              <button
                key={o.id}
                onClick={() => {
                  onSelect(o.id);
                  onOpen(o.id);
                }}
                aria-pressed={on}
                className="group flex flex-col p-4 text-left transition-transform hover:translate-x-[-2px] hover:translate-y-[-2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b6cff] focus-visible:ring-offset-1"
                style={{
                  background: C.white,
                  border: INK3,
                  boxShadow: on ? `6px 6px 0 ${C.ink}` : SHADOW,
                  transform: on ? "translate(-2px,-2px)" : undefined,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center text-[15px] font-extrabold tabular-nums"
                    style={{
                      ...display,
                      background: POP[pop],
                      color: pop === "yellow" ? C.ink : C.white,
                      border: INK2,
                    }}
                  >
                    {o.match}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase" style={{ color: C.faint }}>
                    {o.id}
                  </span>
                </div>
                <p
                  className="mt-2.5 text-[15px] font-extrabold uppercase leading-tight"
                  style={display}
                >
                  {o.titel}
                </p>
                <p className="mt-1 text-[11.5px]" style={{ color: C.muted }}>
                  {o.opdrachtgever} · {o.plaats} · {o.uren}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 text-[10px] font-extrabold uppercase"
                      style={{
                        background: C.paperAlt,
                        border: `1.5px solid ${C.ink}`,
                        color: C.ink,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
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
    <div className="mx-auto max-w-4xl space-y-5">
      <Panel>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Kicker>{opdracht.id}</Kicker>
            <Title>{opdracht.titel}</Title>
            <p className="mt-2 text-[12.5px] font-medium" style={{ color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 text-[10.5px] font-extrabold uppercase"
                  style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <Burst pop={opdracht.match >= 90 ? "red" : "blue"} size={86}>
            {opdracht.match}
            <br />
            match
          </Burst>
        </div>
        <div className="p-5 pt-0">
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="flex w-full items-center justify-center gap-2 px-5 py-3 text-[13px] font-extrabold uppercase tracking-wide text-white transition-transform hover:translate-x-[-1px] hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b6cff] focus-visible:ring-offset-1 disabled:translate-x-0 disabled:translate-y-0"
            style={{
              ...display,
              background: state === "sent" ? C.green : C.red,
              border: INK3,
              boxShadow: SHADOW_SM,
            }}
          >
            {state === "idle" && "Reageer op opdracht →"}
            {state === "sending" && "Versturen…"}
            {state === "sent" && "✓ Reactie verstuurd!"}
          </button>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m, i) => (
          <div
            key={m.l}
            className="p-3.5"
            style={{
              background: i === 3 ? C.yellow : C.white,
              border: INK3,
              boxShadow: SHADOW_SM,
            }}
          >
            <p
              className="text-[10px] font-extrabold uppercase tracking-wide"
              style={{ color: C.muted }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[17px] font-extrabold tabular-nums" style={display}>
              {m.v}
            </p>
          </div>
        ))}
      </div>

      {/* Verklaarbare matching als tekstballonnen */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[15px] font-extrabold uppercase" style={display}>
            Waarom deze match?
          </span>
          <span className="h-[3px] flex-1" style={{ background: C.ink }} aria-hidden />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span
              className="inline-block px-2 py-0.5 text-[11px] font-extrabold uppercase text-white"
              style={{ ...display, background: C.green, border: INK2 }}
            >
              Pluspunten
            </span>
            <div className="mt-3 space-y-4">
              {opdracht.redenen.plus.map((r) => (
                <Bubble key={r}>
                  <span className="mr-1.5 font-extrabold" style={{ color: C.green }} aria-hidden>
                    ✓
                  </span>
                  {r}
                </Bubble>
              ))}
            </div>
          </div>
          <div>
            <span
              className="inline-block px-2 py-0.5 text-[11px] font-extrabold uppercase"
              style={{ ...display, background: C.yellow, border: INK2, color: C.ink }}
            >
              Aandachtspunten
            </span>
            <div className="mt-3 space-y-4">
              {opdracht.redenen.min.map((r) => (
                <Bubble key={r}>
                  <span className="mr-1.5 font-extrabold" style={{ color: C.red }} aria-hidden>
                    !
                  </span>
                  {r}
                </Bubble>
              ))}
            </div>
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
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <Kicker>Verificatie</Kicker>
        <Title>Certificaten</Title>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {[
          { l: "Geverifieerd", v: `${verified}/${total}`, pop: "green" as Pop },
          { l: "Verloopt bijna", v: "1", pop: "red" as Pop },
          { l: "In beoordeling", v: "1", pop: "blue" as Pop },
        ].map((s) => (
          <div
            key={s.l}
            className="p-4"
            style={{
              background: POP[s.pop],
              color: s.pop === "yellow" ? C.ink : C.white,
              border: INK3,
              boxShadow: SHADOW_SM,
            }}
          >
            <p className="text-[10.5px] font-extrabold uppercase tracking-wide">{s.l}</p>
            <p className="mt-2 text-[28px] font-extrabold tabular-nums" style={display}>
              {s.v}
            </p>
          </div>
        ))}
      </div>

      <Panel>
        <div>
          {CREDENTIALS.map((c, i) => {
            const m = credMeta(c.status);
            return (
              <div
                key={c.naam}
                className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : INK3 }}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-[16px] font-extrabold"
                  style={{
                    ...display,
                    background: POP[m.pop],
                    color: m.pop === "yellow" ? C.ink : C.white,
                    border: INK2,
                  }}
                  aria-hidden
                >
                  {m.glyph}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-extrabold" style={display}>
                    {c.naam}
                  </p>
                  <p className="text-[11.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <Chip status={c.status} />
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Kicker>Prioriteiten</Kicker>
        <Title>Volgende acties</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          Op volgorde van urgentie — begin bovenaan.
        </p>
      </div>

      <div className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const pop: Pop = warn ? "red" : "blue";
          return (
            <div
              key={a.titel}
              className="flex items-stretch"
              style={{ background: C.white, border: INK3, boxShadow: SHADOW_SM }}
            >
              <div
                className="flex w-14 shrink-0 flex-col items-center justify-center gap-1"
                style={{ background: POP[pop], color: C.white, borderRight: INK3 }}
              >
                <span className="text-[18px] font-extrabold tabular-nums" style={display}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[15px] font-extrabold" aria-hidden>
                  {warn ? "!" : "★"}
                </span>
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="inline-block px-1.5 text-[9.5px] font-extrabold uppercase"
                  style={{
                    ...display,
                    background: warn ? C.yellow : C.paperAlt,
                    border: `1.5px solid ${C.ink}`,
                  }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-1.5 text-[14.5px] font-extrabold" style={display}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 self-center px-4 py-2 text-[12px] font-extrabold uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b6cff] focus-visible:ring-offset-1 sm:mr-4"
                style={{ ...display, background: C.ink, color: C.white, border: INK2 }}
              >
                {a.cta}
              </button>
            </div>
          );
        })}
      </div>

      <div
        className="flex items-center gap-4 p-4"
        style={{ background: C.green, border: INK3, boxShadow: SHADOW_SM }}
      >
        <span className="text-[24px] font-extrabold text-white" aria-hidden>
          ✓
        </span>
        <p className="text-[12.5px] font-medium text-white">
          Verder is alles bijgewerkt. Nieuwe acties verschijnen automatisch op deze plek.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusPop: Record<string, Pop> = {
    Betaald: "green",
    Openstaand: "red",
    Concept: "yellow",
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
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Financiën</Kicker>
          <Title>Facturen</Title>
        </div>
        <button
          className="inline-flex shrink-0 items-center gap-2 px-4 py-2.5 text-[12.5px] font-extrabold uppercase tracking-wide text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b6cff] focus-visible:ring-offset-1"
          style={{ ...display, background: C.blue, border: INK3, boxShadow: SHADOW_SM }}
        >
          + Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <div
          className="p-5"
          style={{ background: C.green, color: C.white, border: INK3, boxShadow: SHADOW_SM }}
        >
          <p className="text-[10.5px] font-extrabold uppercase tracking-wide">Ontvangen</p>
          <p className="mt-2 text-[24px] font-extrabold tabular-nums" style={display}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </div>
        <div
          className="p-5"
          style={{ background: C.red, color: C.white, border: INK3, boxShadow: SHADOW_SM }}
        >
          <p className="text-[10.5px] font-extrabold uppercase tracking-wide">Openstaand</p>
          <p className="mt-2 text-[24px] font-extrabold tabular-nums" style={display}>
            € {open.toLocaleString("nl-NL")}
          </p>
        </div>
      </div>

      <div
        className="overflow-x-auto"
        style={{ border: INK3, boxShadow: SHADOW, background: C.white }}
      >
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[10.5px] font-extrabold uppercase tracking-wide"
              style={{ ...display, background: C.ink, color: C.white }}
            >
              <th className="p-3.5">Nummer</th>
              <th className="p-3.5">Klant</th>
              <th className="hidden p-3.5 sm:table-cell">Datum</th>
              <th className="p-3.5 text-right">Bedrag</th>
              <th className="p-3.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => {
              const pop = statusPop[f.status] ?? "yellow";
              return (
                <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : INK2 }}>
                  <td className="p-3.5 text-[12px] font-extrabold tabular-nums" style={display}>
                    {f.nr}
                  </td>
                  <td className="p-3.5 text-[13px] font-semibold">{f.klant}</td>
                  <td
                    className="hidden p-3.5 text-[12px] tabular-nums sm:table-cell"
                    style={{ color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="p-3.5 text-right text-[13px] font-extrabold tabular-nums"
                    style={display}
                  >
                    {f.bedrag}
                  </td>
                  <td className="p-3.5">
                    <div className="flex justify-end">
                      <span
                        className="px-2 py-0.5 text-[10.5px] font-extrabold uppercase"
                        style={{
                          ...display,
                          background: POP[pop],
                          color: pop === "yellow" ? C.ink : C.white,
                          border: `1.5px solid ${C.ink}`,
                        }}
                      >
                        {f.status}
                      </span>
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
