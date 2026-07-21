"use client";

// Concept 443 — "Barcode" · Radicaal streepjescode-minimalisme. Alle structuur en scheiding wordt
// gedragen door dunne verticale zwarte balken op zuiver wit (#ffffff / #0a0a0a). Tabulaire cijfers
// overal, monospace-labels, één elektrisch accent (#ff3b00). Monochroom, ultra-strak, data-als-code.
// Geen rondingen, geen schaduw: enkel lijn, ritme en het felle accent waar actie nodig is.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  Clock,
  FileText,
  Minus,
  Plus,
  Search,
  ShieldCheck,
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

// — Palet: zuiver monochroom + één elektrisch accent —
const C = {
  paper: "#ffffff",
  paperSoft: "#f5f5f4",
  ink: "#0a0a0a",
  inkSoft: "#3a3a38",
  inkMute: "#6f6f6b",
  inkFaint: "#a3a39e",
  line: "#0a0a0a",
  lineSoft: "rgba(10,10,10,0.14)",
  lineHair: "rgba(10,10,10,0.08)",
  // elektrisch accent
  acc: "#ff3b00",
  accSoft: "rgba(255,59,0,0.1)",
  // status (monochroom + accent voor alarm)
  okInk: "#0a0a0a",
  warnInk: "#ff3b00",
  infoInk: "#3a3a38",
  badInk: "#ff3b00",
};

const bodyFont = {
  fontFamily: "'Inter', 'Helvetica Neue', Arial, system-ui, sans-serif",
};
const mono = {
  fontFamily: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};
const num = {
  fontFamily: "'Inter', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

// Deterministische streepjescode-strook: variabele balkbreedtes uit een seed. Puur decoratief ritme.
function barcodePattern(seed: string, count = 34): { w: number; gap: number }[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffff;
  const bars: { w: number; gap: number }[] = [];
  for (let i = 0; i < count; i++) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    const w = 1 + (h % 4);
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    const gap = 1 + (h % 3);
    bars.push({ w, gap });
  }
  return bars;
}

function Barcode({
  seed,
  className = "",
  accentLast = false,
}: {
  seed: string;
  className?: string;
  accentLast?: boolean;
}) {
  const bars = barcodePattern(seed);
  return (
    <span className={`inline-flex h-full items-stretch ${className}`} aria-hidden="true">
      {bars.map((b, i) => (
        <span
          key={i}
          style={{
            width: `${b.w}px`,
            marginRight: `${b.gap}px`,
            background: accentLast && i === bars.length - 1 ? C.acc : C.ink,
          }}
        />
      ))}
    </span>
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  code: string;
  Icon: LucideIcon;
  alarm: boolean;
  accent: boolean;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", code: "OK", Icon: ShieldCheck, alarm: false, accent: false };
    case "SUBMITTED":
      return { label: "In beoordeling", code: "WIP", Icon: Clock, alarm: false, accent: false };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        code: "EXP",
        Icon: AlertTriangle,
        alarm: true,
        accent: true,
      };
    case "REJECTED":
      return { label: "Afgewezen", code: "REJ", Icon: AlertTriangle, alarm: true, accent: true };
  }
}

