"use client";

// Concept 24 — "Console" · Terminal / TUI. Een volwaardige tekst-terminal: bijna-zwart canvas,
// alles monospace, een command-prompt-balk met knipperende cursor, box-drawing randen,
// keyboard-hints ([j/k], [↵]) en phosphor-groen als hoofdkleur met amber-secundair.
// Retro-computing, maar productief en messcherp leesbaar. Geen ⌘K-palet — dit is een echte TUI.
// Palet: bg #05080a, paneel #0a0f0d, phosphor #5df08a, dim-groen #3a7a54, ink #cfe8d4,
// amber #ffb454, rood #ff6b6b, lijn rgba(93,240,138,0.16).
// Font: IBM Plex Mono overal — dat IS de identiteit. Cijfers tabular-nums.

import { useState } from "react";
import {
  SCREENS,
  KPIS,
  OPDRACHTEN,
  CREDENTIALS,
  ACTIES,
  FACTUREN,
  PROFIEL,
  NAV,
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  bg: "#05080a",
  panel: "#0a0f0d",
  panelSoft: "#0c1411",
  phosphor: "#5df08a",
  dim: "#3a7a54",
  ink: "#cfe8d4",
  inkSoft: "#8fb39a",
  amber: "#ffb454",
  red: "#ff6b6b",
  line: "rgba(93,240,138,0.16)",
  lineSoft: "rgba(93,240,138,0.08)",
  phosphorSoft: "rgba(93,240,138,0.10)",
  amberSoft: "rgba(255,180,84,0.12)",
  redSoft: "rgba(255,107,107,0.12)",
};

const mono = { fontFamily: "var(--font-lab-plex-mono)" };

// Box-drawing helpers — een horizontale scheidingsregel met een label, TUI-stijl.
function Rule({ label, color = C.dim }: { label?: string; color?: string }) {
  return (
    <div
      className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]"
      style={{ ...mono, color }}
    >
      {label ? (
        <>
          <span aria-hidden="true">──</span>
          <span>{label}</span>
        </>
      ) : null}
      <span aria-hidden="true" className="flex-1 truncate">
        {"─".repeat(120)}
      </span>
    </div>
  );
}

function statusBadge(s: CredStatus): { label: string; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "[ OK ]", fg: C.phosphor, bg: C.phosphorSoft };
    case "SUBMITTED":
      return { label: "[ .. ]", fg: C.amber, bg: C.amberSoft };
    case "EXPIRING":
      return { label: "[WARN]", fg: C.amber, bg: C.amberSoft };
    case "REJECTED":
      return { label: "[FAIL]", fg: C.red, bg: C.redSoft };
  }
}

function Cursor() {
  return (
    <span
      aria-hidden="true"
      className="ml-0.5 inline-block h-[1.05em] w-[0.55em] translate-y-[0.14em]"
      style={{ background: C.phosphor, animation: "lab24-blink 1.05s steps(1) infinite" }}
    />
  );
}

function Sparkline({ data, color = C.phosphor }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 96;
  const h = 26;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {pts.map((p, i) => (
        <line
          key={i}
          x1={p[0]}
          y1={h}
          x2={p[0]}
          y2={p[1]}
          stroke={color}
          strokeWidth={1}
          opacity={0.18}
        />
      ))}
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pts.map((p, i) => (
        <rect key={`d-${i}`} x={p[0] - 1} y={p[1] - 1} width={2} height={2} fill={color} />
      ))}
    </svg>
  );
}

function KeyHint({ k, label }: { k: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: C.inkSoft }}>
      <span
        className="rounded-[3px] px-1.5 py-0.5 text-[10.5px] font-semibold"
        style={{ background: C.phosphorSoft, color: C.phosphor, border: `1px solid ${C.line}` }}
      >
        {k}
      </span>
      {label}
    </span>
  );
}

