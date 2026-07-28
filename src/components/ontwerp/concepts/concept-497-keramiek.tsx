"use client";

// Concept 497 — "Keramiek" · Wabi-sabi keramiek. Stille, ingetogen aardse glazuurtinten (klei,
// celadon, oatmeal), hand-gedraaide warmte en zachte, licht-onregelmatige radii. Veel lucht,
// tactiele rust; vertrouwen ontstaat door zachtheid en ambacht in plaats van felle kleur. Craft +
// calm interface — het meest "handgemaakte, aardse" concept.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Check,
  Clock,
  FileText,
  Leaf,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkle,
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

// — Palet: aardse glazuurtinten. Klei-crème grond, celadon-groen als rustaccent, terracotta warm —
const C = {
  bg: "#efe7da", // ongebrande klei
  clay: "#f6f0e6", // zacht glazuur
  clayDeep: "#e8ddc9",
  ink: "#3a342b", // gebrande omber-inkt
  inkSoft: "#5f5749",
  inkMute: "#8b8272",
  inkFaint: "#b3a992",
  rim: "#d9cdb6", // glazuurrand
  rimSoft: "#e5dccb",

  celadon: "#7f9a86", // celadon glazuur (rustaccent)
  celadonDeep: "#5f7c69",
  celadonSoft: "#dde6dd",

  terra: "#b56a4e", // terracotta (warm accent / actie)
  terraDeep: "#9a5540",
  terraSoft: "#f0dfd4",

  ochre: "#a9822f", // oker (aandacht)
  ochreSoft: "#eee1c6",
  slate: "#6d7480", // steenblauw (neutraal)
  slateSoft: "#e0e2e4",
};

const sans = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
// Zacht, hand-gedraaid gevoel voor cijfers via een humanistische serif
const num = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
  fontVariantNumeric: "tabular-nums" as const,
};

// Licht-onregelmatige, hand-gedraaide radii (elke hoek net iets anders — geen perfecte cirkel)
const potR = "18px 22px 20px 24px";
const potRsm = "12px 15px 13px 16px";
const potRlg = "26px 30px 28px 32px";

type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.celadonDeep,
        soft: C.celadonSoft,
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return {
        base: C.slate,
        soft: C.slateSoft,
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
      };
    case "EXPIRING":
      return {
        base: C.ochre,
        soft: C.ochreSoft,
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.terraDeep, soft: C.terraSoft, label: "Afgewezen", Icon: X, alarm: true };
  }
}

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10.5px] font-semibold uppercase tracking-[0.2em]"
      style={{ color: C.inkMute, ...sans }}
    >
      {children}
    </span>
  );
}

// — Zachte, hand-gedraaide kom-vorm als paneel (onregelmatige radii, zacht glazuur) —
function Pot({
  children,
  className = "",
  as: Tag = "div",
  radius = potR,
  raised = true,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
  radius?: string;
  raised?: boolean;
}) {
  return (
    <Tag
      className={className}
      style={{
        background: C.clay,
        border: `1px solid ${C.rim}`,
        borderRadius: radius,
        boxShadow: raised
          ? "0 1px 0 rgba(255,255,255,0.7) inset, 0 18px 40px -30px rgba(58,52,43,0.55)"
          : "0 1px 0 rgba(255,255,255,0.55) inset",
      }}
    >
      {children}
    </Tag>
  );
}

