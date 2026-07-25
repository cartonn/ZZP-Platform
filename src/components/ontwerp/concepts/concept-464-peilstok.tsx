"use client";

// Concept 464 — "Peilstok" · Nautische meetinstrumenten + data-dichtheid. Verticale peil-gauges
// (gevulde staaf met schaalstreepjes) voor KPI's en match-scores, tabulaire cijfers overal,
// meetstreep-hairlines en kompas/dieplood-accenten. Palet: diep marine-blauw #17395c + koper op
// off-white. Instrumentachtig, precies, hoge dichtheid maar leesbaar.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Anchor,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Clock,
  Compass,
  FileText,
  Gauge,
  Minus,
  Plus,
  Ruler,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
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
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: marine-blauw op off-white, koper-accent —
const C = {
  paper: "#f4f1ea", // off-white perkament
  paperAlt: "#eae5da", // wisselrij
  card: "#fbf9f3",
  navy: "#17395c", // diep marine-blauw
  navySoft: "#dbe3ec",
  ink: "#14232f",
  inkSoft: "#334755",
  inkMute: "#5f7080",
  inkFaint: "#93a1ad",
  line: "#cdd4d0", // meetstreep-hairline
  lineStrong: "#aeb8b3",
  copper: "#a9611f", // koper-accent
  copperSoft: "#f0e0cf",
  green: "#2f6b46",
  greenSoft: "#dce9df",
  amber: "#9a6b12",
  amberSoft: "#f0e6cf",
  teal: "#256b6b",
  tealSoft: "#d6e7e5",
};

const bodyFont = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  ink: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        ink: C.green,
        wash: C.greenSoft,
      };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, alarm: false, ink: C.teal, wash: C.tealSoft };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.amber,
        wash: C.amberSoft,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.copper,
        wash: C.copperSoft,
      };
  }
}

// — Instrument-kaart: off-white met marine-hairline en meetstreepjes bovenaan —
function Panel({
  children,
  className = "",
  ticks = false,
}: {
  children: React.ReactNode;
  className?: string;
  ticks?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[3px] ${className}`}
      style={{
        background: C.card,
        border: `1px solid ${C.lineStrong}`,
        boxShadow: "0 1px 2px rgba(20,35,47,0.05)",
        color: C.ink,
      }}
    >
      {ticks && (
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-2.5"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, ${C.lineStrong} 0px, ${C.lineStrong} 1px, transparent 1px, transparent 9px)`,
            opacity: 0.7,
          }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

function Eyebrow({ children, tone = C.copper }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.24em]"
      style={{ color: tone, ...bodyFont }}
    >
      <Ruler size={12} aria-hidden="true" />
      {children}
    </p>
  );
}

