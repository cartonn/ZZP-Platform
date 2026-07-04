"use client";

// Concept 62 — "Neonzon" · 80s retrowave / synthwave-zonsondergang. Diep-paarse nacht met een
// magenta→oranje zonsondergang-verloop, een neon perspectief-horizongrid in de header/hero,
// chroom/neon-glow op koppen en een subtiele scanline-hint. De content-panelen blijven crisp en
// leesbaar: donkere glazige kaarten met neon-hairlines en hoog-contrast tekst.
// Onderscheidend van cyber-grid en mesh-gloed: dit is expliciet retrowave-zonsondergang met horizon
// en chroomtype. Palet: bg #180d2e, ink #ffe6f7, magenta #ff2d95, oranje #ff8a3d, cyaan #22d3ee.
// Fonts: --font-lab-space (display) + --font-lab-geist-mono (mono).

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
  bg: "#180d2e",
  bgDeep: "#0f0821",
  panel: "rgba(38,20,66,0.72)",
  panelSolid: "#241246",
  ink: "#ffe6f7",
  sub: "#c6a8e6",
  faint: "#8f76bd",
  magenta: "#ff2d95",
  orange: "#ff8a3d",
  cyan: "#22d3ee",
  green: "#34e5b0",
  line: "rgba(255,45,149,0.28)",
  lineCyan: "rgba(34,211,238,0.32)",
};

const display = { fontFamily: "var(--font-lab-space)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

type Neon = "magenta" | "orange" | "cyan" | "green";
const NEON: Record<Neon, string> = {
  magenta: C.magenta,
  orange: C.orange,
  cyan: C.cyan,
  green: C.green,
};

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

function credMeta(s: CredStatus): { label: string; neon: Neon; glyph: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", neon: "green", glyph: "✓" };
    case "SUBMITTED":
      return { label: "In beoordeling", neon: "cyan", glyph: "◷" };
    case "EXPIRING":
      return { label: "Verloopt bijna", neon: "orange", glyph: "!" };
    case "REJECTED":
      return { label: "Afgewezen", neon: "magenta", glyph: "✕" };
  }
}

/* ---------- Primitieven ---------- */

// Retrowave-zon met horizontale slats + perspectief-grid — de dragende hero-visual.
function SunGrid() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="nz-sun" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffd23f" />
            <stop offset="45%" stopColor="#ff8a3d" />
            <stop offset="100%" stopColor="#ff2d95" />
          </linearGradient>
          <linearGradient id="nz-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a1352" stopOpacity="0" />
            <stop offset="100%" stopColor="#ff2d95" stopOpacity="0.14" />
          </linearGradient>
          <clipPath id="nz-clip">
            <circle cx="200" cy="126" r="62" />
          </clipPath>
        </defs>
        <rect x="0" y="0" width="400" height="200" fill="url(#nz-sky)" />
        <circle cx="200" cy="126" r="62" fill="url(#nz-sun)" />
        <g clipPath="url(#nz-clip)">
          {[74, 92, 108, 122, 134, 144].map((y, i) => (
            <rect key={y} x="138" y={y} width="124" height={2 + i} fill={C.bg} opacity="0.9" />
          ))}
        </g>
        {/* perspectief-grid onder de horizon */}
        <g stroke={C.magenta} strokeWidth="0.7" opacity="0.42">
          {Array.from({ length: 11 }).map((_, i) => {
            const x = (i / 10) * 400;
            return <line key={`v${i}`} x1={200} y1={150} x2={x * 2 - 200} y2={200} />;
          })}
          {[150, 158, 168, 181, 197].map((y) => (
            <line key={`h${y}`} x1="0" y1={y} x2="400" y2={y} />
          ))}
        </g>
      </svg>
      {/* scanline-hint */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 1px, transparent 1px, transparent 3px)",
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
}

function Chrome({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="bg-clip-text text-[24px] font-bold uppercase leading-tight tracking-[0.02em] text-transparent sm:text-[28px]"
      style={{
        ...display,
        backgroundImage: "linear-gradient(180deg,#ffffff 0%,#ffd6f2 42%,#ff8a3d 100%)",
        WebkitBackgroundClip: "text",
        textShadow: "0 0 18px rgba(255,45,149,0.35)",
      }}
    >
      {children}
    </h1>
  );
}

