"use client";

// Concept 351 — "Baken" · Vertrektijdenbord / split-flap dot-matrix.
// Kinetische typografie met mechanische flip/tick-esthetiek: amber (#f5b544) op diep antraciet
// (#15171c), tabulaire mono-cijfers als bestemmingsborden. Een NS/luchthaven departure board,
// vertaald naar een strak, verfijnd dashboard. Flap-cellen tikken subtiel in beeld (motion-reduce
// gerespecteerd). Mono = Spline Mono voor de borden, Manrope als rustige sans voor lopende tekst.

import { useState } from "react";
import {
  ArrowUpRight,
  Search,
  Check,
  Clock,
  AlertTriangle,
  ChevronRight,
  Circle,
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

const C = {
  bg: "#15171c",
  panel: "#191c22",
  cell: "#0f1115",
  cellTop: "#1c2028",
  amber: "#f5b544",
  amberDim: "#8a6a2e",
  ink: "#e8e2d4",
  muted: "#8b8f98",
  faint: "#5b606b",
  hair: "rgba(245,181,68,0.14)",
  hairSoft: "rgba(232,226,212,0.08)",
  ok: "#6fbf8f",
  warn: "#f5b544",
  bad: "#e07a5f",
};

const board = { fontFamily: "var(--font-lab-spline-mono)" };
const ui = { fontFamily: "var(--font-lab-manrope)" };

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; color: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "GEVERIFIEERD", Icon: Check, color: C.ok };
    case "SUBMITTED":
      return { label: "IN BEOORDELING", Icon: Clock, color: C.amber };
    case "EXPIRING":
      return { label: "VERLOOPT", Icon: AlertTriangle, color: C.warn };
    case "REJECTED":
      return { label: "AFGEWEZEN", Icon: AlertTriangle, color: C.bad };
  }
}

// Split-flap tekstcel: elk teken zit in een eigen mechanische flap met middenlijn.
function Flap({
  text,
  size = "md",
  color = C.amber,
  delayStep = 45,
}: {
  text: string;
  size?: "sm" | "md" | "lg" | "xl";
  color?: string;
  delayStep?: number;
}) {
  const dims: Record<string, { w: string; h: string; f: string }> = {
    sm: { w: "0.72em", h: "1.25em", f: "13px" },
    md: { w: "0.78em", h: "1.3em", f: "18px" },
    lg: { w: "0.82em", h: "1.35em", f: "30px" },
    xl: { w: "0.86em", h: "1.4em", f: "46px" },
  };
  const d = dims[size] ?? { w: "0.78em", h: "1.3em", f: "18px" };
  const chars = text.split("");
  return (
    <span
      className="inline-flex items-stretch gap-[2px] align-middle"
      style={{ ...board, fontSize: d.f }}
      aria-hidden="true"
    >
      {chars.map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          className="baken-flap relative inline-flex items-center justify-center overflow-hidden rounded-[3px]"
          style={{
            width: ch === " " ? "0.34em" : d.w,
            height: d.h,
            background: ch === " " ? "transparent" : C.cell,
            color,
            boxShadow: ch === " " ? "none" : "inset 0 1px 0 rgba(255,255,255,0.05)",
            animationDelay: `${i * delayStep}ms`,
            lineHeight: 1,
            fontWeight: 500,
          }}
        >
          {ch !== " " && (
            <span
              className="pointer-events-none absolute inset-x-0 top-1/2 h-px"
              style={{ background: "rgba(0,0,0,0.55)" }}
            />
          )}
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  );
}

function Kicker({ children, color = C.faint }: { children: React.ReactNode; color?: string }) {
  return (
    <p
      className="text-[10.5px] font-medium uppercase"
      style={{ ...board, color, letterSpacing: "0.34em" }}
    >
      {children}
    </p>
  );
}

function GateTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-[3px] px-2 py-0.5 text-[10px] uppercase"
      style={{ ...board, background: C.cellTop, color: C.amber, letterSpacing: "0.14em" }}
    >
      {children}
    </span>
  );
}

