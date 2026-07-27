"use client";

// Concept 490 — "Velijn" · Verfijnd redactioneel velijn/perkament-luxe. Warme crème/ivoor met
// translucente papierlagen, een klassieke serif als hoofdrolspeler, ruime marges en een kolomraster
// als luxe briefpapier/letterpers-drukwerk. Eén ingetogen inkt-accent, hairline-regels. Rust,
// vertrouwen en premium typografie — het meest "editorial luxe" concept.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Check,
  Clock,
  FileText,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
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

// — Palet: warme crème/ivoor perkament met één ingetogen inkt-accent (oxblood) —
const C = {
  bg: "#f4efe4",
  paper: "#fbf8f0",
  paperDeep: "#f0e9da",
  ink: "#2a251d",
  inkSoft: "#57503f",
  inkMute: "#8a8271",
  inkFaint: "#b3ab97",
  rule: "#ded4bf",
  ruleSoft: "#e8dfcd",

  accent: "#8a3a30", // oxblood inkt-accent
  accentDeep: "#6f2c24",
  accentSoft: "#f0e2dc",

  // ingetogen status-tinten, passend bij perkament
  sage: "#5c7052",
  sageSoft: "#e6ead9",
  ochre: "#9a7628",
  ochreSoft: "#efe6cc",
  slate: "#4f6272",
  slateSoft: "#e0e4e6",
};

const serif = {
  fontFamily:
    "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, 'Times New Roman', serif",
};
const sans = {
  fontFamily: "'Inter', 'Helvetica Neue', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
  fontVariantNumeric: "tabular-nums" as const,
};

type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.sage,
        soft: C.sageSoft,
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
      return { base: C.accent, soft: C.accentSoft, label: "Afgewezen", Icon: X, alarm: true };
  }
}

// — Overline: kleinkapitaal-label boven een sectie, letterpers-stijl —
function Overline({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10.5px] font-semibold uppercase tracking-[0.24em]"
      style={{ color: C.inkMute, ...sans }}
    >
      {children}
    </span>
  );
}

function Rule({ className = "" }: { className?: string }) {
  return (
    <span className={`block h-px ${className}`} style={{ background: C.rule }} aria-hidden="true" />
  );
}

// — Ingetogen serif-knop met inkt-accent —
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
  const pad = size === "sm" ? "px-3.5 py-1.5 text-[12.5px]" : "px-5 py-2.5 text-[13.5px]";
  const style: React.CSSProperties =
    variant === "solid"
      ? { background: C.accent, color: C.paper, border: `1px solid ${C.accentDeep}` }
      : variant === "line"
        ? { background: "transparent", color: C.accent, border: `1px solid ${C.accent}` }
        : { background: "transparent", color: C.inkSoft, border: `1px solid ${C.rule}` };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-[3px] font-semibold transition-all duration-150 hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a3a30] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4efe4] ${pad} ${className}`}
      style={{ ...style, ...serif }}
    >
      {children}
    </button>
  );
}

function StatusTag({ base, soft, label, Icon, alarm }: Tone) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[11px] font-semibold"
      style={{ color: base, background: soft, ...serif }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

// — Papierpaneel met dubbele hairline-rand (velijn-drukwerk) —
function Sheet({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Tag
      className={`rounded-[4px] ${className}`}
      style={{
        background: C.paper,
        border: `1px solid ${C.rule}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset, 0 14px 34px -26px rgba(42,37,29,0.5)",
      }}
    >
      {children}
    </Tag>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 92;
  const h = 26;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - 2 - ((d - min) / span) * (h - 4)] as const);
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
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="1.8" fill={tone} />
    </svg>
  );
}