function Kicker({ children, neon = "cyan" }: { children: React.ReactNode; neon?: Neon }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em]"
      style={{ ...mono, color: NEON[neon], textShadow: `0 0 10px ${NEON[neon]}55` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: NEON[neon] }} aria-hidden />
      {children}
    </span>
  );
}

function Panel({
  children,
  neon = "magenta",
  className = "",
}: {
  children: React.ReactNode;
  neon?: Neon;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border p-4 backdrop-blur-sm ${className}`}
      style={{
        background: C.panel,
        borderColor: `${NEON[neon]}44`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px ${NEON[neon]}12`,
      }}
    >
      {children}
    </div>
  );
}

function Chip({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const col = NEON[m.neon];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
      style={{ borderColor: `${col}80`, color: col, background: `${col}18` }}
    >
      <span aria-hidden>{m.glyph}</span>
      {m.label}
    </span>
  );
}

function Bars({ data, neon }: { data: number[]; neon: Neon }) {
  const max = Math.max(...data) || 1;
  return (
    <div className="flex h-7 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="w-[4px] rounded-sm"
          style={{
            height: `${Math.max(12, (v / max) * 100)}%`,
            background: NEON[neon],
            opacity: 0.35 + (i / data.length) * 0.65,
            boxShadow: `0 0 6px ${NEON[neon]}66`,
          }}
        />
      ))}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept62() {
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
      style={{
        ...display,
        background: `radial-gradient(120% 80% at 50% 0%, #3a1560 0%, ${C.bg} 46%, ${C.bgDeep} 100%)`,
        color: C.ink,
      }}
    >
      <div className="flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk */}
        <aside
          className="shrink-0 border-b md:w-[228px] md:border-b-0 md:border-r"
          style={{ borderColor: C.line, background: "rgba(15,8,33,0.6)" }}
        >
          <div className="flex items-center gap-2.5 px-4 py-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: "linear-gradient(180deg,#ff8a3d,#ff2d95)",
                boxShadow: "0 0 14px rgba(255,45,149,0.6)",
              }}
              aria-hidden
            >
              <svg width={16} height={16} viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="6" fill="#fff" opacity="0.92" />
                <rect x="2" y="7" width="12" height="1.4" fill="#ff2d95" />
                <rect x="3" y="9.5" width="10" height="1.4" fill="#ff2d95" />
              </svg>
            </span>
            <div className="leading-none">
              <div className="text-[15px] font-bold uppercase tracking-[0.08em]">Neonzon</div>
              <div className="mt-1 text-[9.5px]" style={{ ...mono, color: C.faint }}>
                sunset-os
              </div>
            </div>
          </div>

          <nav
            className="flex flex-row gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-4"
            aria-label="Hoofdnavigatie"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] font-medium uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee] md:w-full"
                  style={{
                    background: on ? "rgba(255,45,149,0.16)" : "transparent",
                    color: on ? C.ink : C.sub,
                    boxShadow: on ? `inset 2px 0 0 ${C.magenta}` : undefined,
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: on ? C.magenta : "transparent",
                      border: on ? "none" : `1px solid ${C.faint}`,
                      boxShadow: on ? `0 0 8px ${C.magenta}` : undefined,
                    }}
                    aria-hidden
                  />
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div
            className="hidden items-center gap-2.5 border-t px-4 py-3.5 md:flex"
            style={{ borderColor: C.line }}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
              style={{
                background: "rgba(34,211,238,0.16)",
                color: C.cyan,
                border: `1px solid ${C.lineCyan}`,
              }}
              aria-hidden
            >
              {PROFIEL.initialen}
            </span>
            <div className="min-w-0">
              <div className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</div>
              <div className="flex items-center gap-1 text-[10.5px]" style={{ color: C.green }}>
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: C.green, boxShadow: `0 0 6px ${C.green}` }}
                />
                {PROFIEL.trust}
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-5">
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
  const neons: Neon[] = ["magenta", "cyan", "orange", "green"];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Hero met zon-grid */}
      <div
        className="relative overflow-hidden rounded-2xl border p-6"
        style={{ borderColor: C.line, minHeight: 168 }}
      >
        <SunGrid />
        <div className="relative">
          <Kicker neon="cyan">Overzicht · {PROFIEL.plaats}</Kicker>
          <div className="mt-2">
            <Chrome>Goedendag, {PROFIEL.naam.split(" ")[0]}</Chrome>
          </div>
          <p className="mt-2 max-w-md text-[13px]" style={{ color: C.sub }}>
            {PROFIEL.rol}. Je matchprofiel gloeit vanavond op {KPIS[0]?.value}.
          </p>
        </div>
      </div>

      {/* KPI's */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const neon = neons[i] ?? "magenta";
          return (
            <Panel key={k.label} neon={neon}>
              <p
                className="text-[10.5px] font-medium uppercase tracking-wide"
                style={{ color: C.faint }}
              >
                {k.label}
              </p>
              <div className="mt-2 flex items-end justify-between gap-2">
                <p className="text-[23px] font-bold tabular-nums leading-none" style={mono}>
                  {k.value}
                </p>
                <Bars data={k.spark} neon={neon} />
              </div>
              <p
                className="mt-2 text-[11px] font-semibold tabular-nums"
                style={{ color: k.up ? C.green : C.orange }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </p>
            </Panel>
          );
        })}
      </div>

      {/* Waarschuwing */}
      {warn && (
        <div
          className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
          style={{ borderColor: `${C.orange}66`, background: "rgba(255,138,61,0.12)" }}
          role="alert"
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[15px] font-bold"
            style={{ background: C.orange, color: C.bgDeep, boxShadow: `0 0 12px ${C.orange}77` }}
            aria-hidden
          >
            !
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold" style={{ color: C.orange }}>
              {warn.titel}
            </p>
            <p className="text-[12px]" style={{ color: C.sub }}>
              {warn.detail}
            </p>
          </div>
          <button
            onClick={() => onGo("verificatie")}
            className="shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee]"
            style={{ background: C.orange, color: C.bgDeep }}
          >
            {warn.cta}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <Kicker neon="magenta">Beste matches</Kicker>
          <div className="mt-3 space-y-2.5">
            {loading ? (
              <div className="space-y-2.5" role="status" aria-live="polite">
                <span className="sr-only">Matches worden geladen…</span>
                {[0, 1, 2].map((i) => (
                  <Panel key={i} neon="magenta">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-11 w-11 shrink-0 animate-pulse rounded-lg"
                        style={{ background: "rgba(255,255,255,0.08)" }}
                      />
                      <div className="flex-1 space-y-2">
                        <span
                          className="block h-3 w-2/3 animate-pulse rounded"
                          style={{ background: "rgba(255,255,255,0.08)" }}
                        />
                        <span
                          className="block h-2.5 w-1/2 animate-pulse rounded"
                          style={{ background: "rgba(255,255,255,0.08)" }}
                        />
                      </div>
                    </div>
                  </Panel>
                ))}
              </div>
            ) : (
              OPDRACHTEN.map((o) => (
                <button
                  key={o.id}
                  onClick={() => onOpen(o.id)}
                  className="group block w-full rounded-xl border p-4 text-left backdrop-blur-sm transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee]"
                  style={{
                    background: C.panel,
                    borderColor: `${C.magenta}3a`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold tabular-nums"
                      style={{
                        ...mono,
                        background: "linear-gradient(180deg,#ff8a3d,#ff2d95)",
                        color: "#fff",
                        boxShadow: `0 0 12px ${C.magenta}55`,
                      }}
                    >
                      {o.match}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold">{o.titel}</span>
                      <span className="block truncate text-[11.5px]" style={{ color: C.sub }}>
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span
                      className="shrink-0 text-[15px] transition-transform group-hover:translate-x-0.5"
                      style={{ color: C.cyan }}
                      aria-hidden
                    >
                      →
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section>
          <Kicker neon="cyan">Berichten</Kicker>
          <Panel neon="cyan" className="mt-3">
            <ul className="space-y-1">
              {BERICHTEN.map((b) => (
                <li key={b.van} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold"
                    style={{ background: "rgba(34,211,238,0.14)", color: C.cyan }}
                    aria-hidden
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-[12px] font-semibold">
                      {b.van}
                      {b.ongelezen && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: C.magenta, boxShadow: `0 0 6px ${C.magenta}` }}
                          aria-label="ongelezen"
                        />
                      )}
                    </p>
                    <p className="truncate text-[11px]" style={{ color: C.sub }}>
                      {b.preview}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px]" style={{ ...mono, color: C.faint }}>
                    {b.tijd}
                  </span>
                </li>
              ))}
            </ul>
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
  const sel = filtered.find((o) => o.id === activeId) ?? filtered[0];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <Kicker neon="magenta">Marktplaats</Kicker>
        <div className="mt-2">
          <Chrome>Open opdrachten</Chrome>
        </div>
      </div>

      <div
        className="flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5"
        style={{ background: C.panel, borderColor: C.line }}
      >
        <span style={{ color: C.magenta }} aria-hidden>
          ⌕
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#8f76bd]"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ ...mono, color: C.faint }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-xl border p-12 text-center"
          style={{ background: C.panel, borderColor: C.line }}
          role="status"
        >
          <span
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-[20px]"
            style={{ border: `1px solid ${C.line}`, color: C.magenta }}
            aria-hidden
          >
            ⌕
          </span>
          <p className="mt-3 text-[15px] font-semibold">Niets gevonden</p>
          <p className="mx-auto mt-1 max-w-xs text-[12.5px]" style={{ color: C.sub }}>
            Geen opdracht past bij &quot;{q}&quot;. Verbreed je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-4 rounded-lg px-4 py-2 text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee]"
            style={{ background: C.magenta, color: "#fff" }}
          >
            Zoekopdracht wissen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-3">
            {filtered.map((o) => {
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  className="group block w-full rounded-xl border p-4 text-left backdrop-blur-sm transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee]"
                  style={{
                    background: C.panel,
                    borderColor: on ? `${C.magenta}aa` : `${C.magenta}33`,
                    boxShadow: on ? `0 0 16px ${C.magenta}33` : undefined,
                  }}
                >
                  <div className="flex items-start gap-3.5">
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-[14px] font-bold tabular-nums"
                      style={{
                        ...mono,
                        background: "linear-gradient(180deg,#ff8a3d,#ff2d95)",
                        color: "#fff",
                      }}
                    >
                      {o.match}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px]" style={{ ...mono, color: C.faint }}>
                        {o.id}
                      </span>
                      <p className="truncate text-[14.5px] font-semibold">{o.titel}</p>
                      <p className="mt-0.5 truncate text-[11.5px]" style={{ color: C.sub }}>
                        {o.opdrachtgever} · {o.plaats} · {o.uren}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full border px-2 py-0.5 text-[10.5px] font-medium"
                            style={{ borderColor: C.lineCyan, color: C.cyan }}
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
            <aside className="h-fit lg:sticky lg:top-4">
              <Panel neon="cyan">
                <span className="text-[10px]" style={{ ...mono, color: C.faint }}>
                  {sel.id}
                </span>
                <p className="mt-1 text-[16px] font-semibold leading-snug">{sel.titel}</p>
                <p className="mt-1 text-[12px]" style={{ color: C.sub }}>
                  {sel.opdrachtgever} · {sel.plaats}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-[12.5px]">
                  {[
                    { l: "Tarief", v: sel.tarief },
                    { l: "Omvang", v: sel.uren },
                    { l: "Start", v: sel.start },
                    { l: "Match", v: `${sel.match}%` },
                  ].map((m) => (
                    <div
                      key={m.l}
                      className="rounded-lg border p-2.5"
                      style={{ borderColor: C.line, background: "rgba(255,45,149,0.06)" }}
                    >
                      <dt
                        className="text-[10px] uppercase tracking-wide"
                        style={{ color: C.faint }}
                      >
                        {m.l}
                      </dt>
                      <dd className="mt-0.5 font-bold tabular-nums" style={mono}>
                        {m.v}
                      </dd>
                    </div>
                  ))}
                </dl>
                <button
                  onClick={() => onOpen(sel.id)}
                  className="mt-4 w-full rounded-lg px-4 py-2.5 text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee]"
                  style={{
                    background: "linear-gradient(90deg,#ff8a3d,#ff2d95)",
                    color: "#fff",
                    boxShadow: `0 0 16px ${C.magenta}44`,
                  }}
                >
                  Open opdracht →
                </button>
              </Panel>
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
    <div className="mx-auto max-w-4xl space-y-5">
      <Panel neon="magenta">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Kicker neon="cyan">{opdracht.id}</Kicker>
            <div className="mt-2">
              <Chrome>{opdracht.titel}</Chrome>
            </div>
            <p className="mt-1.5 text-[13px]" style={{ color: C.sub }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border px-2.5 py-1 text-[11px] font-medium"
                  style={{ borderColor: C.lineCyan, color: C.cyan }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <span
            className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(180deg,#ffd23f,#ff8a3d,#ff2d95)",
              color: "#1a0730",
              boxShadow: `0 0 24px ${C.magenta}55`,
            }}
          >
            <span className="text-[28px] font-bold tabular-nums leading-none" style={mono}>
              {opdracht.match}
            </span>
            <span className="text-[9.5px] font-bold uppercase tracking-widest">match</span>
          </span>
        </div>
        <button
          onClick={react}
          disabled={state !== "idle"}
          aria-live="polite"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee]"
          style={{
            background:
              state === "sent"
                ? "linear-gradient(90deg,#34e5b0,#22d3ee)"
                : "linear-gradient(90deg,#ff8a3d,#ff2d95)",
            color: state === "sent" ? C.bgDeep : "#fff",
            boxShadow: `0 0 18px ${state === "sent" ? C.green : C.magenta}55`,
          }}
        >
          {state === "idle" && "Reageer op opdracht →"}
          {state === "sending" && "Versturen…"}
          {state === "sent" && "✓ Reactie verstuurd"}
        </button>
      </Panel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m, i) => (
          <Panel
            key={m.l}
            neon={(["magenta", "cyan", "orange", "green"] as Neon[])[i] ?? "magenta"}
          >
            <p className="text-[10px] uppercase tracking-wide" style={{ color: C.faint }}>
              {m.l}
            </p>
            <p className="mt-1.5 text-[17px] font-bold tabular-nums" style={mono}>
              {m.v}
            </p>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Panel neon="green">
          <p
            className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.green }}
          >
            <span aria-hidden>✓</span> Waarom deze match
          </p>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2.5 text-[13px]">
                <span
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ background: C.green, color: C.bgDeep }}
                  aria-hidden
                >
                  ✓
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel neon="orange">
          <p
            className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.orange }}
          >
            <span aria-hidden>!</span> Aandachtspunten
          </p>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li key={r} className="flex items-start gap-2.5 text-[13px]" style={{ color: C.sub }}>
                <span
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ background: C.orange, color: C.bgDeep }}
                  aria-hidden
                >
                  !
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Panel>
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
        <Kicker neon="green">Verificatie</Kicker>
        <div className="mt-2">
          <Chrome>Certificaten</Chrome>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { l: "Geverifieerd", v: `${verified}/${total}`, neon: "green" as Neon },
          { l: "Verloopt bijna", v: "1", neon: "orange" as Neon },
          { l: "In beoordeling", v: "1", neon: "cyan" as Neon },
        ].map((s) => (
          <Panel key={s.l} neon={s.neon}>
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase tracking-wide" style={{ color: C.faint }}>
                {s.l}
              </span>
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: NEON[s.neon], boxShadow: `0 0 8px ${NEON[s.neon]}` }}
                aria-hidden
              />
            </div>
            <p className="mt-2 text-[26px] font-bold tabular-nums" style={mono}>
              {s.v}
            </p>
          </Panel>
        ))}
      </div>

      <Panel neon="magenta">
        <div className="divide-y" style={{ borderColor: C.line }}>
          {CREDENTIALS.map((c, i) => {
            const m = credMeta(c.status);
            return (
              <div
                key={c.naam}
                className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[15px] font-bold"
                  style={{ background: `${NEON[m.neon]}20`, color: NEON[m.neon] }}
                  aria-hidden
                >
                  {m.glyph}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold">{c.naam}</p>
                  <p className="text-[11.5px]" style={{ color: C.sub }}>
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
        <Kicker neon="orange">Prioriteiten</Kicker>
        <div className="mt-2">
          <Chrome>Volgende acties</Chrome>
        </div>
        <p className="mt-2 text-[13px]" style={{ color: C.sub }}>
          Op volgorde van urgentie — begin bovenaan.
        </p>
      </div>

      <div className="space-y-3">
        {ACTIES.map((a, i) => {
          const neon: Neon = a.urgentie === "warning" ? "orange" : "cyan";
          return (
            <div
              key={a.titel}
              className="flex items-stretch overflow-hidden rounded-xl border backdrop-blur-sm"
              style={{ background: C.panel, borderColor: `${NEON[neon]}44` }}
            >
              <div
                className="flex w-12 shrink-0 flex-col items-center justify-center gap-1"
                style={{ background: `${NEON[neon]}1c` }}
              >
                <span
                  className="text-[15px] font-bold tabular-nums"
                  style={{ ...mono, color: NEON[neon] }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: NEON[neon] }}
                >
                  {a.urgentie === "warning" ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-1 text-[14px] font-semibold">{a.titel}</p>
                <p className="mt-0.5 text-[12px]" style={{ color: C.sub }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 self-center rounded-lg px-3.5 py-1.5 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee] sm:mr-4"
                style={{ background: NEON[neon], color: C.bgDeep }}
              >
                {a.cta}
              </button>
            </div>
          );
        })}
      </div>

      <div
        className="flex items-center gap-3 rounded-xl border p-4"
        style={{ borderColor: `${C.green}44`, background: "rgba(52,229,176,0.08)" }}
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[14px] font-bold"
          style={{ background: C.green, color: C.bgDeep }}
          aria-hidden
        >
          ✓
        </span>
        <p className="text-[12.5px]" style={{ color: C.sub }}>
          Verder is alles bijgewerkt. Nieuwe acties verschijnen automatisch op deze plek.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusNeon: Record<string, Neon> = {
    Betaald: "green",
    Openstaand: "orange",
    Concept: "cyan",
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
      <div>
        <Kicker neon="magenta">Financiën</Kicker>
        <div className="mt-2">
          <Chrome>Facturen</Chrome>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Panel neon="green">
          <p className="text-[10.5px] uppercase tracking-wide" style={{ color: C.faint }}>
            Ontvangen
          </p>
          <p
            className="mt-2 text-[23px] font-bold tabular-nums"
            style={{ ...mono, color: C.green }}
          >
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Panel>
        <Panel neon="orange">
          <p className="text-[10.5px] uppercase tracking-wide" style={{ color: C.faint }}>
            Openstaand
          </p>
          <p
            className="mt-2 text-[23px] font-bold tabular-nums"
            style={{ ...mono, color: C.orange }}
          >
            € {open.toLocaleString("nl-NL")}
          </p>
        </Panel>
      </div>

      <Panel neon="magenta" className="!p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10px] uppercase tracking-wide"
                style={{ ...mono, color: C.faint, borderBottom: `1px solid ${C.line}` }}
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
                const neon = statusNeon[f.status] ?? "cyan";
                return (
                  <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                    <td className="p-4 text-[12px] font-semibold tabular-nums" style={mono}>
                      {f.nr}
                    </td>
                    <td className="p-4 text-[13px] font-medium">{f.klant}</td>
                    <td
                      className="hidden p-4 text-[12px] tabular-nums sm:table-cell"
                      style={{ ...mono, color: C.faint }}
                    >
                      {f.datum}
                    </td>
                    <td className="p-4 text-right text-[13px] font-bold tabular-nums" style={mono}>
                      {f.bedrag}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: NEON[neon], boxShadow: `0 0 6px ${NEON[neon]}` }}
                          aria-hidden
                        />
                        <span className="text-[11.5px] font-semibold" style={{ color: NEON[neon] }}>
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
      </Panel>
    </div>
  );
}