function SolidButton({
  children,
  onClick,
  tone = C.navy,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-[3px] px-4 py-2 text-[12.5px] font-bold transition-all duration-150 hover:brightness-[1.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17395c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1ea] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{ color: "#f7f4ec", background: tone, border: `1px solid ${tone}`, ...bodyFont }}
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
      className={`inline-flex items-center justify-center gap-2 rounded-[3px] px-3.5 py-2 text-[12px] font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17395c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1ea] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? "#f7f4ec" : C.navy,
        background: active ? C.navy : "transparent",
        border: `1px solid ${active ? C.navy : C.lineStrong}`,
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

// — Verticale peil-gauge: gevulde staaf met schaalstreepjes (waterstand-metafoor) —
function PeilGauge({
  value,
  tone = C.navy,
  label,
  height = 96,
}: {
  value: number; // 0..100
  tone?: string;
  label?: string;
  height?: number;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const ticks = [0, 25, 50, 75, 100];
  return (
    <div className="flex items-end gap-2" aria-hidden="true">
      <div
        className="relative w-8 shrink-0 overflow-hidden rounded-[2px]"
        style={{ height, background: C.navySoft, border: `1px solid ${C.lineStrong}` }}
      >
        <span
          className="absolute inset-x-0 bottom-0 block"
          style={{
            height: `${clamped}%`,
            background: `linear-gradient(180deg, ${tone} 0%, ${tone}cc 100%)`,
            transition: "height 0.7s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
        {/* schaalstreepjes */}
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute right-0 h-px"
            style={{
              bottom: `${t}%`,
              width: t % 50 === 0 ? 9 : 5,
              background: C.card,
              opacity: 0.75,
            }}
          />
        ))}
        {/* peil-lijn (waterlijn) */}
        <span
          className="absolute inset-x-0 h-[2px]"
          style={{ bottom: `${clamped}%`, background: C.copper }}
        />
      </div>
      <div className="flex h-full flex-col justify-between py-0.5">
        {[100, 50, 0].map((t) => (
          <span
            key={t}
            className="text-[8px] font-bold leading-none"
            style={{ color: C.inkFaint, ...num }}
          >
            {t}
          </span>
        ))}
      </div>
      {label && (
        <span className="sr-only">
          {label}: {clamped}%
        </span>
      )}
    </div>
  );
}

function Meter({ value, tone = C.navy }: { value: number; tone?: string }) {
  return (
    <span className="flex items-center gap-2" aria-hidden="true">
      <span
        className="relative h-2 w-full overflow-hidden rounded-[1px]"
        style={{ background: C.navySoft, border: `1px solid ${C.line}` }}
      >
        <span
          className="block h-full"
          style={{
            width: `${value}%`,
            background: tone,
            transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </span>
      <span className="text-[12px] font-bold" style={{ color: tone, ...num }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept464() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...bodyFont, color: C.ink, background: C.paper }}
    >
      <style>{`
        @keyframes peilRise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .peil-rise { animation: peilRise 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .peil-rise { animation: none !important; } }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="peil-rise pt-6">
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
      className="flex items-center justify-between gap-4 border-b-2 py-5"
      style={{ borderColor: C.navy }}
    >
      <div className="flex items-center gap-3.5">
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-[3px]"
          style={{ background: C.navy, color: C.paper }}
          aria-hidden="true"
        >
          <Compass size={20} strokeWidth={2} />
        </span>
        <div>
          <p
            className="text-[19px] font-bold leading-none tracking-tight"
            style={{ color: C.navy }}
          >
            Peilstok
          </p>
          <p
            className="mt-1.5 flex items-center gap-1.5 text-[11px] leading-none"
            style={{ color: C.inkMute, ...num }}
          >
            <Waves size={11} aria-hidden="true" /> {PROFIEL.plaats} · koers 2026
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[11px] font-bold sm:inline-flex"
          style={{
            color: C.green,
            background: C.greenSoft,
            border: `1px solid ${C.green}`,
            ...bodyFont,
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-[3px]"
          style={{ background: C.card, border: `1px solid ${C.lineStrong}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={15} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.copper, color: "#f7f4ec", ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13.5px] font-bold" style={{ color: C.ink }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.inkMute }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-[3px] text-[12.5px] font-bold"
          style={{ background: C.card, border: `1px solid ${C.navy}`, color: C.navy, ...num }}
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
    <nav aria-label="Hoofdnavigatie" className="mt-4">
      <div
        className="flex items-stretch gap-0 overflow-x-auto border-b"
        style={{ borderColor: C.lineStrong }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 px-4 py-2.5 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#17395c] motion-reduce:transition-none"
              style={{
                color: on ? C.navy : C.inkMute,
                borderBottom: on ? `3px solid ${C.copper}` : "3px solid transparent",
                background: on ? C.card : "transparent",
                ...bodyFont,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function sparkPeil(spark: number[]): number {
  const max = Math.max(...spark);
  const min = Math.min(...spark);
  const span = max - min || 1;
  const last = spark[spark.length - 1] ?? max;
  return Math.round(((last - min) / span) * 100);
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-6 pt-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel className="p-7 md:p-8" ticks>
          <Eyebrow>Peiling · vandaag</Eyebrow>
          <h1
            className="mt-4 text-[30px] font-bold leading-[1.08] tracking-[-0.01em] md:text-[40px]"
            style={{ color: C.navy }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.inkMute }}>
            Je koers ligt vast en het peil staat hoog: elke verificatie op diepte, elke post
            gepeild. Loop de metingen langs en zet uit wat aandacht vraagt.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <SolidButton onClick={onActies} tone={C.copper}>
              Volgende actie
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </SolidButton>
            <GhostButton onClick={onOpen}>Marktplaats</GhostButton>
          </div>
        </Panel>

        <Panel className="p-6">
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.amber}>Vraagt aandacht</Eyebrow>
            <AlertTriangle size={17} aria-hidden="true" style={{ color: C.amber }} />
          </div>
          <h2 className="mt-3 text-[18px] font-bold leading-snug" style={{ color: C.ink }}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.inkMute }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <SolidButton onClick={onActies} tone={C.amber} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </SolidButton>
          </div>
          <p
            className="mt-5 flex items-center gap-2 border-t pt-4 text-[12px]"
            style={{ color: C.inkMute, borderColor: C.line, ...num }}
          >
            <Check size={13} aria-hidden="true" style={{ color: C.green }} />
            {verified}/{CREDENTIALS.length} certificaten op diepte · 7 open reacties
          </p>
        </Panel>
      </section>

      <section>
        <div className="mb-3">
          <Eyebrow tone={C.navy}>Meetpanelen · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => {
            const tone = k.up ? C.green : C.copper;
            const Trend = k.up ? TrendingUp : TrendingDown;
            const peil = sparkPeil(k.spark);
            return (
              <Panel key={k.label} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: C.inkMute, ...bodyFont }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] font-bold"
                    style={{ color: tone, ...num }}
                  >
                    <Trend size={11} aria-hidden="true" /> {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <p
                    className="text-[26px] font-bold leading-none tracking-[-0.01em]"
                    style={{ color: C.navy, ...num }}
                  >
                    {k.value}
                  </p>
                  <PeilGauge value={peil} tone={tone} label={k.label} height={64} />
                </div>
              </Panel>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow>Open opdrachten · gepeild op match</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="text-[11px] font-bold uppercase tracking-[0.14em] transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17395c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1ea]"
              style={{ color: C.copper, ...bodyFont }}
            >
              Alle →
            </button>
          </div>
          <Panel>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[440px] border-collapse text-left">
                <thead>
                  <tr style={{ borderBottom: `1.5px solid ${C.navy}` }}>
                    {["Peil", "Opdracht", "Tarief", ""].map((h, i) => (
                      <th
                        key={h || i}
                        className={`px-4 py-2.5 text-[9.5px] font-bold uppercase tracking-[0.14em] ${i === 2 ? "text-right" : ""}`}
                        style={{ color: C.inkMute, ...bodyFont }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {OPDRACHTEN.map((o, i) => {
                    const tone = o.match >= 90 ? C.green : C.teal;
                    return (
                      <tr
                        key={o.id}
                        onClick={onOpen}
                        className="group cursor-pointer transition-colors hover:bg-[#eae5da]"
                        style={{ background: i % 2 === 1 ? "#eae5da" : "transparent" }}
                      >
                        <td className="px-4 py-3" style={{ borderRight: `1px solid ${C.line}` }}>
                          <span className="flex items-center gap-2">
                            <span className="text-[13px] font-bold" style={{ color: tone, ...num }}>
                              {o.match}
                            </span>
                            <span
                              className="relative hidden h-6 w-2 overflow-hidden rounded-[1px] sm:block"
                              style={{ background: C.navySoft }}
                              aria-hidden="true"
                            >
                              <span
                                className="absolute inset-x-0 bottom-0 block"
                                style={{ height: `${o.match}%`, background: tone }}
                              />
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-3" style={{ borderRight: `1px solid ${C.line}` }}>
                          <span className="block text-[13.5px] font-bold" style={{ color: C.ink }}>
                            {o.titel}
                          </span>
                          <span className="block text-[11px]" style={{ color: C.inkMute }}>
                            {o.opdrachtgever} · {o.plaats}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3 text-right text-[12.5px] font-bold"
                          style={{ color: C.ink, borderRight: `1px solid ${C.line}`, ...num }}
                        >
                          {o.tarief}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <ChevronRight
                            size={16}
                            aria-hidden="true"
                            className="inline transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                            style={{ color: C.inkFaint }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div>
          <div className="mb-3">
            <Eyebrow tone={C.green}>Dieplood · certificaten</Eyebrow>
          </div>
          <Panel className="p-4">
            <ul>
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 px-1 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[3px]"
                      style={{ background: st.wash, border: `1px solid ${st.ink}`, color: st.ink }}
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
                      <span className="block truncate text-[10.5px]" style={{ color: C.inkMute }}>
                        {st.label}
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
    <div className="space-y-6 pt-6">
      <div>
        <Eyebrow>Marktplaats</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
          style={{ color: C.navy }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkMute, ...num }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} peilingen op de kaart
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[3px] px-4 py-2.5"
          style={{ background: C.card, border: `1px solid ${C.lineStrong}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#93a1ad]"
            style={{ color: C.ink, ...bodyFont }}
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
              {s === "match" ? "Hoogste peil" : "Tarief"}
            </GhostButton>
          ))}
          <GhostButton onClick={() => setLoading((v) => !v)} active={loading} ariaPressed={loading}>
            {loading ? "Stop" : "Peilen…"}
          </GhostButton>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Panel className="p-5">
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24 rounded-[1px]" style={{ background: C.navySoft }} />
                  <div className="h-5 w-2/3 rounded-[1px]" style={{ background: C.navySoft }} />
                  <div className="h-3 w-1/2 rounded-[1px]" style={{ background: C.navySoft }} />
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Panel className="p-6">
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-[3px]"
              style={{
                background: C.navySoft,
                border: `1px solid ${C.lineStrong}`,
                color: C.inkMute,
              }}
              aria-hidden="true"
            >
              <Search size={24} />
            </span>
            <p className="mt-5 text-[21px] font-bold" style={{ color: C.navy }}>
              Geen peiling in zicht
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.inkMute }}>
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Verruim je koers en peil opnieuw.
            </p>
            <div className="mt-6">
              <SolidButton onClick={() => setQ("")} tone={C.copper}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </SolidButton>
            </div>
          </div>
        </Panel>
      ) : (
        <ul className="space-y-3">
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
  const tone = strong ? C.green : C.teal;
  return (
    <Panel className="p-5" ticks>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-[2px] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
            >
              Peiling {String(index + 1).padStart(3, "0")}
            </span>
            <span className="text-[11px] font-bold" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[18px] font-bold leading-snug" style={{ color: C.ink }}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-[2px] px-2 py-0.5 text-[10.5px] font-semibold"
                style={{
                  color: C.inkSoft,
                  background: C.navySoft,
                  border: `1px solid ${C.line}`,
                  ...bodyFont,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <PeilGauge
            value={opdracht.match}
            tone={tone}
            label={`Match ${opdracht.titel}`}
            height={72}
          />
          <span className="inline-flex items-baseline gap-1">
            <span className="text-[18px] font-bold leading-none" style={{ color: tone, ...num }}>
              {opdracht.match}
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-[0.1em]"
              style={{ color: tone, ...bodyFont }}
            >
              peil
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
          className="inline-flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[11.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17395c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf9f3]"
          style={{ color: C.navy, border: `1px solid ${C.lineStrong}`, ...bodyFont }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <SolidButton onClick={onOpen} tone={C.navy}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </SolidButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="Boven de waterlijn"
              tone={C.green}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Let op de diepgang"
              tone={C.copper}
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
  tone,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div
      className="rounded-[3px] p-4"
      style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        borderLeft: `3px solid ${tone}`,
      }}
    >
      <p
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
        style={{ color: tone, ...bodyFont }}
      >
        <Icon size={12} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.inkSoft }}>
            <Icon
              size={13}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: tone }}
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
  const tone = strong ? C.green : C.teal;
  return (
    <div className="space-y-5 pt-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-[3px] px-3.5 py-2 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17395c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1ea]"
        style={{
          color: C.navy,
          border: `1px solid ${C.lineStrong}`,
          background: C.card,
          ...bodyFont,
        }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Panel className="p-7 md:p-8" ticks>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center rounded-[2px] px-2 py-0.5 text-[10.5px] font-bold"
                style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
              >
                {opdracht.id}
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-[2px] px-2 py-0.5 text-[11px] font-bold"
                style={{ color: "#f7f4ec", background: tone, ...bodyFont }}
              >
                <Gauge size={11} aria-hidden="true" /> {strong ? "Sterk peil" : "Goed peil"} ·{" "}
                {opdracht.match}%
              </span>
            </div>
            <h1
              className="mt-4 max-w-2xl text-[28px] font-bold leading-[1.1] tracking-[-0.01em] md:text-[38px]"
              style={{ color: C.navy }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ color: C.inkMute }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <SolidButton tone={C.copper}>
                Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
              </SolidButton>
              <GhostButton>Bewaren</GhostButton>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <PeilGauge
              value={opdracht.match}
              tone={tone}
              label={`Match ${opdracht.titel}`}
              height={120}
            />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.inkMute, ...bodyFont }}
            >
              Match-peil
            </span>
          </div>
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
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.line}`,
                borderTop: i >= 2 ? `1px solid ${C.line}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-bold tracking-[-0.01em]"
                style={{ color: C.navy, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <section>
        <Eyebrow>Verklaarbare matching · gepeild</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkMute }}>
          Afgemeten tegen je geverifieerde profiel — wat je meebrengt boven de waterlijn én waar de
          diepgang aandacht vraagt, transparant en zonder verborgen score.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-6">
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.green, ...bodyFont }}
            >
              <Check size={13} aria-hidden="true" /> Boven de waterlijn
            </p>
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
                    style={{ color: C.green }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-6">
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.copper, ...bodyFont }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Let op de diepgang
            </p>
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
                    style={{ color: C.copper }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <p className="mt-4 text-[12px] font-bold" style={{ color: tone, ...bodyFont }}>
          Match {opdracht.match}% —{" "}
          {strong ? "sterk afgestemd op jouw profiel." : "goed afgestemd op jouw profiel."}
        </p>
      </section>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-5 pt-6">
      <Panel className="p-7 md:p-8" ticks>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow>Verificatie · dieplood</Eyebrow>
            <h1
              className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.01em]"
              style={{ color: C.navy }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkMute }}>
              <span className="font-bold" style={{ color: C.green }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn gepeild en geverifieerd. Eén
              verloopt binnenkort en vraagt om vernieuwing. Documenten blijven versleuteld en privé.
            </p>
            <div className="mt-4 max-w-xs">
              <Meter value={ratio} tone={C.green} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <PeilGauge value={ratio} tone={C.green} label="Verificatie op orde" height={110} />
            <span
              className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-[3px]"
              style={{ background: C.greenSoft, border: `1px solid ${C.green}` }}
            >
              <span
                className="text-[28px] font-bold leading-none"
                style={{ color: C.green, ...num }}
              >
                {ratio}
              </span>
              <span
                className="mt-1 text-[8px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.green, ...bodyFont }}
              >
                % op orde
              </span>
            </span>
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="overflow-x-auto">
          <div className="min-w-[520px]">
            <div
              className="grid grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-6 py-3"
              style={{ borderBottom: `1.5px solid ${C.navy}` }}
            >
              {["Certificaat", "Status", ""].map((h, i) => (
                <span
                  key={h || i}
                  className="text-[9.5px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: C.inkMute, ...bodyFont }}
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
                    style={{
                      borderTop: idx === 0 ? "none" : `1px solid ${C.line}`,
                      background: idx % 2 === 1 ? "#eae5da" : "transparent",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : c.naam)}
                      aria-expanded={isOpen}
                      className="grid w-full grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-6 py-3.5 text-left transition-colors hover:bg-[#eae5da] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#17395c] motion-reduce:transition-none"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className="inline-flex h-9 w-9 items-center justify-center rounded-[3px]"
                          style={{
                            background: st.wash,
                            border: `1px solid ${st.ink}`,
                            color: st.ink,
                          }}
                          aria-hidden="true"
                        >
                          <st.Icon size={15} />
                        </span>
                        <span className="min-w-0">
                          <span
                            className="block truncate text-[14px] font-bold"
                            style={{ color: C.ink }}
                          >
                            {c.naam}
                          </span>
                          <span
                            className="mt-0.5 block truncate text-[11.5px]"
                            style={{ color: C.inkMute }}
                          >
                            {c.detail}
                          </span>
                        </span>
                      </span>
                      <span
                        className="inline-flex w-max items-center gap-1.5 rounded-[2px] px-2 py-1 text-[11px] font-bold"
                        style={{
                          color: st.ink,
                          background: st.wash,
                          border: `1px solid ${st.ink}`,
                          ...bodyFont,
                        }}
                      >
                        <st.Icon size={11} aria-hidden="true" />
                        {st.label}
                        {st.alarm && <span className="sr-only"> (let op)</span>}
                      </span>
                      <span
                        className="justify-self-end transition-transform motion-reduce:transition-none"
                        style={{
                          color: C.inkFaint,
                          transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                        }}
                        aria-hidden="true"
                      >
                        <Plus size={15} />
                      </span>
                    </button>
                    <div
                      className="grid transition-all duration-500 motion-reduce:transition-none"
                      style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                    >
                      <div className="overflow-hidden">
                        <div className="px-6 pb-4 sm:pl-[76px]">
                          <div
                            className="rounded-[3px] p-4"
                            style={{ background: C.card, border: `1px solid ${C.line}` }}
                          >
                            <p
                              className="max-w-xl text-[13px] leading-relaxed"
                              style={{ color: C.inkSoft }}
                            >
                              {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                              expliciete toestemming gedeeld met een opdrachtgever.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <SolidButton tone={c.status === "EXPIRING" ? C.amber : C.navy}>
                                {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                              </SolidButton>
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
          </div>
        </div>
      </Panel>

      <div>
        <div className="mb-3">
          <Eyebrow tone={C.teal}>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Panel key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[3px]"
                  style={{
                    background: C.navySoft,
                    border: `1px solid ${C.lineStrong}`,
                    color: C.inkSoft,
                  }}
                  aria-hidden="true"
                >
                  <FileText size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold" style={{ color: C.ink }}>
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-[2px] px-2 py-1 text-[10px] font-bold"
                  style={{ color: st.ink, background: st.wash, border: `1px solid ${st.ink}` }}
                >
                  <st.Icon size={10} aria-hidden="true" />
                  {st.label}
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
    <div className="space-y-5 pt-6">
      <div>
        <Eyebrow>Acties · op volgorde van urgentie</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
          style={{ color: C.navy }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkMute }}>
          Rustig van boven naar beneden afwerken — zo houd je koers en blijft je peil op orde.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.teal;
          return (
            <li key={a.titel}>
              <Panel className="p-5" ticks>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-[3px] text-[14px] font-bold"
                    style={{ background: C.card, border: `1px solid ${tone}`, color: tone, ...num }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-[2px] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em]"
                      style={{
                        color: tone,
                        background: warn ? C.amberSoft : C.tealSoft,
                        border: `1px solid ${tone}`,
                        ...bodyFont,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Anchor size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[18px] font-bold leading-snug"
                      style={{ color: C.ink }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.inkMute }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <SolidButton tone={warn ? C.amber : C.navy}>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </SolidButton>
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

function factuurTone(status: string): { ink: string; wash: string; Icon: LucideIcon | null } {
  if (status === "Openstaand") return { ink: C.copper, wash: C.copperSoft, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.green, wash: C.greenSoft, Icon: Check };
  return { ink: C.inkMute, wash: C.navySoft, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-5 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen · gepeild saldo</Eyebrow>
          <h1
            className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
            style={{ color: C.navy }}
          >
            Facturenpeiling
          </h1>
        </div>
        <SolidButton tone={C.copper}>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </SolidButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Voldaan", v: totaalBetaald, sub: "3 posten", alarm: false, tone: C.green },
          { l: "Openstaand", v: "€ 1.350", sub: "1 post · 9 dagen", alarm: true, tone: C.copper },
          { l: "Concept", v: "€ 880", sub: "klaar om te peilen", alarm: false, tone: C.inkMute },
        ].map((s) => (
          <Panel key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <AlertTriangle size={14} aria-hidden="true" style={{ color: C.copper }} />
              )}
            </div>
            <p
              className="mt-2 text-[26px] font-bold tracking-[-0.01em]"
              style={{ color: s.tone, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <caption className="sr-only">Facturen met status en bedrag</caption>
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${C.navy}` }}>
                {[
                  { h: "Nummer", a: "left" },
                  { h: "Klant", a: "left" },
                  { h: "Datum", a: "left" },
                  { h: "Status", a: "left" },
                  { h: "Bedrag", a: "right" },
                ].map((c) => (
                  <th
                    key={c.h}
                    scope="col"
                    className={`px-4 py-2.5 text-[9.5px] font-bold uppercase tracking-[0.14em] ${c.a === "right" ? "text-right" : ""}`}
                    style={{ color: C.inkMute, ...bodyFont }}
                  >
                    {c.h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const ft = factuurTone(f.status);
                const openst = f.status === "Openstaand";
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#eae5da]"
                    style={{
                      background: i % 2 === 1 ? "#eae5da" : "transparent",
                      borderBottom: `1px solid ${C.line}`,
                    }}
                  >
                    <td
                      className="px-4 py-3 text-[11.5px] font-bold"
                      style={{ color: C.inkMute, ...num }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13.5px] font-bold" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td className="px-4 py-3 text-[11.5px]" style={{ color: C.inkMute, ...num }}>
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[2px] px-2 py-1 text-[10.5px] font-bold"
                        style={{
                          color: ft.ink,
                          background: ft.wash,
                          border: `1px solid ${ft.ink}`,
                          ...bodyFont,
                        }}
                      >
                        {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                        {f.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[13.5px] font-bold"
                      style={{ color: openst ? C.copper : C.ink, ...num }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `2px solid ${C.navy}` }}>
                <td
                  className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.18em]"
                  colSpan={4}
                  style={{ color: C.inkMute, ...bodyFont }}
                >
                  <span className="inline-flex items-center gap-2">
                    <Gauge size={13} aria-hidden="true" style={{ color: C.navy }} /> Voldaan dit
                    kwartaal
                  </span>
                </td>
                <td
                  className="px-4 py-3.5 text-right text-[15px] font-bold"
                  style={{ color: C.green, ...num }}
                >
                  {totaalBetaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>
    </div>
  );
}
