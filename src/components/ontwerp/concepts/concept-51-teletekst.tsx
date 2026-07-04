"use client";

// Concept 51 — "Teletekst" · Nederlandse retro-informatiedienst (NOS Teletekst, pagina 888).
// Zwart canvas, blokkerige monospace, klassieke teletekst-kleuren op zwart: cyaan, geel, groen,
// magenta, wit, met rode/blauwe kopregels. Pagina-nummers rechtsboven ("101 Dashboard"), een
// genummerd index-menu, dubbele-hoogte kopregels, mozaïek-blokgrafiek als accent, een knipperende
// blok-cursor (respecteert prefers-reduced-motion) en onderaan een gekleurde functiebalk
// (rood/groen/geel/blauw = snelkoppelingen). Data-dicht, nostalgisch-Nederlands en functioneel.
// Onderscheidend van de terminal/phosphor-TUI: dit is de karaktercel-esthetiek van teletekst.
// Palet: canvas #000000, ink #ffffff, cyaan #22e0e6, geel #ffe515, groen #35e06a,
// magenta #ff4fd8, blauw #3b6bff, rood #ff3b3b.
// Fonts: --font-lab-plex-mono (alles — karaktercel-gevoel).

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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

/* ---------- Palet & typografie ---------- */

const C = {
  canvas: "#000000",
  ink: "#ffffff",
  dim: "#9aa0a6",
  faint: "#5a6066",
  cyan: "#22e0e6",
  yellow: "#ffe515",
  green: "#35e06a",
  magenta: "#ff4fd8",
  blue: "#3b6bff",
  red: "#ff3b3b",
  cyanDim: "#0f7d80",
  line: "#1c2126",
  rowAlt: "#0a0d10",
};

const mono = { fontFamily: "var(--font-lab-plex-mono)" };

/* ---------- Pagina-nummers per scherm ---------- */

const PAGE_NR: Record<ScreenKey, string> = {
  dashboard: "101",
  marktplaats: "230",
  opdracht: "251",
  verificatie: "300",
  documenten: "350",
  facturen: "500",
  berichten: "600",
  acties: "400",
};

// Index-menu: genummerde secties zoals de teletekst-inhoudsopgave.
const INDEX: { nr: string; key: ScreenKey; label: string; color: string }[] = [
  { nr: "101", key: "dashboard", label: "Dashboard", color: C.cyan },
  { nr: "230", key: "marktplaats", label: "Marktplaats", color: C.green },
  { nr: "251", key: "opdracht", label: "Opdracht in beeld", color: C.yellow },
  { nr: "300", key: "verificatie", label: "Verificatie", color: C.magenta },
  { nr: "400", key: "acties", label: "Volgende acties", color: C.red },
  { nr: "500", key: "facturen", label: "Facturen", color: C.cyan },
  { nr: "600", key: "berichten", label: "Berichten", color: C.green },
];

type Tone = "green" | "yellow" | "cyan" | "red";

function toneHex(t: Tone): string {
  return t === "green" ? C.green : t === "yellow" ? C.yellow : t === "red" ? C.red : C.cyan;
}

function statusMeta(s: CredStatus): { label: string; tone: Tone; glyph: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "GEVERIFIEERD", tone: "green", glyph: "✔" };
    case "SUBMITTED":
      return { label: "IN BEOORDELING", tone: "cyan", glyph: "○" };
    case "EXPIRING":
      return { label: "VERLOOPT BIJNA", tone: "yellow", glyph: "⚠" };
    case "REJECTED":
      return { label: "AFGEWEZEN", tone: "red", glyph: "✖" };
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Primitieven ---------- */

// Knipperende blok-cursor — respecteert prefers-reduced-motion via de <style>-regel in de root.
function Cursor({ color = C.yellow }: { color?: string }) {
  return (
    <span aria-hidden="true" className="tt51-cursor" style={{ color }}>
      {"█"}
    </span>
  );
}