export function Concept351() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.bg, color: C.ink }}
    >
      <style>{`
        @keyframes bakenFlip {
          0% { transform: translateY(-46%) rotateX(-58deg); opacity: 0; }
          60% { transform: translateY(4%) rotateX(6deg); opacity: 1; }
          100% { transform: translateY(0) rotateX(0deg); opacity: 1; }
        }
        .baken-flap { transform-origin: center top; animation: bakenFlip 420ms cubic-bezier(0.2,0.7,0.2,1) both; }
        @keyframes bakenTick { 0%,92%,100% { opacity: 1; } 96% { opacity: 0.35; } }
        .baken-tick { animation: bakenTick 2.4s steps(1,end) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .baken-flap, .baken-tick { animation: none !important; }
        }
      `}</style>

      {/* Bord-kop: stationshal-balk */}
      <header
        className="flex items-center justify-between gap-4 px-5 py-4 md:px-8"
        style={{ background: C.panel, borderBottom: `1px solid ${C.hair}` }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-[4px]"
            style={{ background: C.cell, border: `1px solid ${C.hair}` }}
            aria-hidden="true"
          >
            <Circle size={16} style={{ color: C.amber }} fill={C.amber} />
          </span>
          <div className="leading-tight">
            <p className="text-[15px] tracking-[0.12em]" style={{ ...board, color: C.amber }}>
              BAKEN
            </p>
            <p
              className="text-[10px] uppercase"
              style={{ color: C.faint, letterSpacing: "0.28em" }}
            >
              Vertrekbord · ZZP
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="baken-tick h-1.5 w-1.5 rounded-full" style={{ background: C.ok }} />
            <span className="text-[11px] tabular-nums" style={{ ...board, color: C.muted }}>
              LIVE 06:24
            </span>
          </div>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-[4px] text-[12px]"
            style={{ ...board, background: C.cell, border: `1px solid ${C.hair}`, color: C.amber }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Perron-navigatie */}
      <nav
        className="flex items-center gap-1 overflow-x-auto px-4 py-2.5 md:px-8"
        aria-label="Hoofdnavigatie"
        style={{ background: C.cell, borderBottom: `1px solid ${C.hairSoft}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-[3px] px-3 py-1.5 text-[11px] uppercase transition-colors focus-visible:outline-none focus-visible:ring-2"
              style={{
                ...board,
                letterSpacing: "0.16em",
                color: on ? C.bg : C.muted,
                background: on ? C.amber : "transparent",
                fontWeight: on ? 600 : 500,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </nav>

      <main className="px-4 py-6 md:px-8 md:py-9">
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
  );
}

function Panel({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-[6px]"
      style={{ background: C.panel, border: `1px solid ${C.hairSoft}` }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: `1px solid ${C.hairSoft}` }}
      >
        <Kicker color={C.muted}>{title}</Kicker>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="space-y-5">
      {/* Groot bestemmingsbord */}
      <section
        className="rounded-[6px] p-5 md:p-7"
        style={{ background: C.panel, border: `1px solid ${C.hair}` }}
      >
        <div className="flex items-center justify-between">
          <Kicker>Vandaag · Vertrekhal</Kicker>
          <GateTag>Gate 07</GateTag>
        </div>
        <div className="mt-5">
          <Flap text="GOEDEMORGEN" size="lg" />
        </div>
        <div className="mt-2">
          <Flap text={(PROFIEL.naam.split(" ")[0] ?? "").toUpperCase()} size="xl" color={C.ink} />
        </div>
        <p className="mt-5 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
          Drie vertrekken op je bord vragen aandacht. Het dichtstbijzijnde vertrekt zo — reageer
          voor de gate sluit.
        </p>
      </section>

      {/* KPI-borden */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="rounded-[6px] p-4"
            style={{ background: C.panel, border: `1px solid ${C.hairSoft}` }}
          >
            <p
              className="text-[10px] uppercase"
              style={{ color: C.faint, letterSpacing: "0.22em" }}
            >
              {k.label}
            </p>
            <div className="mt-3">
              <Flap text={k.value} size="md" />
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <span
                className="text-[11px] tabular-nums"
                style={{ ...board, color: k.up ? C.ok : C.warn }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </span>
              <MiniBars data={k.spark} up={k.up} />
            </div>
          </div>
        ))}
      </div>

      {/* Vertrekbord met opdrachten */}
      <Panel
        title="Vertrekken — opdrachten voor jou"
        right={
          <span className="text-[10px] tabular-nums" style={{ ...board, color: C.faint }}>
            {OPDRACHTEN.length} REGELS
          </span>
        }
      >
        <DepartureBoard items={OPDRACHTEN} onOpen={onOpen} />
      </Panel>
    </div>
  );
}

function MiniBars({ data, up }: { data: number[]; up: boolean }) {
  const max = Math.max(...data);
  return (
    <span className="ml-auto flex h-5 items-end gap-[2px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="w-[3px] rounded-[1px]"
          style={{
            height: `${Math.max(12, (v / max) * 100)}%`,
            background: i === data.length - 1 ? (up ? C.ok : C.warn) : C.amberDim,
            opacity: i === data.length - 1 ? 1 : 0.5,
          }}
        />
      ))}
    </span>
  );
}

function DepartureBoard({ items, onOpen }: { items: Opdracht[]; onOpen: () => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ color: C.faint }}>
            {["Vertrek", "Bestemming", "Perron", "Tarief", "Match", ""].map((h) => (
              <th
                key={h || "cta"}
                className="whitespace-nowrap px-2 py-2 text-left text-[10px] uppercase"
                style={{
                  ...board,
                  letterSpacing: "0.16em",
                  borderBottom: `1px solid ${C.hairSoft}`,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((o) => (
            <tr
              key={o.id}
              className="group transition-colors hover:bg-[#1c2028]"
              style={{ borderBottom: `1px solid ${C.hairSoft}` }}
            >
              <td className="px-2 py-3 align-middle">
                <Flap
                  text={o.start.replace("Per ", "").replace("Flexibel", "FLEX").toUpperCase()}
                  size="sm"
                />
              </td>
              <td className="px-2 py-3 align-middle">
                <p className="text-[13.5px] font-medium" style={{ color: C.ink }}>
                  {o.titel}
                </p>
                <p className="text-[11px]" style={{ color: C.muted }}>
                  {o.opdrachtgever}
                </p>
              </td>
              <td className="whitespace-nowrap px-2 py-3 align-middle">
                <span className="text-[12px] tabular-nums" style={{ ...board, color: C.muted }}>
                  {o.plaats}
                </span>
              </td>
              <td className="whitespace-nowrap px-2 py-3 align-middle">
                <Flap
                  text={o.tarief.replace("€ ", "€").replace(" / uur", "")}
                  size="sm"
                  color={C.ink}
                />
              </td>
              <td className="px-2 py-3 align-middle">
                <span
                  className="inline-flex items-center rounded-[3px] px-2 py-1 text-[12px] tabular-nums"
                  style={{ ...board, background: C.cell, color: C.amber }}
                >
                  {o.match}%
                </span>
              </td>
              <td className="px-2 py-3 text-right align-middle">
                <button
                  onClick={onOpen}
                  className="inline-flex items-center gap-1 rounded-[3px] px-2.5 py-1.5 text-[11px] uppercase transition-colors hover:bg-[#f5b544] hover:text-[#15171c] focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    ...board,
                    border: `1px solid ${C.hair}`,
                    color: C.amber,
                    letterSpacing: "0.1em",
                  }}
                >
                  Instap <ChevronRight size={12} aria-hidden="true" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
    <div className="space-y-5">
      <section
        className="rounded-[6px] p-5"
        style={{ background: C.panel, border: `1px solid ${C.hair}` }}
      >
        <Kicker>Marktplaats · Alle vertrekken</Kicker>
        <div className="mt-4">
          <Flap text="OPEN OPDRACHTEN" size="lg" />
        </div>
        <div
          className="mt-5 flex items-center gap-3 rounded-[4px] px-3 py-2.5"
          style={{ background: C.cell, border: `1px solid ${C.hairSoft}` }}
        >
          <Search size={16} style={{ color: C.faint }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek bestemming, opdrachtgever of plaats…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#5b606b]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="rounded-[3px] px-2 py-0.5 text-[11px] uppercase focus-visible:outline-none focus-visible:ring-2"
              style={{ ...board, color: C.amber, letterSpacing: "0.1em" }}
            >
              Wis
            </button>
          )}
        </div>
      </section>

      {filtered.length === 0 ? (
        <div
          className="rounded-[6px] px-6 py-16 text-center"
          style={{ background: C.panel, border: `1px dashed ${C.hair}` }}
        >
          <div className="inline-block">
            <Flap text="GEEN VERTREK" size="md" color={C.muted} />
          </div>
          <p
            className="mx-auto mt-5 max-w-sm text-[13px] leading-relaxed"
            style={{ color: C.muted }}
          >
            Geen enkele regel op het bord past bij &ldquo;{q}&rdquo;. Verruim je zoekterm of wis het
            filter om alle vertrekken te tonen.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-6 inline-flex items-center gap-2 rounded-[4px] px-4 py-2 text-[11px] uppercase transition-colors hover:bg-[#f5b544] hover:text-[#15171c] focus-visible:outline-none focus-visible:ring-2"
            style={{
              ...board,
              border: `1px solid ${C.hair}`,
              color: C.amber,
              letterSpacing: "0.14em",
            }}
          >
            Toon alle vertrekken
          </button>
        </div>
      ) : (
        <Panel
          title="Vertrekbord"
          right={
            <span className="text-[10px] tabular-nums" style={{ ...board, color: C.faint }}>
              {filtered.length} / {OPDRACHTEN.length}
            </span>
          }
        >
          <DepartureBoard items={filtered} onOpen={onOpen} />
        </Panel>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [tab, setTab] = useState<"match" | "detail">("match");
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[11px] uppercase transition-colors hover:text-[#f5b544] focus-visible:outline-none focus-visible:ring-2"
        style={{ ...board, color: C.muted, letterSpacing: "0.14em" }}
      >
        <ChevronRight size={13} className="rotate-180" aria-hidden="true" /> Terug naar bord
      </button>

      <section
        className="rounded-[6px] p-5 md:p-7"
        style={{ background: C.panel, border: `1px solid ${C.hair}` }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <GateTag>{opdracht.id}</GateTag>
          <span
            className="rounded-[3px] px-2 py-1 text-[12px] tabular-nums"
            style={{ ...board, background: C.cell, color: C.amber }}
          >
            {opdracht.match}% MATCH
          </span>
          <span
            className="baken-tick text-[11px] uppercase"
            style={{ color: C.ok, letterSpacing: "0.14em" }}
          >
            ● Gate open
          </span>
        </div>
        <div className="mt-5">
          <Flap text={opdracht.titel.toUpperCase()} size="md" color={C.ink} />
        </div>
        <p className="mt-3 text-[13.5px]" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <button
          className="mt-6 inline-flex items-center gap-2 rounded-[4px] px-5 py-2.5 text-[12px] font-semibold uppercase transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:translate-y-0"
          style={{ ...board, background: C.amber, color: C.bg, letterSpacing: "0.1em" }}
        >
          Reageer op opdracht <ArrowUpRight size={15} aria-hidden="true" />
        </button>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief.replace("€ ", "€").replace(" / uur", "") },
          { l: "Omvang", v: opdracht.uren.replace(" u/week", "u") },
          { l: "Start", v: opdracht.start.replace("Per ", "").toUpperCase() },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div
            key={m.l}
            className="rounded-[6px] p-4"
            style={{ background: C.panel, border: `1px solid ${C.hairSoft}` }}
          >
            <p className="text-[10px] uppercase" style={{ color: C.faint, letterSpacing: "0.2em" }}>
              {m.l}
            </p>
            <div className="mt-2">
              <Flap text={m.v} size="sm" />
            </div>
          </div>
        ))}
      </div>

      <Panel
        title="Bordinformatie"
        right={
          <div className="flex gap-1">
            {(["match", "detail"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                aria-current={tab === t ? "true" : undefined}
                className="rounded-[3px] px-2.5 py-1 text-[10px] uppercase focus-visible:outline-none focus-visible:ring-2"
                style={{
                  ...board,
                  letterSpacing: "0.12em",
                  background: tab === t ? C.amber : "transparent",
                  color: tab === t ? C.bg : C.muted,
                }}
              >
                {t === "match" ? "Match" : "Details"}
              </button>
            ))}
          </div>
        }
      >
        {tab === "match" ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <Kicker color={C.ok}>Wat past</Kicker>
              <ul className="mt-3 space-y-2.5">
                {opdracht.redenen.plus.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2.5 text-[13.5px]"
                    style={{ color: C.ink }}
                  >
                    <Check size={15} style={{ color: C.ok, marginTop: 2 }} aria-hidden="true" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Kicker color={C.warn}>Aandacht</Kicker>
              <ul className="mt-3 space-y-2.5">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2.5 text-[13.5px]"
                    style={{ color: C.muted }}
                  >
                    <AlertTriangle
                      size={15}
                      style={{ color: C.warn, marginTop: 2 }}
                      aria-hidden="true"
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-[3px] px-2.5 py-1 text-[11px] uppercase"
                style={{ ...board, background: C.cell, color: C.amber, letterSpacing: "0.1em" }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-5">
      <section
        className="rounded-[6px] p-5"
        style={{ background: C.panel, border: `1px solid ${C.hair}` }}
      >
        <Kicker>Vertrouwensbord · {PROFIEL.trust}</Kicker>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <Flap text={`${verified} / ${CREDENTIALS.length}`} size="xl" />
          <p className="mb-1 max-w-xs text-[13px] leading-relaxed" style={{ color: C.muted }}>
            credentials volledig geverifieerd. Eén vraagt binnenkort actie voordat de geldigheid
            verloopt.
          </p>
        </div>
      </section>

      <Panel title="Credentials — status">
        <ul className="space-y-2">
          {CREDENTIALS.map((c) => {
            const m = statusMeta(c.status);
            return (
              <li
                key={c.naam}
                className="flex flex-wrap items-center gap-3 rounded-[4px] px-3 py-3 transition-colors hover:bg-[#1c2028]"
                style={{ background: C.cell, border: `1px solid ${C.hairSoft}` }}
              >
                <m.Icon size={17} style={{ color: m.color }} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium" style={{ color: C.ink }}>
                    {c.naam}
                  </p>
                  <p className="text-[11.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <span
                  className="rounded-[3px] px-2 py-1 text-[10px] uppercase"
                  style={{ ...board, background: C.panel, color: m.color, letterSpacing: "0.12em" }}
                >
                  {m.label}
                </span>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

function Acties() {
  const tone: Record<string, string> = { warning: C.warn, info: C.amber };
  return (
    <div className="space-y-5">
      <section
        className="rounded-[6px] p-5"
        style={{ background: C.panel, border: `1px solid ${C.hair}` }}
      >
        <Kicker>Omroepbord · Volgende acties</Kicker>
        <div className="mt-4">
          <Flap text="AANDACHT" size="lg" />
        </div>
      </section>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => (
          <li
            key={a.titel}
            className="flex flex-col gap-4 rounded-[6px] p-4 sm:flex-row sm:items-center"
            style={{ background: C.panel, border: `1px solid ${C.hairSoft}` }}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] text-[15px] tabular-nums"
              style={{
                ...board,
                background: C.cell,
                color: tone[a.urgentie],
                border: `1px solid ${C.hairSoft}`,
              }}
              aria-hidden="true"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium" style={{ color: C.ink }}>
                {a.titel}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
                {a.detail}
              </p>
            </div>
            <button
              className="shrink-0 self-start rounded-[4px] px-4 py-2 text-[11px] uppercase transition-colors hover:bg-[#f5b544] hover:text-[#15171c] focus-visible:outline-none focus-visible:ring-2 sm:self-center"
              style={{
                ...board,
                border: `1px solid ${C.hair}`,
                color: C.amber,
                letterSpacing: "0.1em",
              }}
            >
              {a.cta}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Facturen() {
  const total = "€ 8.622";
  const toneFor = (s: string) => (s === "Betaald" ? C.ok : s === "Openstaand" ? C.warn : C.faint);
  return (
    <div className="space-y-5">
      <section
        className="flex flex-wrap items-end justify-between gap-4 rounded-[6px] p-5"
        style={{ background: C.panel, border: `1px solid ${C.hair}` }}
      >
        <div>
          <Kicker>Omzetbord · Facturen</Kicker>
          <div className="mt-4">
            <Flap text={total} size="xl" />
          </div>
          <p
            className="mt-2 text-[12px] uppercase"
            style={{ color: C.faint, letterSpacing: "0.18em" }}
          >
            Totaal betaald dit kwartaal
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-[4px] px-4 py-2.5 text-[11px] font-semibold uppercase transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:translate-y-0"
          style={{ ...board, background: C.amber, color: C.bg, letterSpacing: "0.1em" }}
        >
          Nieuwe factuur
        </button>
      </section>

      <Panel title="Factuurregels">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ color: C.faint }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-2 py-2 text-left text-[10px] uppercase"
                    style={{
                      ...board,
                      letterSpacing: "0.14em",
                      borderBottom: `1px solid ${C.hairSoft}`,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[#1c2028]"
                  style={{ borderBottom: `1px solid ${C.hairSoft}` }}
                >
                  <td className="whitespace-nowrap px-2 py-3">
                    <span className="text-[12px] tabular-nums" style={{ ...board, color: C.muted }}>
                      {f.nr}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-[13px]" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td className="whitespace-nowrap px-2 py-3">
                    <span className="text-[12px] tabular-nums" style={{ ...board, color: C.muted }}>
                      {f.datum}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <span
                      className="text-[11px] uppercase"
                      style={{ color: toneFor(f.status), letterSpacing: "0.1em" }}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <Flap text={f.bedrag.replace("€ ", "€")} size="sm" color={C.ink} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