// — Match als serif-cijfer met dunne onderstreping —
function MatchFigure({ value, small = false }: { value: number; small?: boolean }) {
  const strong = value >= 90;
  const tone = strong ? C.sage : C.accent;
  return (
    <span className="inline-flex flex-col items-center" aria-label={`Match ${value} procent`}>
      <span
        className={`font-semibold leading-none ${small ? "text-[22px]" : "text-[30px]"}`}
        style={{ color: tone, ...num }}
      >
        {value}
        <span className="align-super text-[0.5em]" style={{ color: C.inkMute }}>
          %
        </span>
      </span>
      <span
        className="mt-1 h-px w-full"
        style={{ background: tone, opacity: 0.5 }}
        aria-hidden="true"
      />
      <span
        className="mt-1 text-[9px] uppercase tracking-[0.18em]"
        style={{ color: C.inkMute, ...sans }}
      >
        match
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
        style={{ color: C.ink, ...serif }}
      >
        {children}
      </h2>
      <Rule className="mt-3" />
    </div>
  );
}

export function Concept490() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full antialiased"
      style={{
        ...serif,
        color: C.ink,
        background: C.bg,
        backgroundImage: [
          `radial-gradient(60% 40% at 12% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 60%)`,
          `radial-gradient(50% 40% at 100% 100%, rgba(138,58,48,0.05) 0%, rgba(255,255,255,0) 60%)`,
        ].join(","),
      }}
    >
      <div className="relative mx-auto max-w-5xl px-5 pb-20 sm:px-8 md:px-10">
        <Masthead />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="vl-fade pt-7">
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
        @keyframes vlFade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .vl-fade { animation: vlFade 0.36s ease both; }
        @media (prefers-reduced-motion: reduce) { .vl-fade { animation: none !important; } }
      `}</style>
    </div>
  );
}

function Masthead() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="pt-7">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-[3px] text-[17px] font-semibold"
            style={{ background: C.accent, color: C.paper, ...serif }}
            aria-hidden="true"
          >
            V
          </span>
          <div>
            <p
              className="text-[22px] font-semibold leading-none tracking-[0.02em]"
              style={{ color: C.ink, ...serif }}
            >
              Velijn
            </p>
            <p
              className="mt-1.5 text-[10.5px] uppercase tracking-[0.22em]"
              style={{ color: C.inkMute, ...sans }}
            >
              Register voor zelfstandigen
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="hidden items-center gap-1.5 text-[11px] font-semibold sm:inline-flex"
            style={{ color: C.sage, ...serif }}
          >
            <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <span
            className="hidden h-4 w-px sm:block"
            style={{ background: C.rule }}
            aria-hidden="true"
          />
          <span
            className="relative inline-flex h-9 items-center gap-1.5 rounded-[3px] px-2.5 text-[11.5px]"
            style={{ color: C.inkSoft, border: `1px solid ${C.rule}`, ...serif }}
            aria-label={`${ongelezen} ongelezen berichten`}
          >
            Post
            <span className="font-semibold" style={{ color: C.accent, ...num }}>
              {ongelezen}
            </span>
          </span>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold"
            style={{
              background: C.paperDeep,
              color: C.ink,
              border: `1px solid ${C.rule}`,
              ...serif,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </div>
      <div
        className="mt-5"
        style={{ borderTop: `2px solid ${C.ink}`, borderBottom: `1px solid ${C.rule}` }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 py-1.5">
          <span
            className="text-[10.5px] uppercase tracking-[0.2em]"
            style={{ color: C.inkMute, ...sans }}
          >
            {PROFIEL.naam} — {PROFIEL.rol}
          </span>
          <span
            className="text-[10.5px] uppercase tracking-[0.2em]"
            style={{ color: C.inkMute, ...sans }}
          >
            {PROFIEL.plaats} · Editie {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-4">
      <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <span key={s.key} className="flex items-center">
              {i > 0 && (
                <span className="mx-1 text-[11px]" style={{ color: C.inkFaint }} aria-hidden="true">
                  ·
                </span>
              )}
              <button
                type="button"
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="relative rounded-[3px] px-2 py-1 text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a3a30]"
                style={{ color: on ? C.accent : C.inkSoft, fontWeight: on ? 600 : 400, ...serif }}
              >
                {s.label}
                {on && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-0.5 left-2 right-2 h-px"
                    style={{ background: C.accent }}
                  />
                )}
              </button>
            </span>
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
      {/* Hoofdartikel + katern-kolom */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.7fr_1fr]">
        <div>
          <Overline>Voorpagina</Overline>
          <h1
            className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.015em] md:text-[40px]"
            style={{ color: C.ink, ...serif }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
            <span
              className="float-left mr-2 mt-1 text-[46px] font-semibold leading-[0.8]"
              style={{ color: C.accent, ...serif }}
            >
              U
            </span>
            w register is geverifieerd en op orde. Er liggen verse opdrachten klaar die aansluiten
            bij uw profiel, en één document in uw dossier vraagt binnenkort om aandacht.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Btn variant="solid" onClick={onActies}>
              Volgende actie <ArrowRight size={14} aria-hidden="true" />
            </Btn>
            <Btn variant="line" onClick={onMarkt}>
              Naar de marktplaats
            </Btn>
          </div>

          <Rule className="my-6" />

          {/* KPI-strook als kranten-cijferblok */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            {KPIS.map((k) => (
              <div key={k.label}>
                <p
                  className="text-[10px] uppercase tracking-[0.14em]"
                  style={{ color: C.inkMute, ...sans }}
                >
                  {k.label}
                </p>
                <p
                  className="mt-1 text-[24px] font-semibold leading-none"
                  style={{ color: C.ink, ...num }}
                >
                  {k.value}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: k.up ? C.sage : C.ochre, ...num }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                  <Spark data={k.spark} tone={C.inkFaint} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Katern: aandachtspunt + vertrouwen */}
        <aside className="lg:border-l lg:pl-8" style={{ borderColor: C.rule }}>
          <Overline>Vraagt aandacht</Overline>
          <Sheet className="mt-2 p-5">
            <div className="flex items-center gap-2" style={{ color: C.ochre }}>
              <AlertTriangle size={15} aria-hidden="true" />
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ ...sans }}
              >
                Termijn nadert
              </span>
            </div>
            <h3
              className="mt-2.5 text-[17px] font-semibold leading-snug"
              style={{ color: C.ink, ...serif }}
            >
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" className="mt-4 w-full" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </Sheet>

          <div className="mt-6">
            <Overline>Vertrouwen</Overline>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="text-[34px] font-semibold leading-none"
                style={{ color: C.ink, ...num }}
              >
                {ratio}%
              </span>
              <span className="text-[12px]" style={{ color: C.inkMute }}>
                dossier op orde
              </span>
            </div>
            <div
              className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
              style={{ background: C.paperDeep }}
              aria-hidden="true"
            >
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${ratio}%`,
                  background: C.sage,
                  transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            </div>
            <p className="mt-2 text-[12px]" style={{ color: C.inkMute }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd.
            </p>
          </div>
        </aside>
      </section>

      {/* Aanbevolen opdrachten */}
      <section>
        <div className="flex items-end justify-between">
          <SectionTitle over="Aanbevolen">Opdrachten voor u geselecteerd</SectionTitle>
          <button
            type="button"
            onClick={onMarkt}
            className="mb-4 ml-4 shrink-0 rounded text-[12px] font-semibold transition-colors hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a3a30]"
            style={{ color: C.accent, ...serif }}
          >
            Volledige lijst →
          </button>
        </div>
        <ul className="divide-y" style={{ borderColor: C.rule }}>
          {OPDRACHTEN.map((o) => (
            <li key={o.id} style={{ borderColor: C.rule }}>
              <OpdrachtRow opdracht={o} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      </section>

      {/* Certificatenregister */}
      <section>
        <SectionTitle over="Register">Uw certificaten</SectionTitle>
        <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            return (
              <div key={c.naam} className="flex items-center gap-3 py-1.5">
                <t.Icon size={16} aria-hidden="true" style={{ color: t.base }} />
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
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function OpdrachtRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-5 py-4 text-left transition-colors hover:bg-[#fbf8f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8a3a30]"
    >
      <span className="w-14 shrink-0">
        <MatchFigure value={opdracht.match} small />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-[17px] font-semibold leading-snug"
          style={{ color: C.ink, ...serif }}
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
        <span className="mt-1 flex items-center gap-1.5 text-[12px]" style={{ color: C.sage }}>
          <Check size={13} aria-hidden="true" /> {opdracht.redenen.plus[0]}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-[15px] font-semibold" style={{ color: C.ink, ...num }}>
          {opdracht.tarief.replace(" / uur", "")}
        </span>
        <span
          className="text-[10px] uppercase tracking-[0.14em]"
          style={{ color: C.inkFaint, ...sans }}
        >
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
          className="mt-1.5 text-[28px] font-semibold leading-tight tracking-[-0.01em]"
          style={{ color: C.ink, ...serif }}
        >
          Opdrachten die bij u passen
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: C.inkMute }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten sluiten aan op uw profiel.
        </p>
        <Rule className="mt-4" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[3px] px-3.5 py-2.5"
          style={{ background: C.paper, border: `1px solid ${C.rule}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#b3ab97]"
            style={{ color: C.ink, ...serif }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[#f0e9da] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a3a30]"
              style={{ color: C.inkMute }}
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
              <Sheet className="p-5">
                <div className="space-y-3">
                  <div
                    className="h-4 w-2/3 animate-pulse rounded motion-reduce:animate-none"
                    style={{ background: C.paperDeep }}
                  />
                  <div
                    className="h-3 w-1/2 animate-pulse rounded motion-reduce:animate-none"
                    style={{ background: C.paperDeep }}
                  />
                </div>
              </Sheet>
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
          tekst={`Er is geen opdracht voor ${q ? `“${q}”` : "uw zoekterm"}. Verruim uw zoekopdracht.`}
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
            className="rounded text-[11px] uppercase tracking-[0.14em] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a3a30]"
            style={{ color: C.inkFaint, ...sans }}
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
    <Sheet className="flex flex-col items-center px-6 py-16 text-center">
      <span
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ color: C.accent, border: `1px solid ${C.rule}` }}
        aria-hidden="true"
      >
        <Icon size={24} />
      </span>
      <p className="mt-4 text-[20px] font-semibold" style={{ color: C.ink, ...serif }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
        {tekst}
      </p>
      <Btn variant="line" className="mt-5" onClick={onCta}>
        <RotateCcw size={13} aria-hidden="true" /> {cta}
      </Btn>
    </Sheet>
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
    <Sheet as="article" className="overflow-hidden">
      <div className="flex items-start gap-5 p-5">
        <span className="w-16 shrink-0 pt-1">
          <MatchFigure value={opdracht.match} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: strong ? C.sage : C.accent, ...sans }}
            >
              {strong ? "Sterke match" : "Goede match"}
            </span>
            <span className="text-[11px]" style={{ color: C.inkFaint, ...num }}>
              № {String(index + 1).padStart(2, "0")} · {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-1.5 text-[19px] font-semibold leading-snug"
            style={{ color: C.ink, ...serif }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[13px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-[3px] px-2 py-0.5 text-[11.5px]"
                style={{
                  background: C.paperDeep,
                  color: C.inkSoft,
                  border: `1px solid ${C.ruleSoft}`,
                  ...serif,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="shrink-0 text-right">
          <span className="block text-[17px] font-semibold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span
            className="text-[10px] uppercase tracking-[0.14em]"
            style={{ color: C.inkFaint, ...sans }}
          >
            per uur
          </span>
        </span>
      </div>

      <Rule />
      <div className="flex flex-wrap items-center gap-3 px-5 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-[3px] text-[12.5px] font-semibold transition-colors hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a3a30]"
          style={{ color: C.accent, ...serif }}
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
          <Rule />
          <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2">
            <RedenKolom
              titel="In uw voordeel"
              tone={C.sage}
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
    </Sheet>
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
        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: tone, ...sans }}
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
              className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
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

      <header>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px]" style={{ color: C.inkMute, ...num }}>
            {opdracht.id}
          </span>
          <span className="h-3 w-px" style={{ background: C.rule }} aria-hidden="true" />
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: strong ? C.sage : C.accent, ...sans }}
          >
            {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-3 max-w-2xl text-[30px] font-semibold leading-[1.12] tracking-[-0.015em] md:text-[38px]"
          style={{ color: C.ink, ...serif }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 flex items-center gap-1.5 text-[14px]" style={{ color: C.inkMute }}>
          <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Btn variant="solid">
            Reageren op opdracht <ArrowRight size={14} aria-hidden="true" />
          </Btn>
          <Btn variant="line">Bewaren</Btn>
        </div>
      </header>

      <div
        className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4"
        style={{
          borderTop: `1px solid ${C.rule}`,
          borderBottom: `1px solid ${C.rule}`,
          paddingTop: 20,
          paddingBottom: 20,
        }}
      >
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Aanvang", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div key={m.l}>
            <p
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{ color: C.inkMute, ...sans }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[18px] font-semibold" style={{ color: C.ink, ...num }}>
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <section>
        <SectionTitle over="Motivering">Waarom deze match bij u past</SectionTitle>
        <p className="mb-5 max-w-xl text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgezet tegen uw geverifieerde profiel — open en navolgbaar, zonder verborgen score. Wat
          in uw voordeel spreekt, en wat goed is om vooraf te weten.
        </p>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="md:border-r md:pr-8" style={{ borderColor: C.rule }}>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.sage, ...sans }}
            >
              <Check size={13} aria-hidden="true" /> In uw voordeel
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
                    style={{ color: C.sage }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.ochre, ...sans }}
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
          </div>
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
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <Overline>Vertrouwensregister</Overline>
          <h1
            className="mt-1.5 text-[28px] font-semibold leading-tight tracking-[-0.01em]"
            style={{ color: C.ink, ...serif }}
          >
            {PROFIEL.trust}
          </h1>
          <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
            bijna — tijdig vernieuwen houdt uw dossier compleet. Al uw documenten worden versleuteld
            bewaard en uitsluitend met uw toestemming gedeeld.
          </p>
        </div>
        <aside className="lg:border-l lg:pl-8" style={{ borderColor: C.rule }}>
          <div className="flex items-baseline gap-2">
            <span
              className="text-[44px] font-semibold leading-none"
              style={{ color: C.ink, ...num }}
            >
              {ratio}%
            </span>
          </div>
          <p
            className="mt-1 text-[12px] uppercase tracking-[0.14em]"
            style={{ color: C.inkMute, ...sans }}
          >
            dossier op orde
          </p>
          <div
            className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: C.paperDeep }}
            aria-hidden="true"
          >
            <span
              className="block h-full rounded-full"
              style={{
                width: `${ratio}%`,
                background: C.sage,
                transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </div>
        </aside>
      </section>

      <section>
        <SectionTitle over="Certificaten">Documentregister</SectionTitle>
        <Sheet className="overflow-hidden">
          <ul>
            {CREDENTIALS.map((c, i) => {
              const t = credTone(c.status);
              const isOpen = open === c.naam;
              return (
                <li
                  key={c.naam}
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.ruleSoft}` }}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f0e9da] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8a3a30]"
                  >
                    <t.Icon size={17} aria-hidden="true" style={{ color: t.base }} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.ink, ...serif }}
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
                      <div className="px-5 pb-5 sm:pl-[52px]">
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Het document wordt versleuteld bewaard en uitsluitend na uw
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
                </li>
              );
            })}
          </ul>
        </Sheet>
      </section>

      <section>
        <SectionTitle over="Dossier">Documentenkast</SectionTitle>
        <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const t = credTone(d.status);
            return (
              <div
                key={d.naam}
                className="flex items-center gap-3 py-2"
                style={{ borderBottom: `1px solid ${C.ruleSoft}` }}
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
              </div>
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
          className="mt-1.5 text-[28px] font-semibold leading-tight tracking-[-0.01em]"
          style={{ color: C.ink, ...serif }}
        >
          Wat vandaag uw aandacht vraagt
        </h1>
        <p className="mt-1 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Op volgorde van urgentie — werk van boven naar beneden.
        </p>
        <Rule className="mt-4" />
      </div>

      <ol className="space-y-5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.ochre : C.slate;
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li key={a.titel} className="grid grid-cols-[auto_1fr] gap-5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-semibold"
                style={{ color: C.ink, border: `1px solid ${C.rule}`, ...num }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div
                className="min-w-0"
                style={{
                  borderBottom: i < ACTIES.length - 1 ? `1px solid ${C.ruleSoft}` : "none",
                  paddingBottom: i < ACTIES.length - 1 ? 20 : 0,
                }}
              >
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: tone, ...sans }}
                >
                  {warn ? (
                    <AlertTriangle size={12} aria-hidden="true" />
                  ) : (
                    <Clock size={12} aria-hidden="true" />
                  )}
                  {warn ? "Urgent" : "Aanbevolen"}
                </span>
                <h2
                  className="mt-1.5 text-[18px] font-semibold leading-snug"
                  style={{ color: C.ink, ...serif }}
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
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// —————————————————————————————————— Facturen ——————————————————————————————————
function factuurTone(status: string): { base: string; soft: string } {
  if (status === "Betaald") return { base: C.sage, soft: C.sageSoft };
  if (status === "Openstaand") return { base: C.ochre, soft: C.ochreSoft };
  if (status === "Concept") return { base: C.slate, soft: C.slateSoft };
  return { base: C.accent, soft: C.accentSoft };
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
            className="mt-1.5 text-[28px] font-semibold leading-tight tracking-[-0.01em]"
            style={{ color: C.ink, ...serif }}
          >
            Uw facturen
          </h1>
        </div>
        <Btn variant="solid">
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </Btn>
      </div>

      <section
        className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-3"
        style={{
          borderTop: `2px solid ${C.ink}`,
          borderBottom: `1px solid ${C.rule}`,
          paddingTop: 18,
          paddingBottom: 18,
        }}
      >
        {[
          { l: "Betaald", v: "€ 5.552", sub: "2 facturen", tone: C.sage },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: C.ochre },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: C.slate },
        ].map((s) => (
          <div key={s.l}>
            <p
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{ color: C.inkMute, ...sans }}
            >
              {s.l}
            </p>
            <p className="mt-1 text-[24px] font-semibold" style={{ color: s.tone, ...num }}>
              {s.v}
            </p>
            <p className="mt-0.5 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </div>
        ))}
      </section>

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

      <Sheet className="overflow-hidden">
        <table className="w-full text-left">
          <caption className="sr-only">Overzicht van facturen</caption>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.rule}` }}>
              {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: C.inkMute, ...sans }}
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
                  className="transition-colors hover:bg-[#f0e9da]"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.ruleSoft}` }}
                >
                  <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.inkSoft, ...num }}>
                    {f.nr}
                  </td>
                  <td
                    className="px-5 py-3.5 text-[14px] font-semibold"
                    style={{ color: C.ink, ...serif }}
                  >
                    {f.klant}
                  </td>
                  <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.inkMute, ...num }}>
                    {f.datum}
                  </td>
                  <td
                    className="px-5 py-3.5 text-[14px] font-semibold"
                    style={{ color: C.ink, ...num }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[11.5px] font-semibold"
                      style={{ color: t.base, background: t.soft, ...serif }}
                    >
                      {f.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Sheet>
    </div>
  );
}