// Mozaïek-blokgrafiek: rij gekleurde karaktercellen als teletekst-accent.
function Mosaic({ seed, colors }: { seed: number; colors: string[] }) {
  // Deterministisch patroon uit seed — geen random, hydration-veilig.
  const cells = Array.from({ length: 30 }, (_, i) => {
    const on = ((i * 7 + seed * 3) % 5) % 5 < 3;
    const c = colors[(i + seed) % colors.length] ?? C.cyan;
    return { on, c };
  });
  return (
    <div
      aria-hidden="true"
      className="flex h-3 w-full overflow-hidden rounded-[1px]"
      style={{ letterSpacing: 0 }}
    >
      {cells.map((cell, i) => (
        <span
          key={i}
          className="h-full flex-1"
          style={{ background: cell.on ? cell.c : "transparent" }}
        />
      ))}
    </div>
  );
}

// Dubbele-hoogte teletekst-kopregel.
function DoubleHead({ children, color = C.yellow }: { children: React.ReactNode; color?: string }) {
  return (
    <h1
      className="text-[26px] font-bold uppercase leading-none tracking-[0.04em] sm:text-[32px]"
      style={{ ...mono, color }}
    >
      {children}
    </h1>
  );
}

function Kicker({ children, color = C.cyan }: { children: React.ReactNode; color?: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.34em]" style={{ ...mono, color }}>
      {children}
    </p>
  );
}