function Box({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[4px] ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.line}` }}
    >
      {children}
    </div>
  );
}

export function Concept24() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;
  const idx = SCREENS.findIndex((s) => s.key === screen);
  const path = `~/zzp/${screen}`;

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{
        ...mono,
        color: C.ink,
        background:
          "radial-gradient(1200px 700px at 50% -20%, rgba(93,240,138,0.05), transparent 60%), " +
          C.bg,
      }}
    >
      <style>{`@keyframes lab24-blink{0%,49%{opacity:1}50%,100%{opacity:0}}`}</style>

      {/* scanline + vignette overlay, heel subtiel, blokkeert geen interactie */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "repeating-linear-gradient(to bottom, rgba(93,240,138,0.028) 0px, rgba(93,240,138,0.028) 1px, transparent 1px, transparent 3px), radial-gradient(120% 120% at 50% 50%, transparent 62%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      <div className="relative z-20 flex min-h-[680px] flex-col">
        {/* Terminal-chrome / titelbalk */}
        <header
          className="flex h-11 shrink-0 items-center gap-3 border-b px-4"
          style={{ borderColor: C.line, background: C.panelSoft }}
        >
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: C.red }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: C.amber }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: C.phosphor }} />
          </div>
          <span className="text-[12px]" style={{ color: C.inkSoft }}>
            zzp@platform — <span style={{ color: C.phosphor }}>session</span> · {PROFIEL.naam}
          </span>
          <span className="ml-auto text-[11px]" style={{ color: C.dim }}>
            {PROFIEL.trust.toLowerCase()} · v2.4.0
          </span>
        </header>

        <div className="flex min-h-0 flex-1">
          {/* Nav-lijst met ▸ selectie-indicator */}
          <nav
            className="hidden w-[220px] shrink-0 flex-col border-r px-3 py-4 md:flex"
            style={{ borderColor: C.line }}
            aria-label="Schermen"
          >
            <p className="px-2 pb-2 text-[10.5px] uppercase tracking-[0.24em]" style={{ color: C.dim }}>
              ── modules ──
            </p>
            <ul className="flex flex-col gap-0.5">
              {SCREENS.map((s, i) => {
                const on = s.key === screen;
                return (
                  <li key={s.key}>
                    <button
                      onClick={() => setScreen(s.key)}
                      aria-current={on ? "page" : undefined}
                      className="group flex w-full items-center gap-2 rounded-[3px] px-2 py-1.5 text-left text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-1"
                      style={{
                        color: on ? C.phosphor : C.inkSoft,
                        background: on ? C.phosphorSoft : "transparent",
                      }}
                    >
                      <span aria-hidden="true" style={{ color: on ? C.phosphor : "transparent" }}>
                        ▸
                      </span>
                      <span className="tabular-nums" style={{ color: on ? C.phosphor : C.dim }}>
                        {String(i).padStart(2, "0")}
                      </span>
                      <span className="truncate">{s.label.toLowerCase()}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <p className="mt-6 px-2 pb-2 text-[10.5px] uppercase tracking-[0.24em]" style={{ color: C.dim }}>
              ── overig ──
            </p>
            <div className="flex flex-col gap-1 px-2">
              {NAV.slice(2).map((n) => (
                <span key={n} className="text-[11.5px]" style={{ color: C.inkSoft }}>
                  <span aria-hidden="true" style={{ color: C.dim }}>
                    ·{" "}
                  </span>
                  {n.toLowerCase()}
                </span>
              ))}
            </div>

            <div
              className="mt-auto rounded-[4px] p-2.5 text-[11px]"
              style={{ border: `1px solid ${C.line}`, color: C.inkSoft }}
            >
              <div className="flex items-center justify-between">
                <span style={{ color: C.dim }}>uptime</span>
                <span className="tabular-nums" style={{ color: C.phosphor }}>
                  99.98%
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span style={{ color: C.dim }}>berichten</span>
                <span className="tabular-nums" style={{ color: C.amber }}>
                  {BERICHTEN.filter((b) => b.ongelezen).length} nieuw
                </span>
              </div>
            </div>
          </nav>

          <main className="flex min-w-0 flex-1 flex-col">
            {/* Command-prompt-balk */}
            <div
              className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b px-4 py-2.5"
              style={{ borderColor: C.line, background: C.panelSoft }}
            >
              <span className="text-[12.5px]" style={{ color: C.dim }}>
                {path}
              </span>
              <span aria-hidden="true" style={{ color: C.phosphor }}>
                zzp
              </span>
              <span aria-hidden="true" style={{ color: C.amber }}>
                ▸
              </span>
              <span className="text-[12.5px]" style={{ color: C.ink }}>
                open {screen}
              </span>
              <Cursor />
              <div className="ml-auto hidden items-center gap-3 lg:flex">
                <KeyHint k="j/k" label="navigeer" />
                <KeyHint k="↵" label="open" />
                <KeyHint k="/" label="zoek" />
              </div>
            </div>

            {/* Mobiele module-tabs */}
            <div className="flex gap-1 overflow-x-auto border-b px-3 py-2 md:hidden" style={{ borderColor: C.line }}>
              {SCREENS.map((s) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    className="shrink-0 rounded-[3px] px-2.5 py-1 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-1"
                    style={{
                      color: on ? C.phosphor : C.inkSoft,
                      background: on ? C.phosphorSoft : "transparent",
                    }}
                  >
                    {on ? "▸ " : ""}
                    {s.label.toLowerCase()}
                  </button>
                );
              })}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-7 lg:py-6">
              {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
              {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
              {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
              {screen === "verificatie" && <Verificatie />}
              {screen === "acties" && <Acties />}
              {screen === "facturen" && <Facturen />}
            </div>

            {/* Statusbalk-footer */}
            <footer
              className="flex shrink-0 items-center gap-4 border-t px-4 py-2 text-[11px]"
              style={{ borderColor: C.line, background: C.panelSoft, color: C.dim }}
            >
              <span style={{ color: C.phosphor }}>● online</span>
              <span className="tabular-nums">
                buf {String(idx + 1).padStart(2, "0")}/{String(SCREENS.length).padStart(2, "0")}
              </span>
              <span className="hidden sm:inline">utf-8</span>
              <span className="ml-auto hidden tabular-nums sm:inline">
                {PROFIEL.rol.toLowerCase()}
              </span>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-[12px]" style={{ color: C.dim }}>
          <span style={{ color: C.phosphor }}>$</span> whoami --greet
        </p>
        <h1 className="mt-1.5 text-[26px] font-semibold leading-tight" style={{ color: C.ink }}>
          goedemorgen, {PROFIEL.naam.split(" ")[0].toLowerCase()}
        </h1>
        <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          {"// 3 matches boven 85%, 1 certificaat vraagt aandacht, 2 facturen open."}
        </p>
      </div>

      {/* KPI's */}
      <div>
        <Rule label="metrics" />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Box key={k.label} className="p-4">
              <p className="text-[11px] lowercase" style={{ color: C.dim }}>
                {k.label}
              </p>
              <p
                className="mt-2 text-[24px] font-semibold leading-none tabular-nums"
                style={{ color: C.phosphor }}
              >
                {k.value}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className="text-[11px] font-semibold tabular-nums"
                  style={{ color: k.up ? C.phosphor : C.amber }}
                >
                  {k.up ? "▲" : "▼"} {k.trend}
                </span>
                <Sparkline data={k.spark} color={k.up ? C.phosphor : C.amber} />
              </div>
            </Box>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <Rule label="beste matches" />
            <Box className="mt-3 overflow-hidden">
              <div
                className="flex items-center gap-3 border-b px-4 py-2 text-[10.5px] uppercase tracking-[0.14em]"
                style={{ borderColor: C.line, color: C.dim }}
              >
                <span className="w-9">%</span>
                <span className="flex-1">opdracht</span>
                <span className="hidden sm:block">tarief</span>
              </div>
              {OPDRACHTEN.map((o) => (
                <button
                  key={o.id}
                  onClick={onOpen}
                  className="flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[rgba(93,240,138,0.06)] focus-visible:outline-none focus-visible:ring-1"
                  style={{ borderColor: C.lineSoft }}
                >
                  <span
                    className="w-9 text-[13px] font-semibold tabular-nums"
                    style={{ color: C.phosphor }}
                  >
                    {o.match}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px]" style={{ color: C.ink }}>
                      {o.titel}
                    </span>
                    <span className="block truncate text-[11.5px]" style={{ color: C.inkSoft }}>
                      {o.opdrachtgever} · {o.plaats}
                    </span>
                  </span>
                  <span
                    className="hidden text-[12px] tabular-nums sm:block"
                    style={{ color: C.amber }}
                  >
                    {o.tarief.replace(" / uur", "")}
                  </span>
                  <span aria-hidden="true" style={{ color: C.dim }}>
                    →
                  </span>
                </button>
              ))}
            </Box>
          </div>

          <div>
            <Rule label="inbox" />
            <Box className="mt-3 overflow-hidden">
              {BERICHTEN.map((b) => (
                <div
                  key={b.van}
                  className="flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0"
                  style={{ borderColor: C.lineSoft }}
                >
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: b.ongelezen ? C.amber : C.dim }}
                    aria-hidden="true"
                  >
                    {b.ongelezen ? "●" : "○"}
                  </span>
                  <span
                    className="w-8 shrink-0 text-[11px] font-semibold tabular-nums"
                    style={{ color: C.phosphor }}
                  >
                    {b.initialen}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px]" style={{ color: C.ink }}>
                      {b.van}
                    </span>
                    <span className="block truncate text-[11.5px]" style={{ color: C.inkSoft }}>
                      {b.preview}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.dim }}>
                    {b.tijd}
                  </span>
                </div>
              ))}
            </Box>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <Rule label="certificaten" />
            <Box className="mt-3 p-3">
              <div className="space-y-1.5">
                {CREDENTIALS.map((c) => {
                  const st = statusBadge(c.status);
                  return (
                    <div key={c.naam} className="flex items-start gap-2 py-1">
                      <span
                        className="shrink-0 text-[11px] font-semibold tabular-nums"
                        style={{ color: st.fg }}
                      >
                        {st.label}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px]" style={{ color: C.ink }}>
                          {c.naam}
                        </span>
                        <span className="block truncate text-[11px]" style={{ color: C.inkSoft }}>
                          {c.detail}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </Box>
          </div>

          {/* Volgende beste stap */}
          <div
            className="rounded-[4px] p-4"
            style={{ background: C.amberSoft, border: `1px solid ${C.amber}` }}
          >
            <p className="text-[10.5px] uppercase tracking-[0.2em]" style={{ color: C.amber }}>
              ! volgende beste stap
            </p>
            <p className="mt-2 text-[14px] font-semibold" style={{ color: C.ink }}>
              {primair.titel}
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <button
              className="mt-3 w-full rounded-[3px] px-3 py-2 text-[12.5px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-1"
              style={{ background: C.amber, color: "#1a1206" }}
            >
              &gt; {primair.cta.toLowerCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <p className="text-[12px]" style={{ color: C.dim }}>
          <span style={{ color: C.phosphor }}>$</span> grep opdrachten --open
        </p>
        <h1 className="mt-1.5 text-[22px] font-semibold" style={{ color: C.ink }}>
          marktplaats
        </h1>
      </div>

      {/* zoekprompt in vim/less-stijl */}
      <div
        className="flex items-center gap-2 rounded-[4px] px-3 py-2.5"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <span aria-hidden="true" className="text-[14px]" style={{ color: C.phosphor }}>
          /
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none"
          style={{ ...mono, color: C.ink }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.dim }}>
          {filtered.length} match
        </span>
      </div>

      {filtered.length === 0 ? (
        <Box className="px-6 py-14 text-center">
          <p className="text-[13px] font-semibold" style={{ color: C.amber }}>
            {"grep: geen resultaten"}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[12px]" style={{ color: C.inkSoft }}>
            {"// pas je zoekterm aan of verbreed je beschikbaarheid — we melden nieuwe matches zodra ze binnenkomen."}
          </p>
        </Box>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group rounded-[4px] p-4 text-left transition-colors hover:bg-[rgba(93,240,138,0.06)] focus-visible:outline-none focus-visible:ring-1"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] tabular-nums" style={{ color: C.dim }}>
                  {o.id}
                </span>
                <span className="text-[12px] font-semibold tabular-nums" style={{ color: C.phosphor }}>
                  {o.match}% match
                </span>
              </div>
              <p className="mt-2 text-[14.5px] font-semibold leading-snug" style={{ color: C.ink }}>
                {o.titel}
              </p>
              <p className="mt-1 text-[12px]" style={{ color: C.inkSoft }}>
                {o.opdrachtgever} · {o.plaats}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-[3px] px-2 py-0.5 text-[10.5px]"
                    style={{ border: `1px solid ${C.line}`, color: C.inkSoft }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-3 flex items-center justify-between border-t pt-3 text-[12px] tabular-nums"
                style={{ borderColor: C.lineSoft }}
              >
                <span style={{ color: C.amber }}>{o.tarief}</span>
                <span style={{ color: C.inkSoft }}>{o.uren}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[12px]" style={{ color: C.dim }}>
            <span style={{ color: C.phosphor }}>$</span> cat {opdracht.id}
          </p>
          <h1 className="mt-1.5 text-[22px] font-semibold leading-snug" style={{ color: C.ink }}>
            {opdracht.titel}
          </h1>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkSoft }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <button
          className="shrink-0 rounded-[3px] px-5 py-2.5 text-[13px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-1"
          style={{ background: C.phosphor, color: "#04120a" }}
        >
          &gt; reageer
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "tarief", v: opdracht.tarief },
          { l: "omvang", v: opdracht.uren },
          { l: "start", v: opdracht.start },
          { l: "match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Box key={m.l} className="p-3.5">
            <p className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.dim }}>
              {m.l}
            </p>
            <p className="mt-1.5 text-[15px] font-semibold tabular-nums" style={{ color: C.phosphor }}>
              {m.v}
            </p>
          </Box>
        ))}
      </div>

      <div>
        <Rule label="waarom deze match" />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Box className="p-4">
            <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: C.phosphor }}>
              + pluspunten
            </p>
            <ul className="mt-3 space-y-2">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.ink }}>
                  <span aria-hidden="true" style={{ color: C.phosphor }}>
                    [✓]
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Box>
          <Box className="p-4">
            <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: C.amber }}>
              ! aandachtspunten
            </p>
            <ul className="mt-3 space-y-2">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2 text-[12.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <span aria-hidden="true" style={{ color: C.amber }}>
                    [!]
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Box>
        </div>
      </div>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-[12px]" style={{ color: C.dim }}>
          <span style={{ color: C.phosphor }}>$</span> verify --status
        </p>
        <h1 className="mt-1.5 text-[22px] font-semibold" style={{ color: C.ink }}>
          verificatie
        </h1>
      </div>

      <Box className="flex items-center gap-4 p-4">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[4px] text-[20px] font-semibold"
          style={{ background: C.phosphorSoft, color: C.phosphor, border: `1px solid ${C.line}` }}
          aria-hidden="true"
        >
          ✓
        </span>
        <div>
          <p className="text-[18px] font-semibold" style={{ color: C.phosphor }}>
            {PROFIEL.trust.toLowerCase()}
          </p>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
            <span className="tabular-nums" style={{ color: C.ink }}>
              {verified}
            </span>
            /
            <span className="tabular-nums" style={{ color: C.ink }}>
              {CREDENTIALS.length}
            </span>{" "}
            geverifieerd · 1 vraagt actie · alles versleuteld bewaard
          </p>
        </div>
      </Box>

      <div>
        <Rule label="credentials" />
        <Box className="mt-3 overflow-hidden">
          <div
            className="flex items-center gap-3 border-b px-4 py-2 text-[10.5px] uppercase tracking-[0.14em]"
            style={{ borderColor: C.line, color: C.dim }}
          >
            <span className="w-16">status</span>
            <span className="flex-1">naam</span>
          </div>
          {CREDENTIALS.map((c) => {
            const st = statusBadge(c.status);
            return (
              <div
                key={c.naam}
                className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0"
                style={{ borderColor: C.lineSoft }}
              >
                <span className="w-16 text-[12px] font-semibold tabular-nums" style={{ color: st.fg }}>
                  {st.label}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px]" style={{ color: C.ink }}>
                    {c.naam}
                  </span>
                  <span className="block truncate text-[11.5px]" style={{ color: C.inkSoft }}>
                    {c.detail}
                  </span>
                </span>
              </div>
            );
          })}
        </Box>
      </div>

      <div>
        <Rule label="documenten (privé)" />
        <Box className="mt-3 overflow-hidden">
          {DOCUMENTEN.map((d) => {
            const st = statusBadge(d.status);
            return (
              <div
                key={d.naam}
                className="flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0"
                style={{ borderColor: C.lineSoft }}
              >
                <span aria-hidden="true" className="text-[12px]" style={{ color: C.dim }}>
                  ▤
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px]" style={{ color: C.ink }}>
                    {d.naam}
                  </span>
                  <span className="block truncate text-[11px]" style={{ color: C.inkSoft }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] font-semibold tabular-nums" style={{ color: st.fg }}>
                  {st.label}
                </span>
              </div>
            );
          })}
        </Box>
      </div>
    </div>
  );
}

function Acties() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <p className="text-[12px]" style={{ color: C.dim }}>
          <span style={{ color: C.phosphor }}>$</span> tasks --pending
        </p>
        <h1 className="mt-1.5 text-[22px] font-semibold" style={{ color: C.ink }}>
          acties
        </h1>
        <p className="mt-1.5 text-[12.5px]" style={{ color: C.inkSoft }}>
          {"// eén ding tegelijk. wij bewaken de rest."}
        </p>
      </div>

      <div className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const fg = warn ? C.amber : C.phosphor;
          return (
            <div
              key={a.titel}
              className="rounded-[4px] p-4"
              style={{ background: C.panel, border: `1px solid ${warn ? C.amber : C.line}` }}
            >
              <div className="flex items-start gap-3">
                <span className="text-[12px] font-semibold tabular-nums" style={{ color: fg }}>
                  [{warn ? "!" : String(i + 1)}]
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold" style={{ color: C.ink }}>
                    {a.titel}
                  </p>
                  <p className="mt-1 text-[12px]" style={{ color: C.inkSoft }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 rounded-[3px] px-3 py-1.5 text-[12px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-1"
                  style={{ background: warn ? C.amberSoft : C.phosphorSoft, color: fg, border: `1px solid ${fg}` }}
                >
                  &gt; {a.cta.toLowerCase()}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="rounded-[4px] p-4 text-[12px]"
        style={{ background: C.panelSoft, border: `1px solid ${C.lineSoft}`, color: C.inkSoft }}
      >
        <span style={{ color: C.phosphor }}>✓</span> klaar met de lijst? nieuwe acties verschijnen
        hier zodra ze relevant worden — niets in de gaten te houden.
      </div>
    </div>
  );
}

function Facturen() {
  const tone: Record<string, string> = {
    Betaald: C.phosphor,
    Openstaand: C.amber,
    Concept: C.dim,
  };
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px]" style={{ color: C.dim }}>
            <span style={{ color: C.phosphor }}>$</span> ls facturen -l
          </p>
          <h1 className="mt-1.5 text-[22px] font-semibold" style={{ color: C.ink }}>
            facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-[3px] px-4 py-2 text-[12.5px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-1"
          style={{ background: C.phosphor, color: "#04120a" }}
        >
          + nieuwe factuur
        </button>
      </div>

      <Box className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={mono}>
            <thead>
              <tr
                className="border-b text-[10.5px] uppercase tracking-[0.12em]"
                style={{ borderColor: C.line, color: C.dim }}
              >
                <th className="px-4 py-2.5 font-semibold">nummer</th>
                <th className="px-4 py-2.5 font-semibold">klant</th>
                <th className="px-4 py-2.5 font-semibold">datum</th>
                <th className="px-4 py-2.5 text-right font-semibold">bedrag</th>
                <th className="px-4 py-2.5 text-right font-semibold">status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const fg = tone[f.status] ?? C.inkSoft;
                return (
                  <tr
                    key={f.nr}
                    className="border-b transition-colors last:border-b-0 hover:bg-[rgba(93,240,138,0.06)]"
                    style={{ borderColor: C.lineSoft }}
                  >
                    <td className="px-4 py-3 text-[12px] tabular-nums" style={{ color: C.inkSoft }}>
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[12.5px]" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td className="px-4 py-3 text-[12px] tabular-nums" style={{ color: C.inkSoft }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[12.5px] font-semibold tabular-nums"
                      style={{ color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className="text-[12px] font-semibold tabular-nums"
                        style={{ color: fg }}
                      >
                        [{f.status.toLowerCase()}]
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Box>
    </div>
  );
}
