"use client";

// Concept 352 — "Diepzee" · Bioluminescent deep-dark.
// Diep marineblauw/inkt (#06121f → #0b1f33) met cyaan/aqua bioluminescente glow-accenten
// (#4de3d0 / #5ec8ff). Diepte ontstaat door gelaagde zachte gloed, blur en drijvende deeltjes —
// rustig, premium, mysterieus maar altijd leesbaar (contrast bewaakt). Sora als display, Manrope
// voor lopende tekst, Geist Mono voor cijfers/tabulaire waarden.

import { useState } from "react";
import {
  ArrowUpRight,
  Search,
  Check,
  Clock,
  AlertTriangle,
  ChevronRight,
  Waves,
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
  abyss: "#06121f",
  deep: "#0a1a2b",
  panel: "rgba(13,32,52,0.72)",
  panelSolid: "#0b1f33",
  aqua: "#4de3d0",
  glow: "#5ec8ff",
  ink: "#dbe9f2",
  muted: "#7f9bb0",
  faint: "#4f6c82",
  hair: "rgba(94,200,255,0.14)",
  hairSoft: "rgba(219,233,242,0.07)",
  ok: "#4de3d0",
  warn: "#ffcf6e",
  bad: "#ff8a8a",
};

const display = { fontFamily: "var(--font-lab-sora)" };
const ui = { fontFamily: "var(--font-lab-manrope)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; color: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, color: C.aqua };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, color: C.glow };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, color: C.warn };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, color: C.bad };
  }
}

function glowText(color: string, blur = 14) {
  return { textShadow: `0 0 ${blur}px ${color}66` };
}

function Kicker({ children, color = C.aqua }: { children: React.ReactNode; color?: string }) {
  return (
    <p
      className="text-[10.5px] font-semibold uppercase"
      style={{ ...mono, color, letterSpacing: "0.28em", ...glowText(color, 10) }}
    >
      {children}
    </p>
  );
}

// Zwevende bioluminescente deeltjes als achtergrond-diepte.
function Plankton() {
  const dots = [
    { top: "12%", left: "18%", s: 3, d: "0s", c: C.aqua },
    { top: "28%", left: "72%", s: 2, d: "1.2s", c: C.glow },
    { top: "55%", left: "40%", s: 4, d: "0.6s", c: C.aqua },
    { top: "70%", left: "84%", s: 2, d: "2.1s", c: C.glow },
    { top: "82%", left: "26%", s: 3, d: "1.6s", c: C.aqua },
    { top: "40%", left: "9%", s: 2, d: "0.9s", c: C.glow },
    { top: "18%", left: "52%", s: 2, d: "2.6s", c: C.aqua },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {dots.map((p, i) => (
        <span
          key={i}
          className="diepzee-float absolute rounded-full"
          style={{
            top: p.top,
            left: p.left,
            width: p.s,
            height: p.s,
            background: p.c,
            boxShadow: `0 0 ${p.s * 4}px ${p.c}`,
            animationDelay: p.d,
          }}
        />
      ))}
    </div>
  );
}