// Gekleurde inline-tag in teletekst-stijl (achtergrondvlak + zwarte tekst).
function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em]"
      style={{ ...mono, background: color, color: "#000" }}
    >
      {children}
    </span>
  );
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.06em]"
      style={{ ...mono, color: toneHex(m.tone) }}
    >
      <span aria-hidden="true">{m.glyph}</span>
      {m.label}
    </span>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept51() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  // Simuleer het "ophalen" van een teletekst-pagina bij navigatie.
  const go = (key: ScreenKey, id?: string) => {
    if (id) setActiveId(id);
    setScreen(key);
    setLoading(true);
  };

  useEffect(() => {
    if (!loading) return;
    const t = window.setTimeout(() => setLoading(false), 520);
    return () => window.clearTimeout(t);
  }, [loading, screen]);

  const pageNr = PAGE_NR[screen];
  const pageTitle = SCREENS.find((s) => s.key === screen)?.label ?? "Teletekst";

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...mono, background: C.canvas, color: C.ink }}
    >
      {/* Cursor-blink + reduced-motion respect */}
      <style>{`
        .tt51-cursor { display:inline-block; }
        @media (prefers-reduced-motion: no-preference) {
          .tt51-cursor { animation: tt51blink 1.05s steps(1,end) infinite; }
        }
        @keyframes tt51blink { 0%,49% { opacity:1 } 50%,100% { opacity:0 } }
      `}</style>

      {/* Scanline-textuur, subtiel */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px)`,
        }}
      />

      <div className="relative mx-auto flex min-h-[680px] max-w-5xl flex-col px-3 py-4 sm:px-5">
        {/* ---------- Kopregel ---------- */}
        <header className="shrink-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
            <span
              className="px-1.5 py-0.5 font-bold uppercase tracking-[0.12em]"
              style={{ background: C.red, color: "#000" }}
            >
              ZZP&nbsp;TEKST
            </span>
            <span className="font-bold tabular-nums" style={{ color: C.cyan }}>
              P{pageNr}
            </span>
            <span className="uppercase tracking-[0.14em]" style={{ color: C.ink }}>
              {pageTitle}
            </span>
            <span
              className="ml-auto flex items-center gap-3 tabular-nums"
              style={{ color: C.yellow }}
            >
              <span className="hidden sm:inline">za 04 jul</span>
              <span>14:32:07</span>
            </span>
          </div>
          <div className="mt-2 h-px w-full" style={{ background: C.line }} />
          {/* Blauwe/rode navigatiestrook met pagina-nummers */}
          <nav className="mt-2 flex gap-1 overflow-x-auto pb-1" aria-label="Teletekst-pagina's">
            {INDEX.map((it) => {
              const on = it.key === screen;
              return (
                <button
                  key={it.nr}
                  onClick={() => go(it.key)}
                  aria-current={on ? "page" : undefined}
                  className="group flex shrink-0 items-center gap-1.5 px-2 py-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0"
                  style={{
                    background: on ? it.color : "transparent",
                    color: on ? "#000" : it.color,
                  }}
                >
                  <span className="tabular-nums">{it.nr}</span>
                  <span className="hidden sm:inline">{it.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="mt-1 h-px w-full" style={{ background: C.line }} />
        </header>

        {/* ---------- Inhoud ---------- */}
        <main className="mt-4 flex-1 overflow-y-auto pb-4">
          {loading ? (
            <PageLoader nr={pageNr} title={pageTitle} />
          ) : (
            <>
              {screen === "dashboard" && <Dashboard onGo={go} />}
              {screen === "marktplaats" && (
                <Marktplaats activeId={activeId} onSelect={setActiveId} onGo={go} />
              )}
              {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
              {screen === "verificatie" && <Verificatie />}
              {screen === "acties" && <Acties />}
              {screen === "facturen" && <Facturen />}
              {screen === "berichten" && <Berichten />}
            </>
          )}
        </main>

        {/* ---------- Fastext-functiebalk ---------- */}
        <footer className="mt-2 shrink-0">
          <div className="grid grid-cols-4 gap-1">
            {(
              [
                { color: C.red, label: "Index", key: "dashboard" as ScreenKey },
                { color: C.green, label: "Marktplaats", key: "marktplaats" as ScreenKey },
                { color: C.yellow, label: "Verificatie", key: "verificatie" as ScreenKey },
                { color: C.blue, label: "Facturen", key: "facturen" as ScreenKey },
              ] as const
            ).map((f) => (
              <button
                key={f.label}
                onClick={() => go(f.key)}
                className="flex items-center gap-1.5 truncate px-2 py-1.5 text-left text-[11px] font-bold uppercase tracking-[0.04em] transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                style={{ background: f.color, color: "#000" }}
              >
                <span
                  aria-hidden="true"
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ background: "#000", opacity: 0.55 }}
                />
                <span className="truncate">{f.label}</span>
              </button>
            ))}
          </div>
          <p
            className="mt-1.5 text-center text-[10.5px] tracking-[0.1em]"
            style={{ color: C.faint }}
          >
            888 ondertiteling &nbsp;·&nbsp; kies een pagina hierboven &nbsp;·&nbsp; ZZP TEKST v51
            <Cursor color={C.green} />
          </p>
        </footer>
      </div>
    </div>
  );
}

/* ---------- Pagina-loader (skeleton) ---------- */

function PageLoader({ nr, title }: { nr: string; title: string }) {
  return (
    <div className="mx-auto max-w-3xl py-8" role="status" aria-live="polite">
      <p className="text-[13px] uppercase tracking-[0.2em]" style={{ color: C.cyan }}>
        Pagina {nr} wordt opgehaald
        <Cursor />
      </p>
      <p className="mt-1 text-[12px]" style={{ color: C.dim }}>
        {title} — even geduld…
      </p>
      <div className="mt-6 space-y-2.5">
        {[100, 82, 91, 68, 76, 55].map((w, i) => (
          <div
            key={i}
            className="h-3.5 rounded-[1px]"
            style={{
              width: `${w}%`,
              background: `repeating-linear-gradient(90deg, ${C.line} 0, ${C.line} 8px, transparent 8px, transparent 14px)`,
            }}
          />
        ))}
      </div>
      <div className="mt-6">
        <Mosaic seed={3} colors={[C.cyan, C.magenta, C.yellow, C.green]} />
      </div>
    </div>
  );
}

/* ---------- Dashboard (101) ---------- */

function Dashboard({ onGo }: { onGo: (k: ScreenKey, id?: string) => void }) {
  const warn = ACTIES[0];
  return (
    <div className="space-y-6">
      <div>
        <Kicker>Pagina 101 · Overzicht</Kicker>
        <div className="mt-1.5">
          <DoubleHead>Goedendag, {PROFIEL.naam.split(" ")[0]}</DoubleHead>
        </div>
        <p className="mt-2 text-[13px]" style={{ color: C.dim }}>
          {PROFIEL.rol} · {PROFIEL.plaats} &nbsp;·&nbsp;
          <span style={{ color: C.green }}>{PROFIEL.trust}</span>
        </p>
        <div className="mt-3">
          <Mosaic seed={1} colors={[C.cyan, C.yellow, C.green, C.magenta]} />
        </div>
      </div>

      {/* Waarschuwing — verlopende VOG */}
      {warn && (
        <div
          className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center"
          style={{ border: `1px solid ${C.yellow}`, background: "rgba(255,229,21,0.06)" }}
          role="alert"
        >
          <span
            className="inline-flex shrink-0 items-center gap-1.5 self-start px-1.5 py-0.5 text-[10.5px] font-bold uppercase"
            style={{ ...mono, background: C.yellow, color: "#000" }}
          >
            <span aria-hidden="true">{"⚠"}</span> Let op
          </span>
          <p className="text-[12.5px]" style={{ color: C.ink }}>
            <span className="font-bold" style={{ color: C.yellow }}>
              {warn.titel}.
            </span>{" "}
            {warn.detail}
          </p>
          <button
            onClick={() => onGo("verificatie")}
            className="ml-auto shrink-0 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{ background: C.yellow, color: "#000" }}
          >
            {warn.cta} {"›"}
          </button>
        </div>
      )}

      {/* KPI-blok — teletekst-cijferkolommen */}
      <section>
        <div className="mb-2 flex items-center gap-2">
          <span
            className="text-[12px] font-bold uppercase tracking-[0.14em]"
            style={{ color: C.cyan }}
          >
            Kerncijfers
          </span>
          <span className="text-[11px]" style={{ color: C.faint }}>
            — deze maand
          </span>
        </div>
        <div className="grid grid-cols-2 gap-px sm:grid-cols-4" style={{ background: C.line }}>
          {KPIS.map((k) => (
            <div key={k.label} className="px-3 py-3" style={{ background: C.canvas }}>
              <p className="text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.dim }}>
                {k.label}
              </p>
              <p
                className="mt-1 text-[24px] font-bold tabular-nums leading-none"
                style={{ color: C.yellow }}
              >
                {k.value}
              </p>
              <p
                className="mt-1 text-[11px] font-semibold tabular-nums"
                style={{ color: k.up ? C.green : C.magenta }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Beste matches als genummerde teletekst-regels */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <span
            className="text-[12px] font-bold uppercase tracking-[0.14em]"
            style={{ color: C.green }}
          >
            Beste matches
          </span>
          <button
            onClick={() => onGo("marktplaats")}
            className="text-[11px] font-semibold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{ color: C.cyan }}
          >
            Alle · P230 {"›"}
          </button>
        </div>
        <ul>
          {OPDRACHTEN.map((o, i) => (
            <li key={o.id}>
              <button
                onClick={() => onGo("opdracht", o.id)}
                className="group flex w-full items-center gap-3 px-2 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400"
                style={{ background: i % 2 ? C.rowAlt : "transparent" }}
              >
                <span
                  className="w-6 shrink-0 text-[13px] font-bold tabular-nums"
                  style={{ color: C.magenta }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13.5px] font-semibold"
                    style={{ color: C.ink }}
                  >
                    {o.titel}
                  </span>
                  <span className="block truncate text-[11.5px]" style={{ color: C.dim }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </span>
                </span>
                <span
                  className="shrink-0 px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
                  style={{
                    background: o.match >= 90 ? C.green : C.yellow,
                    color: "#000",
                  }}
                >
                  {o.match}%
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Certificaten-statuslijst */}
      <section>
        <div className="mb-2">
          <span
            className="text-[12px] font-bold uppercase tracking-[0.14em]"
            style={{ color: C.magenta }}
          >
            Verificatiestatus
          </span>
        </div>
        <div className="space-y-1.5">
          {CREDENTIALS.map((c) => (
            <div key={c.naam} className="flex items-center gap-3 px-2 py-1.5 text-[12.5px]">
              <span className="min-w-0 flex-1 truncate" style={{ color: C.ink }}>
                {c.naam}
              </span>
              <StatusTag status={c.status} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------- Marktplaats (230) ---------- */

function Marktplaats({
  activeId,
  onSelect,
  onGo,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onGo: (k: ScreenKey, id?: string) => void;
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
    <div className="space-y-5">
      <div>
        <Kicker color={C.green}>Pagina 230 · Marktplaats</Kicker>
        <div className="mt-1.5">
          <DoubleHead color={C.green}>Open opdrachten</DoubleHead>
        </div>
      </div>

      {/* Zoekregel */}
      <div
        className="flex items-center gap-2 px-2 py-1.5"
        style={{ border: `1px solid ${C.line}` }}
      >
        <span className="text-[12px] font-bold" style={{ color: C.cyan }}>
          ZOEK{"›"}
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#5a6066]"
          style={{ ...mono, color: C.yellow }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div
          className="px-4 py-12 text-center"
          style={{ border: `1px dashed ${C.line}` }}
          role="status"
        >
          <p
            className="text-[15px] font-bold uppercase tracking-[0.1em]"
            style={{ color: C.magenta }}
          >
            Geen pagina gevonden
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[12.5px]" style={{ color: C.dim }}>
            De teletekst-index vindt niets voor &quot;{q}&quot;. Probeer een andere zoekterm.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-4 px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{ background: C.magenta, color: "#000" }}
          >
            Zoekopdracht wissen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
          {/* Lijst */}
          <ul>
            {filtered.map((o, i) => {
              const on = sel?.id === o.id;
              return (
                <li key={o.id}>
                  <button
                    onClick={() => onSelect(o.id)}
                    aria-pressed={on}
                    className="flex w-full items-start gap-3 px-2.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400"
                    style={{
                      background: on ? "rgba(34,224,230,0.08)" : i % 2 ? C.rowAlt : "transparent",
                      borderLeft: `3px solid ${on ? C.cyan : "transparent"}`,
                    }}
                  >
                    <span
                      className="shrink-0 px-1.5 py-0.5 text-[12px] font-bold tabular-nums"
                      style={{ background: o.match >= 90 ? C.green : C.yellow, color: "#000" }}
                    >
                      {o.match}%
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-[10.5px] tabular-nums" style={{ color: C.faint }}>
                          {o.id}
                        </span>
                        {on && <Cursor color={C.cyan} />}
                      </span>
                      <span
                        className="block truncate text-[14px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {o.titel}
                      </span>
                      <span className="block truncate text-[11.5px]" style={{ color: C.dim }}>
                        {o.opdrachtgever} · {o.plaats} · {o.uren}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Detailkaart */}
          {sel && (
            <aside className="h-fit lg:sticky lg:top-2" style={{ border: `1px solid ${C.line}` }}>
              <div className="px-3 py-2" style={{ background: C.cyan, color: "#000" }}>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em]">
                  P{PAGE_NR.opdracht} · {sel.id}
                </p>
              </div>
              <div className="px-3 py-3">
                <p className="text-[15px] font-bold leading-snug" style={{ color: C.yellow }}>
                  {sel.titel}
                </p>
                <p className="mt-1 text-[12px]" style={{ color: C.dim }}>
                  {sel.opdrachtgever} · {sel.plaats}
                </p>
                <dl
                  className="mt-3 grid grid-cols-2 gap-px text-[12px]"
                  style={{ background: C.line }}
                >
                  {[
                    { l: "Tarief", v: sel.tarief },
                    { l: "Omvang", v: sel.uren },
                    { l: "Start", v: sel.start },
                    { l: "Match", v: `${sel.match}%` },
                  ].map((m) => (
                    <div key={m.l} className="px-2 py-2" style={{ background: C.canvas }}>
                      <dt
                        className="text-[10px] uppercase tracking-[0.08em]"
                        style={{ color: C.dim }}
                      >
                        {m.l}
                      </dt>
                      <dd className="mt-0.5 font-bold tabular-nums" style={{ color: C.ink }}>
                        {m.v}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {sel.tags.map((t) => (
                    <Tag key={t} color={C.magenta}>
                      {t}
                    </Tag>
                  ))}
                </div>
                <button
                  onClick={() => onGo("opdracht", sel.id)}
                  className="mt-4 w-full px-3 py-2 text-[12px] font-bold uppercase tracking-[0.06em] transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  style={{ background: C.green, color: "#000" }}
                >
                  Open opdracht · P{PAGE_NR.opdracht} {"›"}
                </button>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Opdracht-detail (251) ---------- */

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Kicker>Pagina 251 · {opdracht.id}</Kicker>
        <div className="mt-1.5">
          <DoubleHead>{opdracht.titel}</DoubleHead>
        </div>
        <p className="mt-2 text-[13px]" style={{ color: C.dim }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {opdracht.tags.map((t) => (
            <Tag key={t} color={C.cyan}>
              {t}
            </Tag>
          ))}
        </div>
      </div>

      {/* Kerncijfers */}
      <div className="grid grid-cols-2 gap-px sm:grid-cols-4" style={{ background: C.line }}>
        {[
          { l: "Match", v: `${opdracht.match}%`, c: opdracht.match >= 90 ? C.green : C.yellow },
          { l: "Tarief", v: opdracht.tarief, c: C.yellow },
          { l: "Omvang", v: opdracht.uren, c: C.ink },
          { l: "Start", v: opdracht.start, c: C.ink },
        ].map((m) => (
          <div key={m.l} className="px-3 py-3" style={{ background: C.canvas }}>
            <p className="text-[10px] uppercase tracking-[0.1em]" style={{ color: C.dim }}>
              {m.l}
            </p>
            <p
              className="mt-1 text-[18px] font-bold tabular-nums leading-none"
              style={{ color: m.c }}
            >
              {m.v}
            </p>
          </div>
        ))}
      </div>

      {/* Waarom deze match */}
      <section style={{ border: `1px solid ${C.line}` }}>
        <div className="px-3 py-2" style={{ background: C.rowAlt }}>
          <span
            className="text-[12px] font-bold uppercase tracking-[0.12em]"
            style={{ color: C.cyan }}
          >
            Waarom deze match
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 px-3 py-3 sm:grid-cols-2">
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.green }}
            >
              {"✔"} Pluspunten
            </p>
            <ul className="mt-2 space-y-1.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex gap-2 text-[12.5px]" style={{ color: C.ink }}>
                  <span aria-hidden="true" style={{ color: C.green }}>
                    +
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.yellow }}
            >
              {"⚠"} Aandachtspunten
            </p>
            <ul className="mt-2 space-y-1.5">
              {opdracht.redenen.min.map((r) => (
                <li key={r} className="flex gap-2 text-[12.5px]" style={{ color: C.dim }}>
                  <span aria-hidden="true" style={{ color: C.yellow }}>
                    –
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <button
        onClick={react}
        disabled={state !== "idle"}
        aria-live="polite"
        className="flex w-full items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.06em] transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:translate-y-0"
        style={{
          background: state === "sent" ? C.green : state === "sending" ? C.cyanDim : C.cyan,
          color: "#000",
        }}
      >
        {state === "idle" && <>Reageer op opdracht {"›"}</>}
        {state === "sending" && (
          <>
            Versturen
            <Cursor color="#000" />
          </>
        )}
        {state === "sent" && <>{"✔"} Reactie verstuurd</>}
      </button>
    </div>
  );
}

/* ---------- Verificatie (300) ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const attention = CREDENTIALS.filter(
    (c) => c.status === "EXPIRING" || c.status === "REJECTED",
  ).length;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Kicker color={C.magenta}>Pagina 300 · Verificatie</Kicker>
        <div className="mt-1.5">
          <DoubleHead color={C.magenta}>Certificaten</DoubleHead>
        </div>
        <p className="mt-2 text-[13px]" style={{ color: C.dim }}>
          <span className="font-bold" style={{ color: C.green }}>
            {verified}/{total}
          </span>{" "}
          geverifieerd ·{" "}
          <span className="font-bold" style={{ color: C.yellow }}>
            {attention}
          </span>{" "}
          vragen aandacht.
        </p>
      </div>

      {/* Voortgangsbalk als blokjes */}
      <div className="flex gap-1" aria-hidden="true">
        {CREDENTIALS.map((c) => {
          const m = statusMeta(c.status);
          return (
            <span key={c.naam} className="h-3 flex-1" style={{ background: toneHex(m.tone) }} />
          );
        })}
      </div>

      <div style={{ border: `1px solid ${C.line}` }}>
        {CREDENTIALS.map((c, i) => {
          const m = statusMeta(c.status);
          return (
            <div
              key={c.naam}
              className="flex flex-col gap-1 px-3 py-3 sm:flex-row sm:items-center sm:gap-4"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center text-[15px] font-bold"
                style={{ border: `1px solid ${toneHex(m.tone)}`, color: toneHex(m.tone) }}
                aria-hidden="true"
              >
                {m.glyph}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold" style={{ color: C.ink }}>
                  {c.naam}
                </p>
                <p className="text-[11.5px]" style={{ color: C.dim }}>
                  {c.detail}
                </p>
              </div>
              <StatusTag status={c.status} />
            </div>
          );
        })}
      </div>

      {/* Documentenarchief */}
      <section>
        <div className="mb-2">
          <span
            className="text-[12px] font-bold uppercase tracking-[0.12em]"
            style={{ color: C.cyan }}
          >
            Documentenarchief · P350
          </span>
        </div>
        <div style={{ border: `1px solid ${C.line}` }}>
          {DOCUMENTEN.map((d, i) => {
            const m = statusMeta(d.status);
            return (
              <div
                key={d.naam}
                className="flex items-center gap-3 px-3 py-2.5"
                style={{ background: i % 2 ? C.rowAlt : "transparent" }}
              >
                <span className="shrink-0 text-[11px] font-bold" style={{ color: C.magenta }}>
                  {d.type}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12.5px]" style={{ color: C.ink }}>
                  {d.naam}
                </span>
                <span
                  className="hidden shrink-0 text-[11px] tabular-nums sm:inline"
                  style={{ color: C.faint }}
                >
                  {d.grootte}
                </span>
                <span
                  className="shrink-0 text-[11px] font-bold uppercase"
                  style={{ color: toneHex(m.tone) }}
                >
                  {m.glyph}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* ---------- Acties (400) ---------- */

function Acties() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Kicker color={C.red}>Pagina 400 · Prioriteiten</Kicker>
        <div className="mt-1.5">
          <DoubleHead color={C.red}>Volgende acties</DoubleHead>
        </div>
        <p className="mt-2 text-[13px]" style={{ color: C.dim }}>
          Op volgorde van urgentie — begin bovenaan.
        </p>
      </div>

      <ol className="space-y-2.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const col = warn ? C.yellow : C.cyan;
          return (
            <li
              key={a.titel}
              className="flex gap-3 px-1 py-3"
              style={{ borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center text-[13px] font-bold tabular-nums"
                style={{ background: col, color: "#000" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag color={col}>{warn ? "Waarschuwing" : "Melding"}</Tag>
                  <span className="text-[13.5px] font-semibold" style={{ color: C.ink }}>
                    {a.titel}
                  </span>
                </div>
                <p className="mt-1 text-[12.5px]" style={{ color: C.dim }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 self-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em] transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                style={{ border: `1px solid ${col}`, color: col }}
              >
                {a.cta}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="flex items-center gap-3 px-3 py-3" style={{ border: `1px solid ${C.green}` }}>
        <span className="text-[16px]" style={{ color: C.green }} aria-hidden="true">
          {"✔"}
        </span>
        <p className="text-[12.5px]" style={{ color: C.dim }}>
          Verder is alles bijgewerkt. Nieuwe acties verschijnen automatisch op deze pagina.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen (500) ---------- */

function Facturen() {
  const statusTone: Record<string, Tone> = {
    Betaald: "green",
    Openstaand: "yellow",
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
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Kicker>Pagina 500 · Financiën</Kicker>
        <div className="mt-1.5">
          <DoubleHead>Facturen</DoubleHead>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px" style={{ background: C.line }}>
        <div className="px-3 py-3" style={{ background: C.canvas }}>
          <p className="text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.dim }}>
            Ontvangen
          </p>
          <p className="mt-1 text-[22px] font-bold tabular-nums" style={{ color: C.green }}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </div>
        <div className="px-3 py-3" style={{ background: C.canvas }}>
          <p className="text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.dim }}>
            Openstaand
          </p>
          <p className="mt-1 text-[22px] font-bold tabular-nums" style={{ color: C.yellow }}>
            € {open.toLocaleString("nl-NL")}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto" style={{ border: `1px solid ${C.line}` }}>
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="uppercase tracking-[0.08em]" style={{ color: C.cyan }}>
              <th className="px-3 py-2.5 font-bold">Nummer</th>
              <th className="px-3 py-2.5 font-bold">Klant</th>
              <th className="hidden px-3 py-2.5 font-bold sm:table-cell">Datum</th>
              <th className="px-3 py-2.5 text-right font-bold">Bedrag</th>
              <th className="px-3 py-2.5 text-right font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => {
              const tone = statusTone[f.status] ?? "cyan";
              return (
                <tr key={f.nr} style={{ background: i % 2 ? C.rowAlt : "transparent" }}>
                  <td className="px-3 py-2.5 tabular-nums" style={{ color: C.dim }}>
                    {f.nr}
                  </td>
                  <td className="px-3 py-2.5 font-semibold" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="hidden px-3 py-2.5 tabular-nums sm:table-cell"
                    style={{ color: C.faint }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-3 py-2.5 text-right font-bold tabular-nums"
                    style={{ color: C.yellow }}
                  >
                    {f.bedrag}
                  </td>
                  <td
                    className="px-3 py-2.5 text-right font-bold uppercase"
                    style={{ color: toneHex(tone) }}
                  >
                    {f.status}
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

/* ---------- Berichten (600) ---------- */

function Berichten() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Kicker color={C.green}>Pagina 600 · Comms</Kicker>
        <div className="mt-1.5">
          <DoubleHead color={C.green}>Berichten</DoubleHead>
        </div>
        <p className="mt-2 text-[13px]" style={{ color: C.dim }}>
          <span className="font-bold" style={{ color: C.yellow }}>
            {ongelezen}
          </span>{" "}
          ongelezen berichten.
        </p>
      </div>
      <div style={{ border: `1px solid ${C.line}` }}>
        {BERICHTEN.map((b, i) => (
          <div
            key={b.van}
            className="flex items-center gap-3 px-3 py-3"
            style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center text-[12px] font-bold"
              style={{
                border: `1px solid ${b.ongelezen ? C.yellow : C.line}`,
                color: b.ongelezen ? C.yellow : C.dim,
              }}
            >
              {b.initialen}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[13px] font-semibold" style={{ color: C.ink }}>
                  {b.van}
                </p>
                {b.ongelezen && <Cursor color={C.yellow} />}
              </div>
              <p className="truncate text-[12px]" style={{ color: C.dim }}>
                {b.preview}
              </p>
            </div>
            <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint }}>
              {b.tijd}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