function Btn({
  children,
  onClick,
  variant = "solid",
  size = "md",
  className = "",
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "solid" | "line" | "quiet";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}) {
  const pad = size === "sm" ? "px-4 py-1.5 text-[12.5px]" : "px-5 py-2.5 text-[13.5px]";
  const style: React.CSSProperties =
    variant === "solid"
      ? { background: C.terra, color: C.clay, border: `1px solid ${C.terraDeep}` }
      : variant === "line"
        ? { background: "transparent", color: C.terraDeep, border: `1px solid ${C.terra}` }
        : { background: C.clay, color: C.inkSoft, border: `1px solid ${C.rim}` };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b56a4e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe7da] ${pad} ${className}`}
      style={{ ...style, borderRadius: potRsm, ...sans }}
    >
      {children}
    </button>
  );
}

function StatusTag({ base, soft, label, Icon, alarm }: Tone) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ color: base, background: soft, borderRadius: "9px 11px 10px 12px", ...sans }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 92;
  const h = 26;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - 3 - ((d - min) / span) * (h - 6)] as const);
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1] ?? ([w, h] as const);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.1" fill={tone} />
    </svg>
  );
}

// — Match als een gedraaide schijf: cijfer in een zachte kom-ring —
function MatchDisc({ value, size = 64 }: { value: number; size?: number }) {
  const strong = value >= 90;
  const tone = strong ? C.celadonDeep : C.terra;
  const soft = strong ? C.celadonSoft : C.terraSoft;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`Match ${value} procent`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill={soft} stroke="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-semibold leading-none"
          style={{ color: tone, fontSize: size * 0.3, ...num }}
        >
          {value}
        </span>
        <span
          className="text-[8px] uppercase tracking-[0.14em]"
          style={{ color: C.inkMute, ...sans }}
        >
          match
        </span>
      </span>
    </span>
  );
}

function SectionTitle({ over, children }: { over: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <Overline>{over}</Overline>
      <h2
        className="mt-1.5 text-[20px] font-semibold leading-tight tracking-[-0.01em]"
        style={{ color: C.ink }}
      >
        {children}
      </h2>
    </div>
  );
}

export function Concept497() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full antialiased"
      style={{
        ...sans,
        color: C.ink,
        background: C.bg,
        backgroundImage: [
          "radial-gradient(70% 50% at 8% 0%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 55%)",
          "radial-gradient(60% 50% at 100% 100%, rgba(127,154,134,0.10) 0%, rgba(255,255,255,0) 60%)",
        ].join(","),
      }}
    >
      <div className="relative mx-auto max-w-5xl px-4 pb-20 sm:px-8 md:px-10">
        <Topbar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="km-fade pt-7">
          {screen === "dashboard" && (
            <Dashboard
              onOpen={() => setScreen("opdracht")}
              onMarkt={() => setScreen("marktplaats")}
              onActies={() => setScreen("acties")}
            />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties onMarkt={() => setScreen("marktplaats")} />}
          {screen === "facturen" && <Facturen />}
        </main>
      </div>

      <style>{`
        @keyframes kmFade { from { opacity: 0; transform: translateY(6px) scale(0.995); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .km-fade { animation: kmFade 0.42s cubic-bezier(0.22,1,0.36,1) both; }
        @media (prefers-reduced-motion: reduce) { .km-fade { animation: none !important; } }
      `}</style>
    </div>
  );
}

function Topbar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex items-center justify-between gap-4 pt-7">
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center"
          style={{
            background: C.celadonSoft,
            color: C.celadonDeep,
            border: `1px solid ${C.rim}`,
            borderRadius: potRsm,
          }}
          aria-hidden="true"
        >
          <Sparkle size={20} />
        </span>
        <div>
          <p
            className="text-[18px] font-semibold leading-none tracking-[0.01em]"
            style={{ color: C.ink }}
          >
            Keramiek
          </p>
          <p
            className="mt-1 text-[10.5px] uppercase tracking-[0.18em]"
            style={{ color: C.inkMute }}
          >
            Werkplaats voor zelfstandigen
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{ color: C.celadonDeep }}
        >
          <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span
          className="inline-flex h-9 items-center gap-1.5 px-2.5 text-[11.5px]"
          style={{ color: C.inkSoft, border: `1px solid ${C.rim}`, borderRadius: potRsm }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          Post
          <span className="font-semibold" style={{ color: C.terra, ...num }}>
            {ongelezen}
          </span>
        </span>
        <span
          className="flex h-9 w-9 items-center justify-center text-[12px] font-semibold"
          style={{
            background: C.clayDeep,
            color: C.ink,
            border: `1px solid ${C.rim}`,
            borderRadius: "50% 48% 52% 50%",
          }}
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
      <div className="flex flex-wrap gap-2">
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="px-3.5 py-2 text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b56a4e]"
              style={{
                color: on ? C.clay : C.inkSoft,
                background: on ? C.celadonDeep : C.clay,
                border: `1px solid ${on ? C.celadonDeep : C.rim}`,
                borderRadius: potRsm,
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

// —————————————————————————————————— Dashboard ——————————————————————————————————
function Dashboard({
  onOpen,
  onMarkt,
  onActies,
}: {
  onOpen: () => void;
  onMarkt: () => void;
  onActies: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <Overline>Werkplaats</Overline>
          <h1
            className="mt-2 text-[30px] font-semibold leading-[1.1] tracking-[-0.015em] md:text-[38px]"
            style={{ color: C.ink }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Je dossier is op orde en rustig gedraaid. Er staan verse opdrachten klaar die bij je
            passen, en één document vraagt binnenkort om aandacht.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Btn variant="solid" onClick={onActies}>
              Volgende actie <ArrowRight size={14} aria-hidden="true" />
            </Btn>
            <Btn variant="quiet" onClick={onMarkt}>
              Naar de marktplaats
            </Btn>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {KPIS.map((k) => (
              <Pot key={k.label} className="p-4" radius={potRsm} raised={false}>
                <p className="text-[10px] uppercase tracking-[0.12em]" style={{ color: C.inkMute }}>
                  {k.label}
                </p>
                <p
                  className="mt-1.5 text-[22px] font-semibold leading-none"
                  style={{ color: C.ink, ...num }}
                >
                  {k.value}
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <span
                    className="text-[10.5px] font-semibold"
                    style={{ color: k.up ? C.celadonDeep : C.ochre, ...num }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                  <Spark data={k.spark} tone={C.inkFaint} />
                </div>
              </Pot>
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <Pot className="p-5" radius={potRlg}>
            <div className="flex items-center gap-2" style={{ color: C.ochre }}>
              <AlertTriangle size={15} aria-hidden="true" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">
                Termijn nadert
              </span>
            </div>
            <h3 className="mt-2.5 text-[16px] font-semibold leading-snug" style={{ color: C.ink }}>
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" className="mt-4 w-full" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </Pot>

          <Pot className="p-5" radius={potRlg} raised={false}>
            <Overline>Vertrouwen</Overline>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="text-[32px] font-semibold leading-none"
                style={{ color: C.ink, ...num }}
              >
                {ratio}%
              </span>
              <span className="text-[12px]" style={{ color: C.inkMute }}>
                dossier op orde
              </span>
            </div>
            <div
              className="mt-3 h-2 w-full overflow-hidden"
              style={{ background: C.clayDeep, borderRadius: 999 }}
              aria-hidden="true"
            >
              <span
                className="block h-full"
                style={{
                  width: `${ratio}%`,
                  background: C.celadon,
                  borderRadius: 999,
                  transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            </div>
            <p className="mt-2 text-[12px]" style={{ color: C.inkMute }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd.
            </p>
          </Pot>
        </aside>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <SectionTitle over="Aanbevolen">Opdrachten voor jou gedraaid</SectionTitle>
          <button
            type="button"
            onClick={onMarkt}
            className="mb-1 shrink-0 text-[12px] font-semibold transition-colors hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b56a4e]"
            style={{ color: C.terraDeep }}
          >
            Volledige lijst →
          </button>
        </div>
        <ul className="space-y-3">
          {OPDRACHTEN.map((o) => (
            <li key={o.id}>
              <OpdrachtRow opdracht={o} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionTitle over="Register">Je certificaten</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            return (
              <Pot
                key={c.naam}
                className="flex items-center gap-3 p-3.5"
                radius={potRsm}
                raised={false}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center"
                  style={{ background: t.soft, color: t.base, borderRadius: potRsm }}
                  aria-hidden="true"
                >
                  <t.Icon size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[14px] font-semibold"
                    style={{ color: C.ink }}
                  >
                    {c.naam}
                  </span>
                  <span
                    className="block truncate text-[11.5px]"
                    style={{ color: t.alarm ? t.base : C.inkMute }}
                  >
                    {c.detail}
                  </span>
                </span>
              </Pot>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function OpdrachtRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  return (
    <Pot as="div" raised={false} className="overflow-hidden">
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[#f6f0e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#b56a4e]"
        style={{ borderRadius: potR }}
      >
        <MatchDisc value={opdracht.match} size={56} />
        <span className="min-w-0 flex-1">
          <span
            className="block truncate text-[16px] font-semibold leading-snug"
            style={{ color: C.ink }}
          >
            {opdracht.titel}
          </span>
          <span
            className="mt-0.5 flex items-center gap-1.5 truncate text-[12.5px]"
            style={{ color: C.inkMute }}
          >
            <MapPin size={12} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats} ·{" "}
            {opdracht.uren}
          </span>
          <span
            className="mt-1 flex items-center gap-1.5 text-[12px]"
            style={{ color: C.celadonDeep }}
          >
            <Check size={13} aria-hidden="true" /> {opdracht.redenen.plus[0]}
          </span>
        </span>
        <span className="hidden shrink-0 flex-col items-end gap-0.5 sm:flex">
          <span className="text-[15px] font-semibold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span className="text-[10px] uppercase tracking-[0.12em]" style={{ color: C.inkFaint }}>
            per uur
          </span>
        </span>
        <ArrowRight
          size={17}
          aria-hidden="true"
          className="shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ color: C.inkFaint }}
        />
      </button>
    </Pot>
  );
}

// —————————————————————————————————— Marktplaats ——————————————————————————————————
type Mode = "ok" | "loading" | "error";

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [mode, setMode] = useState<Mode>("ok");

  const filtered = useMemo(() => {
    const n = q.toLowerCase().trim();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(n) ||
        o.plaats.toLowerCase().includes(n) ||
        o.opdrachtgever.toLowerCase().includes(n),
    );
    return [...list].sort((a, b) =>
      sort === "match"
        ? b.match - a.match
        : parseInt(b.tarief.replace(/\D/g, ""), 10) - parseInt(a.tarief.replace(/\D/g, ""), 10),
    );
  }, [q, sort]);

  return (
    <div className="space-y-6">
      <div>
        <Overline>Marktplaats</Overline>
        <h1
          className="mt-1.5 text-[26px] font-semibold leading-tight tracking-[-0.01em]"
          style={{ color: C.ink }}
        >
          Opdrachten die bij je passen
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: C.inkMute }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten sluiten aan op je profiel.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-3.5 py-2.5"
          style={{ background: C.clay, border: `1px solid ${C.rim}`, borderRadius: potRsm }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#b3a992]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center transition-colors hover:bg-[#e8ddc9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b56a4e]"
              style={{ color: C.inkMute, borderRadius: 8 }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <Btn
              key={s}
              size="sm"
              variant={sort === s ? "solid" : "quiet"}
              onClick={() => setSort(s)}
            >
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </Btn>
          ))}
        </div>
      </div>

      {mode === "loading" ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Pot className="p-5">
                <div className="space-y-3">
                  <div
                    className="h-4 w-2/3 animate-pulse motion-reduce:animate-none"
                    style={{ background: C.clayDeep, borderRadius: 8 }}
                  />
                  <div
                    className="h-3 w-1/2 animate-pulse motion-reduce:animate-none"
                    style={{ background: C.clayDeep, borderRadius: 8 }}
                  />
                </div>
              </Pot>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={AlertTriangle}
          titel="De lijst kon niet worden geladen"
          tekst="We konden de opdrachten zojuist niet ophalen. Probeer het rustig opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : filtered.length === 0 ? (
        <StateBlock
          Icon={Search}
          titel="Niets gevonden"
          tekst={`Er is geen opdracht voor ${q ? `“${q}”` : "je zoekterm"}. Verruim je zoekopdracht.`}
          cta="Zoekterm wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-center gap-5 pt-1">
        {(["loading", "error"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(mode === m ? "ok" : m)}
            className="text-[11px] uppercase tracking-[0.12em] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b56a4e]"
            style={{ color: C.inkFaint }}
          >
            {m === "loading" ? "laadstaat" : "foutstaat"}
          </button>
        ))}
      </div>
    </div>
  );
}

function StateBlock({
  Icon,
  titel,
  tekst,
  cta,
  onCta,
}: {
  Icon: LucideIcon;
  titel: string;
  tekst: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <Pot className="flex flex-col items-center px-6 py-16 text-center" radius={potRlg}>
      <span
        className="flex h-16 w-16 items-center justify-center"
        style={{ color: C.terra, background: C.terraSoft, borderRadius: "40% 44% 42% 46%" }}
        aria-hidden="true"
      >
        <Icon size={26} />
      </span>
      <p className="mt-4 text-[19px] font-semibold" style={{ color: C.ink }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
        {tekst}
      </p>
      <Btn variant="line" className="mt-5" onClick={onCta}>
        <RotateCcw size={13} aria-hidden="true" /> {cta}
      </Btn>
    </Pot>
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
    <Pot as="article" className="overflow-hidden" radius={potRlg}>
      <div className="flex items-start gap-4 p-5">
        <MatchDisc value={opdracht.match} size={66} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: strong ? C.celadonDeep : C.terraDeep }}
            >
              {strong ? "Sterke match" : "Goede match"}
            </span>
            <span className="text-[11px]" style={{ color: C.inkFaint, ...num }}>
              № {String(index + 1).padStart(2, "0")} · {opdracht.id}
            </span>
          </div>
          <h3 className="mt-1.5 text-[18px] font-semibold leading-snug" style={{ color: C.ink }}>
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[13px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="px-2.5 py-0.5 text-[11.5px]"
                style={{
                  background: C.clayDeep,
                  color: C.inkSoft,
                  border: `1px solid ${C.rimSoft}`,
                  borderRadius: "9px 11px 10px 12px",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[17px] font-semibold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span className="text-[10px] uppercase tracking-[0.12em]" style={{ color: C.inkFaint }}>
            per uur
          </span>
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-3 px-5 pb-4"
        style={{ borderTop: `1px solid ${C.rimSoft}`, paddingTop: 14 }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b56a4e]"
          style={{ color: C.terraDeep }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" onClick={onOpen}>
            Reageren <ArrowRight size={13} aria-hidden="true" />
          </Btn>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="grid grid-cols-1 gap-6 px-5 pb-5 sm:grid-cols-2"
            style={{ borderTop: `1px solid ${C.rimSoft}`, paddingTop: 18 }}
          >
            <RedenKolom
              titel="In je voordeel"
              tone={C.celadonDeep}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.ochre}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Pot>
  );
}

function RedenKolom({
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
    <div>
      <p
        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: tone }}
      >
        <Icon size={12} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 text-[13.5px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: tone }}
              aria-hidden="true"
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

// —————————————————————————————————— Opdracht-detail ——————————————————————————————————
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  return (
    <div className="space-y-7">
      <Btn variant="quiet" size="sm" onClick={onBack}>
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </Btn>

      <Pot className="p-6 md:p-7" radius={potRlg}>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px]" style={{ color: C.inkMute, ...num }}>
            {opdracht.id}
          </span>
          <span className="h-3 w-px" style={{ background: C.rim }} aria-hidden="true" />
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: strong ? C.celadonDeep : C.terraDeep }}
          >
            {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
          </span>
        </div>
        <div className="mt-3 flex items-start gap-5">
          <MatchDisc value={opdracht.match} size={72} />
          <div className="min-w-0 flex-1">
            <h1
              className="text-[26px] font-semibold leading-[1.14] tracking-[-0.015em] md:text-[32px]"
              style={{ color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-[14px]" style={{ color: C.inkMute }}>
              <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Btn variant="solid">
            Reageren op opdracht <ArrowRight size={14} aria-hidden="true" />
          </Btn>
          <Btn variant="line">Bewaren</Btn>
        </div>
      </Pot>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Aanvang", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Pot key={m.l} className="p-4" radius={potRsm} raised={false}>
            <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: C.inkMute }}>
              {m.l}
            </p>
            <p className="mt-1.5 text-[17px] font-semibold" style={{ color: C.ink, ...num }}>
              {m.v}
            </p>
          </Pot>
        ))}
      </div>

      <section>
        <SectionTitle over="Motivering">Waarom deze match bij je past</SectionTitle>
        <p className="mb-5 max-w-xl text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgezet tegen je geverifieerde profiel — open en navolgbaar, zonder verborgen score. Wat
          in je voordeel spreekt, en wat goed is om vooraf te weten.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Pot className="p-5" radius={potR} raised={false}>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.celadonDeep }}
            >
              <Check size={13} aria-hidden="true" /> In je voordeel
            </p>
            <ul className="mt-3.5 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.celadonDeep }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Pot>
          <Pot className="p-5" radius={potR} raised={false}>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.ochre }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Goed om te weten
            </p>
            <ul className="mt-3.5 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.ochre }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Pot>
        </div>
      </section>
    </div>
  );
}

// —————————————————————————————————— Verificatie ——————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-7">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <Overline>Vertrouwensregister</Overline>
          <h1
            className="mt-1.5 text-[26px] font-semibold leading-tight tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            {PROFIEL.trust}
          </h1>
          <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
            bijna — tijdig vernieuwen houdt je dossier compleet. Al je documenten worden versleuteld
            bewaard en uitsluitend met jouw toestemming gedeeld.
          </p>
        </div>
        <Pot className="p-5" radius={potRlg}>
          <span className="text-[42px] font-semibold leading-none" style={{ color: C.ink, ...num }}>
            {ratio}%
          </span>
          <p className="mt-1 text-[12px] uppercase tracking-[0.12em]" style={{ color: C.inkMute }}>
            dossier op orde
          </p>
          <div
            className="mt-3 h-2 w-full overflow-hidden"
            style={{ background: C.clayDeep, borderRadius: 999 }}
            aria-hidden="true"
          >
            <span
              className="block h-full"
              style={{
                width: `${ratio}%`,
                background: C.celadon,
                borderRadius: 999,
                transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </div>
        </Pot>
      </section>

      <section>
        <SectionTitle over="Certificaten">Documentregister</SectionTitle>
        <ul className="space-y-3">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam}>
                <Pot className="overflow-hidden" radius={potR} raised={false}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[#f6f0e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#b56a4e]"
                    style={{ borderRadius: potR }}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center"
                      style={{ background: t.soft, color: t.base, borderRadius: potRsm }}
                      aria-hidden="true"
                    >
                      <t.Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12px]"
                        style={{ color: C.inkMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                    <span className="hidden sm:inline-flex">
                      <StatusTag {...t} />
                    </span>
                    <span
                      className="text-[16px] transition-transform motion-reduce:transition-none"
                      style={{ color: C.inkFaint, transform: isOpen ? "rotate(45deg)" : "none" }}
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
                      <div className="px-4 pb-4 sm:pl-[72px]">
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Het document wordt versleuteld bewaard en uitsluitend na jouw
                          toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Btn size="sm" variant="solid">
                            {c.status === "EXPIRING"
                              ? "Vernieuwen"
                              : c.status === "REJECTED"
                                ? "Opnieuw indienen"
                                : "Bekijken"}
                          </Btn>
                          <Btn size="sm" variant="quiet">
                            Historie
                          </Btn>
                        </div>
                      </div>
                    </div>
                  </div>
                </Pot>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <SectionTitle over="Dossier">Documentenkast</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const t = credTone(d.status);
            return (
              <Pot
                key={d.naam}
                className="flex items-center gap-3 p-3.5"
                radius={potRsm}
                raised={false}
              >
                <FileText size={16} aria-hidden="true" style={{ color: C.inkMute }} />
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13.5px] font-semibold"
                    style={{ color: C.ink }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[11px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <StatusTag {...t} />
              </Pot>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// —————————————————————————————————— Acties ——————————————————————————————————
function Acties({ onMarkt }: { onMarkt: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <Overline>Agenda</Overline>
        <h1
          className="mt-1.5 text-[26px] font-semibold leading-tight tracking-[-0.01em]"
          style={{ color: C.ink }}
        >
          Wat vandaag je aandacht vraagt
        </h1>
        <p className="mt-1 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Op volgorde van urgentie — werk van boven naar beneden.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.ochre : C.slate;
          const soft = warn ? C.ochreSoft : C.slateSoft;
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li key={a.titel}>
              <Pot className="flex items-start gap-4 p-5" radius={potR} raised={false}>
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center"
                  style={{ background: soft, color: tone, borderRadius: potRsm }}
                  aria-hidden="true"
                >
                  {warn ? <AlertTriangle size={18} /> : <Clock size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: tone }}
                  >
                    {warn ? "Urgent" : "Aanbevolen"}
                  </span>
                  <h2
                    className="mt-1 text-[17px] font-semibold leading-snug"
                    style={{ color: C.ink }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1 max-w-lg text-[13.5px] leading-relaxed"
                    style={{ color: C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-3">
                    <Btn
                      variant={warn ? "solid" : "line"}
                      size="sm"
                      onClick={goMarkt ? onMarkt : undefined}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </Btn>
                  </div>
                </div>
                <span
                  className="hidden h-8 w-8 shrink-0 items-center justify-center text-[14px] font-semibold sm:flex"
                  style={{
                    color: C.inkFaint,
                    border: `1px solid ${C.rim}`,
                    borderRadius: "50% 48% 52% 50%",
                    ...num,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
              </Pot>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// —————————————————————————————————— Facturen ——————————————————————————————————
function factuurTone(status: string): { base: string; soft: string } {
  if (status === "Betaald") return { base: C.celadonDeep, soft: C.celadonSoft };
  if (status === "Openstaand") return { base: C.ochre, soft: C.ochreSoft };
  if (status === "Concept") return { base: C.slate, soft: C.slateSoft };
  return { base: C.terraDeep, soft: C.terraSoft };
}

function Facturen() {
  const [sort, setSort] = useState<"datum" | "bedrag">("datum");
  const rows = useMemo(() => {
    if (sort === "datum") return FACTUREN;
    return [...FACTUREN].sort(
      (a, b) =>
        parseInt(b.bedrag.replace(/\D/g, ""), 10) - parseInt(a.bedrag.replace(/\D/g, ""), 10),
    );
  }, [sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline>Grootboek</Overline>
          <h1
            className="mt-1.5 text-[26px] font-semibold leading-tight tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            Je facturen
          </h1>
        </div>
        <Btn variant="solid">
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </Btn>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 5.552", sub: "2 facturen", tone: C.celadonDeep },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: C.ochre },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: C.slate },
        ].map((s) => (
          <Pot key={s.l} className="p-5" radius={potR} raised={false}>
            <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: C.inkMute }}>
              {s.l}
            </p>
            <p className="mt-1 text-[23px] font-semibold" style={{ color: s.tone, ...num }}>
              {s.v}
            </p>
            <p className="mt-0.5 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Pot>
        ))}
      </div>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <Btn
            key={s}
            size="sm"
            variant={sort === s ? "solid" : "quiet"}
            onClick={() => setSort(s)}
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </Btn>
        ))}
      </div>

      <Pot className="overflow-hidden" radius={potR}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <caption className="sr-only">Overzicht van facturen</caption>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.rim}` }}>
                {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="whitespace-nowrap px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: C.inkMute }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((f, i) => {
                const t = factuurTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#f6f0e6]"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.rimSoft}` }}
                  >
                    <td
                      className="whitespace-nowrap px-5 py-3.5 text-[12.5px]"
                      style={{ color: C.inkSoft, ...num }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-3.5 text-[14px] font-semibold" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="whitespace-nowrap px-5 py-3.5 text-[12.5px]"
                      style={{ color: C.inkMute, ...num }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="whitespace-nowrap px-5 py-3.5 text-[14px] font-semibold"
                      style={{ color: C.ink, ...num }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11.5px] font-semibold"
                        style={{
                          color: t.base,
                          background: t.soft,
                          borderRadius: "9px 11px 10px 12px",
                        }}
                      >
                        <Leaf size={11} aria-hidden="true" />
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Pot>
    </div>
  );
}