export function Concept352() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{
        ...ui,
        color: C.ink,
        background: `radial-gradient(1200px 600px at 20% -10%, #0e2740 0%, ${C.deep} 45%, ${C.abyss} 100%)`,
      }}
    >
      <style>{`
        @keyframes diepzeeFloat {
          0%,100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-14px); opacity: 1; }
        }
        .diepzee-float { animation: diepzeeFloat 6s ease-in-out infinite; }
        @keyframes diepzeePulse {
          0%,100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .diepzee-pulse { animation: diepzeePulse 3s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .diepzee-float, .diepzee-pulse { animation: none !important; }
        }
      `}</style>

      <Plankton />

      <div className="relative">
        <header className="flex items-center justify-between gap-4 px-5 py-5 md:px-9">
          <div className="flex items-center gap-3">
            <span
              className="diepzee-pulse flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{
                background: "rgba(77,227,208,0.1)",
                border: `1px solid ${C.hair}`,
                boxShadow: `0 0 24px ${C.aqua}44`,
              }}
              aria-hidden="true"
            >
              <Waves size={18} style={{ color: C.aqua }} />
            </span>
            <div className="leading-tight">
              <p
                className="text-[16px] font-semibold"
                style={{ ...display, ...glowText(C.glow, 12) }}
              >
                Diepzee
              </p>
              <p
                className="text-[10px] uppercase"
                style={{ color: C.faint, letterSpacing: "0.26em" }}
              >
                ZZP · onder de oppervlakte
              </p>
            </div>
          </div>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-[12px] font-semibold"
            style={{
              ...mono,
              background: "rgba(94,200,255,0.08)",
              border: `1px solid ${C.hair}`,
              color: C.glow,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </header>

        <nav
          className="flex items-center gap-1.5 overflow-x-auto px-4 pb-4 md:px-9"
          aria-label="Hoofdnavigatie"
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="shrink-0 rounded-full px-4 py-2 text-[12.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2"
                style={{
                  color: on ? C.abyss : C.muted,
                  background: on ? C.aqua : "rgba(219,233,242,0.04)",
                  border: `1px solid ${on ? "transparent" : C.hairSoft}`,
                  boxShadow: on ? `0 0 22px ${C.aqua}55` : "none",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </nav>

        <main className="px-4 pb-9 md:px-9">
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

function Card({
  children,
  glow = false,
  className = "",
}: {
  children: React.ReactNode;
  glow?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl backdrop-blur-sm ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${glow ? C.hair : C.hairSoft}`,
        boxShadow: glow
          ? `0 0 60px rgba(77,227,208,0.08), inset 0 1px 0 rgba(255,255,255,0.03)`
          : "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      {children}
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="space-y-4">
      <Card glow className="overflow-hidden p-6 md:p-8">
        <Kicker>Vandaag · dieptepeiling</Kicker>
        <h1
          className="mt-4 text-[32px] font-semibold leading-[1.08] tracking-[-0.01em] sm:text-[40px]"
          style={{ ...display, ...glowText(C.glow, 18) }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
        </h1>
        <p className="mt-4 max-w-md text-[14px] leading-relaxed" style={{ color: C.muted }}>
          De stroming is rustig. Drie signalen lichten op in de diepte — het felste vraagt vandaag
          je aandacht.
        </p>
        <button
          onClick={onOpen}
          className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:translate-y-0"
          style={{ background: C.aqua, color: C.abyss, boxShadow: `0 0 28px ${C.aqua}66` }}
        >
          {ACTIES[0]?.cta} <ArrowUpRight size={15} aria-hidden="true" />
        </button>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} className="p-4">
            <p className="text-[11px]" style={{ color: C.faint }}>
              {k.label}
            </p>
            <p
              className="mt-2 text-[26px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink, ...glowText(C.glow, 8) }}
            >
              {k.value}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span
                className="text-[11px] tabular-nums"
                style={{ ...mono, color: k.up ? C.aqua : C.warn }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </span>
              <Sparkline data={k.spark} up={k.up} />
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <Kicker>Signalen — opdrachten voor jou</Kicker>
          <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.faint }}>
            {OPDRACHTEN.length}
          </span>
        </div>
        <ul className="space-y-3">
          {OPDRACHTEN.map((o) => (
            <OpdrachtRow key={o.id} o={o} onOpen={onOpen} />
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 52;
  const h = 20;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");
  const stroke = up ? C.aqua : C.warn;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${stroke})` }}
      />
    </svg>
  );
}

function OpdrachtRow({ o, onOpen }: { o: Opdracht; onOpen: () => void }) {
  return (
    <li
      className="group flex flex-wrap items-center gap-3 rounded-xl p-3 transition-colors"
      style={{ background: "rgba(219,233,242,0.03)", border: `1px solid ${C.hairSoft}` }}
    >
      <MatchOrb value={o.match} />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium" style={{ color: C.ink }}>
          {o.titel}
        </p>
        <p className="text-[11.5px]" style={{ color: C.muted }}>
          {o.opdrachtgever} · {o.plaats} · {o.tarief}
        </p>
      </div>
      <button
        onClick={onOpen}
        className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 group-hover:text-[#4de3d0]"
        style={{ color: C.muted, border: `1px solid ${C.hairSoft}` }}
      >
        Openen <ChevronRight size={13} aria-hidden="true" />
      </button>
    </li>
  );
}

function MatchOrb({ value, size = 44 }: { value: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(219,233,242,0.1)"
          strokeWidth={3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.aqua}
          strokeWidth={3}
          strokeDasharray={circ}
          strokeDashoffset={off}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 5px ${C.aqua})` }}
        />
      </svg>
      <span
        className="absolute text-[11px] font-semibold tabular-nums"
        style={{ ...mono, color: C.aqua }}
      >
        {value}
      </span>
    </span>
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
    <div className="space-y-4">
      <Card glow className="p-6">
        <Kicker>Marktplaats · open water</Kicker>
        <h1
          className="mt-3 text-[28px] font-semibold tracking-[-0.01em]"
          style={{ ...display, ...glowText(C.glow, 14) }}
        >
          Open opdrachten
        </h1>
        <div
          className="mt-5 flex items-center gap-3 rounded-full px-4 py-2.5"
          style={{ background: "rgba(6,18,31,0.6)", border: `1px solid ${C.hair}` }}
        >
          <Search size={16} style={{ color: C.faint }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Peil naar titel, opdrachtgever of plaats…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#4f6c82]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2"
              style={{ color: C.aqua }}
            >
              Wissen
            </button>
          )}
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <span
            className="diepzee-pulse mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "rgba(94,200,255,0.08)", boxShadow: `0 0 30px ${C.glow}44` }}
            aria-hidden="true"
          >
            <Search size={22} style={{ color: C.glow }} />
          </span>
          <p className="mt-5 text-[20px] font-semibold" style={{ ...display, color: C.ink }}>
            Niets in dit water
          </p>
          <p
            className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed"
            style={{ color: C.muted }}
          >
            Geen opdracht licht op bij &ldquo;{q}&rdquo;. Peil breder of wis je zoekopdracht om alle
            signalen te tonen.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:translate-y-0"
            style={{ background: C.aqua, color: C.abyss, boxShadow: `0 0 24px ${C.aqua}55` }}
          >
            Zoekopdracht wissen
          </button>
        </Card>
      ) : (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <Kicker color={C.glow}>Resultaten</Kicker>
            <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.faint }}>
              {filtered.length} / {OPDRACHTEN.length}
            </span>
          </div>
          <ul className="space-y-3">
            {filtered.map((o) => (
              <OpdrachtRow key={o.id} o={o} onOpen={onOpen} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [tab, setTab] = useState<"match" | "detail">("match");
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium transition-colors hover:text-[#4de3d0] focus-visible:outline-none focus-visible:ring-2"
        style={{ color: C.muted }}
      >
        <ChevronRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Card glow className="p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="rounded-full px-3 py-1 text-[11px]"
            style={{ ...mono, background: "rgba(94,200,255,0.1)", color: C.glow }}
          >
            {opdracht.id}
          </span>
          <MatchOrb value={opdracht.match} size={40} />
        </div>
        <h1
          className="mt-4 max-w-2xl text-[26px] font-semibold leading-[1.12] tracking-[-0.01em]"
          style={{ ...display, ...glowText(C.glow, 14) }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[14px]" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <button
          className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:translate-y-0"
          style={{ background: C.aqua, color: C.abyss, boxShadow: `0 0 28px ${C.aqua}66` }}
        >
          Reageer op opdracht <ArrowUpRight size={15} aria-hidden="true" />
        </button>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Card key={m.l} className="p-4">
            <p
              className="text-[10.5px] uppercase"
              style={{ color: C.faint, letterSpacing: "0.16em" }}
            >
              {m.l}
            </p>
            <p
              className="mt-2 text-[16px] font-semibold tabular-nums"
              style={{ ...mono, color: C.ink }}
            >
              {m.v}
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="mb-4 flex gap-2">
          {(["match", "detail"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              aria-current={tab === t ? "true" : undefined}
              className="rounded-full px-4 py-1.5 text-[12px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2"
              style={{
                color: tab === t ? C.abyss : C.muted,
                background: tab === t ? C.glow : "rgba(219,233,242,0.04)",
                boxShadow: tab === t ? `0 0 18px ${C.glow}55` : "none",
              }}
            >
              {t === "match" ? "Waarom deze match" : "Kenmerken"}
            </button>
          ))}
        </div>
        {tab === "match" ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <Kicker>Wat past</Kicker>
              <ul className="mt-3 space-y-2.5">
                {opdracht.redenen.plus.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2.5 text-[13.5px]"
                    style={{ color: C.ink }}
                  >
                    <Check size={15} style={{ color: C.aqua, marginTop: 2 }} aria-hidden="true" />
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
                className="rounded-full px-3 py-1.5 text-[12px]"
                style={{
                  background: "rgba(77,227,208,0.08)",
                  color: C.aqua,
                  border: `1px solid ${C.hairSoft}`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-4">
      <Card glow className="flex flex-wrap items-center gap-6 p-6">
        <MatchOrb value={pct} size={72} />
        <div className="min-w-0 flex-1">
          <Kicker>Vertrouwensdiepte · {PROFIEL.trust}</Kicker>
          <h1
            className="mt-2 text-[24px] font-semibold"
            style={{ ...display, ...glowText(C.glow, 12) }}
          >
            Verificatie
          </h1>
          <p className="mt-2 max-w-md text-[13px] leading-relaxed" style={{ color: C.muted }}>
            {verified} van {CREDENTIALS.length} credentials volledig geverifieerd. Eén dobbert
            richting de oppervlakte en vraagt binnenkort actie.
          </p>
        </div>
      </Card>

      <Card className="p-5">
        <Kicker color={C.glow}>Credentials</Kicker>
        <ul className="mt-4 space-y-2.5">
          {CREDENTIALS.map((c) => {
            const m = statusMeta(c.status);
            return (
              <li
                key={c.naam}
                className="flex flex-wrap items-center gap-3 rounded-xl p-3 transition-colors"
                style={{ background: "rgba(219,233,242,0.03)", border: `1px solid ${C.hairSoft}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: `${m.color}1a`, boxShadow: `0 0 14px ${m.color}33` }}
                  aria-hidden="true"
                >
                  <m.Icon size={16} style={{ color: m.color }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium" style={{ color: C.ink }}>
                    {c.naam}
                  </p>
                  <p className="text-[11.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <span className="text-[11px] font-medium" style={{ color: m.color }}>
                  {m.label}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

function Acties() {
  const tone: Record<string, string> = { warning: C.warn, info: C.glow };
  return (
    <div className="space-y-4">
      <Card glow className="p-6">
        <Kicker>Signaallichten · volgende acties</Kicker>
        <h1
          className="mt-2 text-[26px] font-semibold"
          style={{ ...display, ...glowText(C.glow, 12) }}
        >
          Aandacht
        </h1>
      </Card>
      <ol className="space-y-3">
        {ACTIES.map((a, i) => (
          <Card key={a.titel} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <span
              className="diepzee-pulse flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums"
              style={{
                ...mono,
                background: `${tone[a.urgentie]}1a`,
                color: tone[a.urgentie],
                boxShadow: `0 0 18px ${tone[a.urgentie]}44`,
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
              className="shrink-0 self-start rounded-full px-4 py-2 text-[12px] font-medium transition-colors hover:text-[#4de3d0] focus-visible:outline-none focus-visible:ring-2 sm:self-center"
              style={{ color: C.muted, border: `1px solid ${C.hair}` }}
            >
              {a.cta}
            </button>
          </Card>
        ))}
      </ol>
    </div>
  );
}

function Facturen() {
  const total = "€ 8.622";
  const toneFor = (s: string) => (s === "Betaald" ? C.aqua : s === "Openstaand" ? C.warn : C.faint);
  return (
    <div className="space-y-4">
      <Card glow className="flex flex-wrap items-end justify-between gap-4 p-6">
        <div>
          <Kicker>Getij · facturen</Kicker>
          <p
            className="mt-3 text-[34px] font-semibold tabular-nums leading-none"
            style={{ ...mono, color: C.ink, ...glowText(C.glow, 14) }}
          >
            {total}
          </p>
          <p
            className="mt-2 text-[12px] uppercase"
            style={{ color: C.faint, letterSpacing: "0.16em" }}
          >
            Totaal betaald dit kwartaal
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:translate-y-0"
          style={{ background: C.aqua, color: C.abyss, boxShadow: `0 0 24px ${C.aqua}55` }}
        >
          Nieuwe factuur
        </button>
      </Card>

      <Card className="p-5">
        <Kicker color={C.glow}>Regels</Kicker>
        <ul className="mt-4 divide-y" style={{ borderColor: C.hairSoft }}>
          {FACTUREN.map((f) => (
            <li
              key={f.nr}
              className="flex flex-wrap items-center gap-3 py-3"
              style={{ borderColor: C.hairSoft }}
            >
              <span
                className="w-28 shrink-0 text-[11.5px] tabular-nums"
                style={{ ...mono, color: C.faint }}
              >
                {f.nr}
              </span>
              <span className="min-w-0 flex-1 text-[13.5px]" style={{ color: C.ink }}>
                {f.klant}
              </span>
              <span
                className="hidden text-[11.5px] tabular-nums sm:inline"
                style={{ ...mono, color: C.muted }}
              >
                {f.datum}
              </span>
              <span className="w-24 text-[11.5px] font-medium" style={{ color: toneFor(f.status) }}>
                {f.status}
              </span>
              <span
                className="w-24 text-right text-[14px] font-semibold tabular-nums"
                style={{ ...mono, color: C.ink }}
              >
                {f.bedrag}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