// — Kader: haarscherpe zwarte rand, geen radius, geen schaduw —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  accent = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
  accent?: boolean;
}) {
  return (
    <Tag
      className={`relative ${className}`}
      style={{
        background: C.paper,
        border: `1px solid ${C.ink}`,
        borderLeft: accent ? `3px solid ${C.acc}` : `1px solid ${C.ink}`,
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

function Label({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-[0.2em]"
      style={{ color: accent ? C.acc : C.inkMute, ...mono }}
    >
      {children}
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors duration-150 hover:bg-[#ff3b00] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b00] focus-visible:ring-offset-2 focus-visible:ring-offset-white active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{ color: C.paper, background: C.ink, border: `1px solid ${C.ink}`, ...mono }}
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
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.12em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b00] focus-visible:ring-offset-2 focus-visible:ring-offset-white motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.paper : C.inkSoft,
        background: active ? C.ink : C.paper,
        border: `1px solid ${C.ink}`,
        ...mono,
      }}
    >
      {children}
    </button>
  );
}

// — Bar-sparkline: strakke staafjes, laatste in accent —
function BarSpark({ data, accent = false }: { data: number[]; accent?: boolean }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  return (
    <span className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((d, i) => {
        const last = i === data.length - 1;
        const pct = ((d - min) / span) * 100;
        return (
          <span
            key={i}
            className="w-full"
            style={{
              height: `${Math.max(12, pct)}%`,
              background: last && accent ? C.acc : last ? C.ink : C.lineSoft,
            }}
          />
        );
      })}
    </span>
  );
}

function BarMeter({ value, accent = false }: { value: number; accent?: boolean }) {
  return (
    <span className="hidden items-center gap-2.5 sm:flex" aria-hidden="true">
      <span className="relative h-2.5 w-24" style={{ border: `1px solid ${C.ink}` }}>
        <span
          className="block h-full"
          style={{
            width: `${value}%`,
            background: accent ? C.acc : C.ink,
            transition: "width 0.4s ease",
          }}
        />
      </span>
      <span className="text-[12px] font-bold" style={{ color: accent ? C.acc : C.ink, ...num }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept443() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...bodyFont, color: C.ink, background: C.paper }}
    >
      <style>{`
        @keyframes bcRise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .bc-rise { animation: bcRise 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .bc-rise { animation: none !important; } }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="bc-rise pt-6">
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
    <header
      className="flex items-center justify-between gap-4 border-b pt-8"
      style={{ borderColor: C.ink, paddingBottom: "18px" }}
    >
      <div className="flex items-center gap-4">
        <span className="flex h-11 items-center gap-3" aria-hidden="true">
          <Barcode seed="ZZP-BARCODE" className="h-9" accentLast />
        </span>
        <div className="border-l pl-4" style={{ borderColor: C.lineSoft }}>
          <p
            className="text-[18px] font-bold uppercase leading-none tracking-[0.14em]"
            style={{ color: C.ink, ...mono }}
          >
            Barcode
          </p>
          <p
            className="mt-1.5 text-[10px] uppercase leading-none tracking-[0.16em]"
            style={{ color: C.inkMute, ...mono }}
          >
            {PROFIEL.plaats} · data-als-code
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] sm:inline-flex"
          style={{ color: C.ink, border: `1px solid ${C.ink}`, ...mono }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center"
          style={{ border: `1px solid ${C.ink}`, color: C.ink }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center px-1 text-[9px] font-bold text-white"
              style={{ background: C.acc, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-semibold" style={{ color: C.ink, ...mono }}>
            {PROFIEL.naam}
          </span>
          <span
            className="block text-[10px] uppercase tracking-[0.1em]"
            style={{ color: C.inkMute, ...mono }}
          >
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center text-[12px] font-bold"
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
    <nav aria-label="Hoofdnavigatie" className="mt-6">
      <div
        className="flex items-stretch overflow-x-auto"
        style={{ borderBottom: `1px solid ${C.ink}` }}
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative flex shrink-0 items-center gap-2 px-5 py-3 text-[11.5px] font-semibold uppercase tracking-[0.12em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ff3b00] motion-reduce:transition-none"
              style={{
                color: on ? C.paper : C.inkMute,
                background: on ? C.ink : "transparent",
                borderLeft: i === 0 ? "none" : `1px solid ${C.lineSoft}`,
                ...mono,
              }}
            >
              <span className="opacity-50">{String(i + 1).padStart(2, "0")}</span>
              {s.label}
              {on && (
                <span
                  className="absolute inset-x-0 -bottom-px h-[3px]"
                  style={{ background: C.acc }}
                  aria-hidden="true"
                />
              )}
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
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel className="p-7 md:p-9">
          <div className="flex items-center justify-between">
            <Label>Vandaag · 21.07 · 09:24</Label>
            <Barcode seed="GOEDEMORGEN-SDV" className="h-6 w-40" accentLast />
          </div>
          <h1
            className="mt-5 text-[30px] font-bold leading-[1.02] tracking-[-0.02em] md:text-[42px]"
            style={{ color: C.ink }}
          >
            Goedemorgen,
            <br />
            {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-4 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Je praktijk, uitgelezen als code: elke regel scherp, verifieerbaar en betaald. Scan
            langs je acties — alleen wat telt is gemarkeerd.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <PrimaryButton onClick={onActies}>
              Volgende actie
              <ArrowRight
                size={13}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </PrimaryButton>
            <GhostButton onClick={onOpen}>Marktplaats</GhostButton>
          </div>
        </Panel>

        <Panel className="p-7" accent>
          <div className="flex items-center justify-between">
            <Label accent>Vraagt aandacht</Label>
            <AlertTriangle size={18} aria-hidden="true" style={{ color: C.acc }} />
          </div>
          <h2
            className="mt-4 text-[19px] font-bold leading-snug tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-6">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={13} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[11.5px]"
              style={{ color: C.inkMute, ...mono }}
            >
              <Check size={13} aria-hidden="true" style={{ color: C.ink }} />
              {verified}/{CREDENTIALS.length} geverifieerd · 07 open reacties
            </p>
          </div>
        </Panel>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-3">
          <Label>Kerncijfers · deze maand</Label>
          <span className="h-px flex-1" style={{ background: C.lineSoft }} />
        </div>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{ border: `1px solid ${C.ink}` }}
        >
          {KPIS.map((k, i) => (
            <div
              key={k.label}
              className="p-5"
              style={{
                borderLeft: i === 0 ? "none" : `1px solid ${C.lineSoft}`,
                borderTop: "none",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: C.inkMute, ...mono }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 px-1 py-0.5 text-[9px] font-bold"
                  style={{
                    color: k.up ? C.ink : C.acc,
                    border: `1px solid ${k.up ? C.ink : C.acc}`,
                    ...num,
                  }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-3 text-[26px] font-bold leading-none tracking-[-0.02em]"
                style={{ color: C.ink, ...num }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <BarSpark data={k.spark} accent={!k.up} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <Label>Open opdrachten</Label>
            <button
              type="button"
              onClick={onOpen}
              className="text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors hover:text-[#ff3b00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b00] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              style={{ color: C.ink, ...mono }}
            >
              Alle →
            </button>
          </div>
          <Panel>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ff3b00] motion-reduce:transition-none"
                  >
                    <span
                      className="inline-flex h-11 w-11 items-center justify-center"
                      style={{
                        border: `1px solid ${i === 0 ? C.acc : C.ink}`,
                        color: i === 0 ? C.acc : C.ink,
                      }}
                    >
                      <span className="text-[13px] font-bold leading-none" style={{ ...num }}>
                        {o.match}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[14.5px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11px] uppercase tracking-[0.06em]"
                        style={{ color: C.inkMute, ...mono }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <BarMeter value={o.match} accent={o.match >= 90} />
                      <span
                        className="text-[13px] font-bold transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: C.inkFaint }}
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div>
          <div className="mb-3">
            <Label>Certificaten</Label>
          </div>
          <Panel className="p-5">
            <ul>
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineHair}` }}
                  >
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center"
                      style={{
                        border: `1px solid ${st.accent ? C.acc : C.ink}`,
                        color: st.accent ? C.acc : C.ink,
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="block truncate text-[10px] uppercase tracking-[0.08em]"
                        style={{ color: st.accent ? C.acc : C.inkMute, ...mono }}
                      >
                        {st.code} · {st.label}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
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
      <div className="flex items-end justify-between gap-4">
        <div>
          <Label>Marktplaats</Label>
          <h1
            className="mt-2 text-[30px] font-bold leading-none tracking-[-0.02em]"
            style={{ color: C.ink }}
          >
            Open opdrachten
          </h1>
          <p
            className="mt-2 text-[11.5px] uppercase tracking-[0.1em]"
            style={{ color: C.inkMute, ...mono }}
          >
            {String(filtered.length).padStart(2, "0")} /{" "}
            {String(OPDRACHTEN.length).padStart(2, "0")} beschikbaar
          </p>
        </div>
        <Barcode
          seed={`MARKT-${filtered.length}-${sort}`}
          className="hidden h-9 w-48 sm:inline-flex"
          accentLast
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-5 py-3"
          style={{ border: `1px solid ${C.ink}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ZOEK OP TITEL, PLAATS OF OPDRACHTGEVER…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[12px] uppercase tracking-[0.06em] outline-none placeholder:text-[#a3a39e]"
            style={{ color: C.ink, ...mono }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <GhostButton
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              {s === "match" ? "Match" : "Tarief"}
            </GhostButton>
          ))}
          <GhostButton onClick={() => setLoading((v) => !v)} active={loading} ariaPressed={loading}>
            {loading ? "Stop" : "Laden"}
          </GhostButton>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Panel className="p-6">
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24" style={{ background: C.paperSoft }} />
                  <div className="h-5 w-2/3" style={{ background: C.lineSoft }} />
                  <div className="h-3 w-1/2" style={{ background: C.paperSoft }} />
                  <div className="h-2 w-full" style={{ background: C.paperSoft }} />
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Panel className="p-6" accent>
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center"
              style={{ border: `1px solid ${C.ink}`, color: C.ink }}
              aria-hidden="true"
            >
              <Search size={26} />
            </span>
            <p className="mt-5 text-[22px] font-bold tracking-[-0.01em]" style={{ color: C.ink }}>
              Geen match — 00 resultaten
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm en probeer
              opnieuw.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Panel>
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
  return (
    <Panel className="p-6" accent={strong}>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.ink, border: `1px solid ${C.ink}`, ...mono }}
            >
              № {String(index + 1).padStart(2, "0")}
            </span>
            <span
              className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.inkMute, ...mono }}
            >
              {opdracht.id}
            </span>
            <Barcode
              seed={opdracht.id}
              className="ml-auto hidden h-5 w-28 sm:inline-flex"
              accentLast={strong}
            />
          </div>
          <h3
            className="mt-3 text-[19px] font-bold leading-snug tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            {opdracht.titel}
          </h3>
          <p
            className="mt-1 text-[11.5px] uppercase tracking-[0.06em]"
            style={{ color: C.inkMute, ...mono }}
          >
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                style={{ color: C.inkSoft, border: `1px solid ${C.lineSoft}`, ...mono }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="inline-flex h-14 w-14 flex-col items-center justify-center"
            style={{
              border: `1.5px solid ${strong ? C.acc : C.ink}`,
              color: strong ? C.acc : C.ink,
            }}
          >
            <span className="text-[17px] font-bold leading-none" style={{ ...num }}>
              {opdracht.match}
            </span>
            <span
              className="mt-0.5 text-[7px] uppercase tracking-[0.12em]"
              style={{ color: C.inkFaint, ...mono }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-bold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b00] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          style={{ color: C.ink, border: `1px solid ${C.ink}`, ...mono }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <PrimaryButton onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </PrimaryButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="Plus · voor jou"
              accent={false}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Min · let op"
              accent
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}

function RedenBlok({
  titel,
  accent,
  Icon,
  items,
}: {
  titel: string;
  accent: boolean;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div
      className="p-4"
      style={{
        border: `1px solid ${C.lineSoft}`,
        borderLeft: accent ? `3px solid ${C.acc}` : `1px solid ${C.lineSoft}`,
      }}
    >
      <p
        className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: accent ? C.acc : C.ink, ...mono }}
      >
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.inkSoft }}>
            <Icon
              size={13}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: accent ? C.acc : C.ink }}
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
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b00] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        style={{ color: C.inkSoft, border: `1px solid ${C.ink}`, ...mono }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Panel className="p-7 md:p-9" accent={strong}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="inline-flex items-center px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.ink, border: `1px solid ${C.ink}`, ...mono }}
            >
              {opdracht.id}
            </span>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em]"
              style={{ color: C.paper, background: strong ? C.acc : C.ink, ...mono }}
            >
              {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
            </span>
          </div>
          <Barcode
            seed={`${opdracht.id}-VIEW`}
            className="hidden h-8 w-40 sm:inline-flex"
            accentLast={strong}
          />
        </div>
        <h1
          className="mt-4 max-w-2xl text-[30px] font-bold leading-[1.04] tracking-[-0.02em] md:text-[40px]"
          style={{ color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p
          className="mt-2 text-[13px] uppercase tracking-[0.06em]"
          style={{ color: C.inkSoft, ...mono }}
        >
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <PrimaryButton>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </PrimaryButton>
          <GhostButton>Bewaren</GhostButton>
        </div>
      </Panel>

      <Panel>
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
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.lineSoft}`,
                borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
              }}
            >
              <p
                className="text-[9px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...mono }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-bold tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <section>
        <Label>Verklaarbare matching</Label>
        <p className="mt-3 max-w-xl text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgelezen van je geverifieerde profiel — wat je meebrengt én waar de aandacht ligt,
          transparant en zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-6">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center"
                style={{ border: `1px solid ${C.ink}`, color: C.ink }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.ink, ...mono }}
              >
                Plus · voor jou
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
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
          </Panel>
          <Panel className="p-6" accent>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center"
                style={{ border: `1px solid ${C.acc}`, color: C.acc }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.acc, ...mono }}
              >
                Min · let op
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.acc }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <div className="mt-4">
          <span
            className="text-[11.5px] uppercase tracking-[0.08em]"
            style={{ color: C.ink, ...mono }}
          >
            Match {opdracht.match}% —{" "}
            {strong ? "sterk afgestemd op jouw profiel." : "goed afgestemd op jouw profiel."}
          </span>
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
      <Panel className="p-7 md:p-9">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Label>Verificatie · veilig bewaard</Label>
            <h1
              className="mt-2 text-[27px] font-bold leading-tight tracking-[-0.02em]"
              style={{ color: C.ink }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-semibold" style={{ color: C.ink }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing. Documenten blijven versleuteld en privé.
            </p>
            <div className="mt-4 max-w-xs">
              <BarMeter value={ratio} accent={ratio < 100} />
            </div>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center"
            style={{ border: `1.5px solid ${C.ink}` }}
          >
            <span className="text-[26px] font-bold leading-none" style={{ color: C.ink, ...num }}>
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.inkMute, ...mono }}
            >
              % op orde
            </span>
          </span>
        </div>
      </Panel>

      <Panel>
        <div
          className="hidden grid-cols-[1fr_12rem_2.5rem] items-center gap-4 px-6 py-3.5 sm:grid"
          style={{ borderBottom: `1px solid ${C.ink}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: C.inkMute, ...mono }}
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
              <li
                key={c.naam}
                style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[#f5f5f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ff3b00] motion-reduce:transition-none sm:grid-cols-[1fr_12rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center"
                      style={{
                        border: `1px solid ${st.accent ? C.acc : C.ink}`,
                        color: st.accent ? C.acc : C.ink,
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[14.5px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[10.5px] uppercase tracking-[0.06em]"
                        style={{ color: C.inkMute, ...mono }}
                      >
                        {c.detail}
                      </span>
                    </span>
                  </span>
                  <span className="hidden sm:flex">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                      style={{
                        color: st.accent ? C.acc : C.ink,
                        border: `1px solid ${st.accent ? C.acc : C.ink}`,
                        ...mono,
                      }}
                    >
                      <st.Icon size={11} aria-hidden="true" />
                      {st.code} · {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </span>
                  </span>
                  <span
                    className="hidden justify-self-end text-[15px] font-bold transition-transform motion-reduce:transition-none sm:block"
                    style={{
                      color: C.inkFaint,
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                    aria-hidden="true"
                  >
                    +
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
                        style={{
                          border: `1px solid ${C.lineSoft}`,
                          borderLeft: st.accent ? `3px solid ${C.acc}` : `1px solid ${C.lineSoft}`,
                        }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <PrimaryButton>
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
      </Panel>

      <div>
        <div className="mb-3">
          <Label>Documentenkast</Label>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Panel key={d.naam} className="flex items-center gap-3 p-4" accent={st.accent}>
                <span
                  className="inline-flex h-10 w-10 items-center justify-center"
                  style={{ border: `1px solid ${C.ink}`, color: C.inkSoft }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13px] font-semibold"
                    style={{ color: C.ink }}
                  >
                    {d.naam}
                  </span>
                  <span
                    className="block text-[10px] uppercase tracking-[0.06em]"
                    style={{ color: C.inkMute, ...mono }}
                  >
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 text-[9.5px] font-semibold uppercase tracking-[0.06em]"
                  style={{
                    color: st.accent ? C.acc : C.ink,
                    border: `1px solid ${st.accent ? C.acc : C.ink}`,
                    ...mono,
                  }}
                >
                  <st.Icon size={10} aria-hidden="true" />
                  {st.code}
                </span>
              </Panel>
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
        <Label>Acties · op volgorde van urgentie</Label>
        <h1
          className="mt-2 text-[30px] font-bold leading-none tracking-[-0.02em]"
          style={{ color: C.ink }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13px]" style={{ color: C.inkSoft }}>
          Scan van boven naar beneden — zo blijf je verifieerbaar en betaald, op orde.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Panel className="p-6" accent={warn}>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center text-[15px] font-bold"
                    style={{
                      border: `1.5px solid ${warn ? C.acc : C.ink}`,
                      color: warn ? C.acc : C.ink,
                      ...num,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
                      style={{
                        color: warn ? C.acc : C.ink,
                        border: `1px solid ${warn ? C.acc : C.ink}`,
                        ...mono,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Check size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[18px] font-bold leading-snug tracking-[-0.01em]"
                      style={{ color: C.ink }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <PrimaryButton>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </PrimaryButton>
                  </div>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTone(status: string): { accent: boolean; Icon: LucideIcon | null } {
  if (status === "Openstaand") return { accent: true, Icon: AlertTriangle };
  if (status === "Betaald") return { accent: false, Icon: Check };
  return { accent: false, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label>Facturen</Label>
          <h1
            className="mt-2 text-[30px] font-bold leading-none tracking-[-0.02em]"
            style={{ color: C.ink }}
          >
            Facturen
          </h1>
        </div>
        <PrimaryButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3" style={{ border: `1px solid ${C.ink}` }}>
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false },
        ].map((s, i) => (
          <div
            key={s.l}
            className="p-6"
            style={{ borderLeft: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
          >
            <div className="flex items-center justify-between">
              <p
                className="text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.inkMute, ...mono }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center"
                  style={{ color: C.acc }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[26px] font-bold tracking-[-0.02em]"
              style={{ color: s.alarm ? C.acc : C.ink, ...num }}
            >
              {s.v}
            </p>
            <p
              className="mt-1 text-[10.5px] uppercase tracking-[0.06em]"
              style={{ color: C.inkMute, ...mono }}
            >
              {s.sub}
            </p>
          </div>
        ))}
      </section>

      <Panel>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-6 pb-3 pt-5 sm:grid"
          style={{ borderBottom: `1px solid ${C.ink}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9px] font-semibold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.inkMute, ...mono }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f, i) => {
            const ft = factuurTone(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-6 py-4 transition-colors hover:bg-[#f5f5f4] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="order-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
                  style={{ color: C.inkMute, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-semibold sm:order-2"
                  style={{ color: C.ink }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11px] sm:order-3 sm:inline"
                  style={{ color: C.inkMute, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
                    style={{
                      color: ft.accent ? C.acc : C.ink,
                      border: `1px solid ${ft.accent ? C.acc : C.ink}`,
                      ...mono,
                    }}
                  >
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-bold sm:order-5"
                  style={{ color: ft.accent ? C.acc : C.ink, ...num }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-6 py-4"
          style={{ borderTop: `1px solid ${C.ink}` }}
        >
          <span
            className="flex items-center gap-2 text-[9.5px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: C.inkMute, ...mono }}
          >
            <Check size={12} aria-hidden="true" style={{ color: C.ink }} /> Totaal betaald
          </span>
          <span className="text-[20px] font-bold" style={{ color: C.ink, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
