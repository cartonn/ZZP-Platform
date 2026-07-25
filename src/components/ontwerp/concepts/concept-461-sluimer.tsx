"use client";

// Concept 461 — "Sluimer" · Progressive-disclosure / calm interface. Bijna-monochroom leisteen-grijs
// als rust-toestand; precies ÉÉN signaalkleur (verzadigd teal/petrol #0f766e) die alleen "bloeit"
// op het element dat NU actie vraagt of onder hover/focus. Veel lucht, hairline-scheiders, alles
// gesluimerd tot je erop focust — vertrouwen via kalmte en reveal-on-demand.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wind,
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

// — Palet: leisteen-monochroom in rust, één teal-signaal dat bloeit bij actie/hover/focus —
const C = {
  bg: "#f7f8f9",
  surface: "#ffffff",
  raise: "#fbfcfc",
  ink: "#1f2937",
  inkSoft: "#475569",
  inkMute: "#748296",
  inkFaint: "#9aa6b4",
  line: "#e8ebee",
  lineSoft: "#f0f2f4",
  signal: "#0f766e", // het enige signaal — teal/petrol
  signalDeep: "#0b5a54",
  signalTint: "#eef7f5",
  signalWash: "#dcefec",
};

const bodyFont = {
  fontFamily:
    "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const num = {
  fontFamily: "'Inter', system-ui, sans-serif",
  fontVariantNumeric: "tabular-nums" as const,
};

// In de kalme interface tonen alle statussen een icoon + label (nooit kleur alleen). De teal-toon
// verschijnt alleen op wat aandacht vraagt; de rest sluimert in neutraal leisteen.
function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  attention: boolean;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, attention: false };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, attention: false };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: Bell, attention: true };
    case "REJECTED":
      return { label: "Afgewezen", Icon: Bell, attention: true };
  }
}

// — Rustig oppervlak: hairline-rand, subtiele schaduw, bloeit optioneel bij actie —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  bloom = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
  bloom?: boolean;
}) {
  return (
    <Tag
      className={`rounded-2xl transition-shadow duration-500 motion-reduce:transition-none ${className}`}
      style={{
        background: bloom ? C.signalTint : C.surface,
        border: `1px solid ${bloom ? C.signalWash : C.line}`,
        boxShadow: bloom ? "0 1px 2px rgba(15,118,110,0.06)" : "0 1px 2px rgba(31,41,55,0.03)",
      }}
    >
      {children}
    </Tag>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10.5px] font-semibold uppercase tracking-[0.22em]"
      style={{ color: C.inkFaint, ...bodyFont }}
    >
      {children}
    </p>
  );
}

// Primaire knop — de plek waar het signaal het sterkst bloeit.
function SignalButton({
  children,
  onClick,
  className = "",
  full = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-300 hover:-translate-y-px hover:shadow-[0_6px_18px_-6px_rgba(15,118,110,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f8f9] active:translate-y-0 motion-reduce:transition-none ${full ? "w-full" : ""} ${className}`}
      style={{ background: C.signal, ...bodyFont }}
    >
      {children}
    </button>
  );
}

// Rustige knop — leisteen in rust, teal-rand bloeit bij hover/focus.
function QuietButton({
  children,
  onClick,
  active = false,
  ariaPressed,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  ariaPressed?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all duration-300 hover:border-[#0f766e] hover:text-[#0f766e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f8f9] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.signal : C.inkSoft,
        background: active ? C.signalTint : C.surface,
        border: `1px solid ${active ? C.signalWash : C.line}`,
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

// — Kalme sparkline: gesluimerd tot je erop wijst —
function CalmSpark({ data, id, tone = C.inkFaint }: { data: number[]; id: string; tone?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 34;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 3 - ((d - min) / span) * (h - 6);
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} ${w},${h} 0,${h}`;
  const [lx, ly] = pts[pts.length - 1] ?? [w, h];
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sl-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.16" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sl-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lx} cy={ly} r="2.4" fill={tone} />
    </svg>
  );
}

function trendNumber(t: string) {
  return t.replace(/^[+-]/, "");
}

export function Concept461() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ background: C.bg, color: C.ink, ...bodyFont }}
    >
      <style>{`
        @keyframes sluimerIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .sluimer-in { animation: sluimerIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .sluimer-in { animation: none !important; } }
      `}</style>

      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="sluimer-in pt-7">
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
    <header className="flex items-center justify-between gap-4 py-6">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{ background: C.signalTint, border: `1px solid ${C.signalWash}`, color: C.signal }}
          aria-hidden="true"
        >
          <Wind size={19} strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-[16px] font-semibold leading-none tracking-[-0.01em]">Sluimer</p>
          <p className="mt-1.5 text-[11.5px] leading-none" style={{ color: C.inkMute }}>
            {PROFIEL.plaats} · rustig overzicht
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold sm:inline-flex"
          style={{ color: C.signal, background: C.signalTint, border: `1px solid ${C.signalWash}` }}
        >
          <ShieldCheck size={13} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:text-[#0f766e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f8f9]"
          style={{ background: C.surface, border: `1px solid ${C.line}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={15} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full"
              style={{ background: C.signal, border: `2px solid ${C.bg}` }}
              aria-hidden="true"
            />
          )}
        </button>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-semibold leading-tight">{PROFIEL.naam}</span>
          <span className="block text-[11px]" style={{ color: C.inkMute }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[12.5px] font-semibold"
          style={{ background: C.raise, border: `1px solid ${C.line}`, color: C.inkSoft, ...num }}
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
    <nav aria-label="Hoofdnavigatie">
      <div
        className="flex items-center gap-1 overflow-x-auto rounded-full p-1"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-1 focus-visible:ring-offset-[#ffffff] motion-reduce:transition-none"
              style={{
                color: on ? "#ffffff" : C.inkMute,
                background: on ? C.signal : "transparent",
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

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="p-7 md:p-9">
          <Eyebrow>Vandaag</Eyebrow>
          <h1 className="mt-4 text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[38px]">
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Alles rustig. Er is één ding dat aandacht vraagt — de rest sluimert veilig op de
            achtergrond. Ga stap voor stap, in je eigen tempo.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <SignalButton onClick={onActies}>
              Wat vraagt aandacht
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </SignalButton>
            <QuietButton onClick={onOpen}>Marktplaats bekijken</QuietButton>
          </div>
        </Panel>

        {/* Het enige element dat NU actie vraagt — hier bloeit het signaal. */}
        <Panel className="flex flex-col p-6" bloom>
          <div className="flex items-center gap-2">
            <Sparkles size={15} aria-hidden="true" style={{ color: C.signal }} />
            <Eyebrow>Vraagt aandacht</Eyebrow>
          </div>
          <h2 className="mt-3 text-[17px] font-semibold leading-snug">{primair.titel}</h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-auto pt-5">
            <SignalButton onClick={onActies} full>
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </SignalButton>
          </div>
          <p
            className="mt-4 flex items-center gap-2 border-t pt-4 text-[12px]"
            style={{ color: C.inkMute, borderColor: C.signalWash }}
          >
            <Check size={13} aria-hidden="true" style={{ color: C.signal }} />
            {verified}/{CREDENTIALS.length} certificaten op orde
          </p>
        </Panel>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <Eyebrow>Deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const Trend = k.up ? TrendingUp : TrendingDown;
            return (
              <Panel key={k.label} className="group p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-medium" style={{ color: C.inkMute }}>
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold transition-colors group-hover:text-[#0f766e]"
                    style={{ color: C.inkFaint, ...num }}
                  >
                    <Trend size={11} aria-hidden="true" /> {trendNumber(k.trend)}
                  </span>
                </div>
                <p
                  className="mt-3 text-[26px] font-semibold leading-none tracking-[-0.02em]"
                  style={num}
                >
                  {k.value}
                </p>
                <div className="mt-3 opacity-70 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none">
                  <CalmSpark data={k.spark} id={`k461-${i}`} tone={k.up ? C.signal : C.inkFaint} />
                </div>
              </Panel>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow>Passende opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="text-[11.5px] font-semibold transition-colors hover:text-[#0f766e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f8f9]"
              style={{ color: C.inkMute }}
            >
              Alles →
            </button>
          </div>
          <Panel>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#eef7f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0f766e] motion-reduce:transition-none"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold">{o.titel}</span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.inkMute }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span
                      className="text-[13px] font-semibold transition-colors group-hover:text-[#0f766e]"
                      style={{ color: C.inkSoft, ...num }}
                    >
                      {o.match}%
                    </span>
                    <ChevronRight
                      size={17}
                      aria-hidden="true"
                      className="shrink-0 transition-all group-hover:translate-x-0.5 group-hover:text-[#0f766e] motion-reduce:transition-none"
                      style={{ color: C.inkFaint }}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div>
          <div className="mb-3">
            <Eyebrow>Certificaten</Eyebrow>
          </div>
          <Panel className="p-4">
            <ul>
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 px-1 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                      style={{
                        background: st.attention ? C.signalTint : C.lineSoft,
                        color: st.attention ? C.signal : C.inkMute,
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-semibold">{c.naam}</span>
                      <span className="block truncate text-[10.5px]" style={{ color: C.inkMute }}>
                        {st.label}
                      </span>
                    </span>
                    {st.attention && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: C.signal }}
                        aria-hidden="true"
                      />
                    )}
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
      <div>
        <Eyebrow>Marktplaats</Eyebrow>
        <h1 className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.02em]">
          Rustig zoeken
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkMute }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten passen bij je profiel
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-4 py-2.5 transition-colors focus-within:border-[#0f766e]"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9aa6b4]"
            style={{ color: C.ink, ...bodyFont }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <QuietButton
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </QuietButton>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel className="p-6">
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: C.lineSoft, color: C.inkMute }}
              aria-hidden="true"
            >
              <Search size={22} />
            </span>
            <p className="mt-5 text-[19px] font-semibold">Niets gevonden — even rust</p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm en probeer
              opnieuw.
            </p>
            <div className="mt-6">
              <SignalButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </SignalButton>
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
  return (
    <Panel className="overflow-hidden">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4 p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id} · #{String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <h3 className="mt-1.5 text-[17px] font-semibold leading-snug">{opdracht.titel}</h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-medium"
                style={{ color: C.inkSoft, background: C.lineSoft }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="inline-flex items-baseline gap-1 rounded-full px-3 py-1.5"
            style={{ background: C.signalTint, border: `1px solid ${C.signalWash}` }}
          >
            <span
              className="text-[16px] font-semibold leading-none"
              style={{ color: C.signal, ...num }}
            >
              {opdracht.match}
            </span>
            <span
              className="text-[9px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.signal }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-semibold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 px-5 pb-5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold transition-colors hover:text-[#0f766e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffffff]"
          style={{ color: C.inkSoft }}
        >
          <ChevronDown
            size={14}
            aria-hidden="true"
            className="transition-transform motion-reduce:transition-none"
            style={{ transform: open ? "rotate(180deg)" : "none" }}
          />
          Waarom deze match
        </button>
        <div className="ml-auto">
          <SignalButton onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </SignalButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="grid grid-cols-1 gap-3 border-t px-5 py-4 sm:grid-cols-2"
            style={{ borderColor: C.lineSoft }}
          >
            <RedenBlok titel="Voor jou" items={opdracht.redenen.plus} positief />
            <RedenBlok titel="Let op" items={opdracht.redenen.min} positief={false} />
          </div>
        </div>
      </div>
    </Panel>
  );
}

function RedenBlok({
  titel,
  items,
  positief,
}: {
  titel: string;
  items: string[];
  positief: boolean;
}) {
  return (
    <div>
      <p
        className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: positief ? C.signal : C.inkMute }}
      >
        {positief ? <Check size={12} aria-hidden="true" /> : <Bell size={12} aria-hidden="true" />}
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.inkSoft }}>
            <span
              className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
              style={{ background: positief ? C.signal : C.inkFaint }}
              aria-hidden="true"
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors hover:text-[#0f766e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f8f9]"
        style={{ color: C.inkSoft, background: C.surface, border: `1px solid ${C.line}` }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug
      </button>

      <Panel className="p-7 md:p-9">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium" style={{ color: C.inkFaint, ...num }}>
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{
              color: C.signal,
              background: C.signalTint,
              border: `1px solid ${C.signalWash}`,
            }}
          >
            <Sparkles size={11} aria-hidden="true" /> {opdracht.match}% match
          </span>
        </div>
        <h1 className="mt-4 max-w-2xl text-[26px] font-semibold leading-[1.12] tracking-[-0.02em] md:text-[34px]">
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <SignalButton>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </SignalButton>
          <QuietButton>Bewaren</QuietButton>
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
              <Eyebrow>{m.l}</Eyebrow>
              <p className="mt-2 text-[17px] font-semibold tracking-[-0.01em]" style={num}>
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <section>
        <Eyebrow>Verklaarbare matching</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Rustig afgewogen tegen je geverifieerde profiel — wat je meebrengt én waar je op moet
          letten, transparant en zonder verborgen score.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-6" bloom>
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.signal }}
            >
              <Check size={13} aria-hidden="true" /> Voor jou
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
                    style={{ color: C.signal }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-6">
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.inkMute }}
            >
              <Bell size={13} aria-hidden="true" /> Let op
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: C.inkFaint }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
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
    <div className="space-y-5">
      <Panel className="p-7 md:p-9">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow>Verificatie</Eyebrow>
            <h1 className="mt-3 text-[25px] font-semibold leading-tight tracking-[-0.02em]">
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-semibold" style={{ color: C.signal }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om aandacht. Documenten blijven versleuteld en privé.
            </p>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{ background: C.signalTint, border: `1px solid ${C.signalWash}` }}
          >
            <span
              className="text-[28px] font-semibold leading-none"
              style={{ color: C.signal, ...num }}
            >
              {ratio}
            </span>
            <span
              className="mt-1 text-[8.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.signal }}
            >
              % op orde
            </span>
          </span>
        </div>
      </Panel>

      <Panel>
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
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#eef7f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0f766e] motion-reduce:transition-none sm:px-6"
                >
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      background: st.attention ? C.signalTint : C.lineSoft,
                      color: st.attention ? C.signal : C.inkMute,
                    }}
                    aria-hidden="true"
                  >
                    <st.Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold">{c.naam}</span>
                    <span
                      className="mt-0.5 block truncate text-[11.5px]"
                      style={{ color: C.inkMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span
                    className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-flex"
                    style={{
                      color: st.attention ? C.signal : C.inkMute,
                      background: st.attention ? C.signalTint : C.lineSoft,
                    }}
                  >
                    <st.Icon size={11} aria-hidden="true" />
                    {st.label}
                    {st.attention && <span className="sr-only"> (let op)</span>}
                  </span>
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 transition-transform motion-reduce:transition-none"
                    style={{ color: C.inkFaint, transform: isOpen ? "rotate(180deg)" : "none" }}
                  />
                </button>
                <div
                  className="grid transition-all duration-500 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 sm:pl-[80px]">
                      <div
                        className="rounded-xl p-4"
                        style={{ background: C.raise, border: `1px solid ${C.line}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na jouw
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <SignalButton>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </SignalButton>
                          <QuietButton>Historie</QuietButton>
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
          <Eyebrow>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Panel key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: C.lineSoft, color: C.inkSoft }}
                  aria-hidden="true"
                >
                  <FileText size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{d.naam}</span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold"
                  style={{
                    color: st.attention ? C.signal : C.inkMute,
                    background: st.attention ? C.signalTint : C.lineSoft,
                  }}
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
    <div className="space-y-5">
      <div>
        <Eyebrow>Acties</Eyebrow>
        <h1 className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.02em]">
          Eén ding tegelijk
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Rustig van boven naar beneden. Alleen wat écht aandacht vraagt bloeit op — de rest kan
          wachten.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Panel className="p-5" bloom={warn}>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold"
                    style={{
                      background: warn ? C.signal : C.lineSoft,
                      color: warn ? "#ffffff" : C.inkMute,
                      ...num,
                    }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                      style={{
                        color: warn ? C.signal : C.inkMute,
                        background: warn ? C.signalTint : C.lineSoft,
                      }}
                    >
                      {warn ? "Vraagt aandacht" : "Aanbevolen"}
                    </span>
                    <h2 className="mt-2 text-[17px] font-semibold leading-snug">{a.titel}</h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    {warn ? (
                      <SignalButton>
                        {a.cta}
                        <ArrowRight size={13} aria-hidden="true" />
                      </SignalButton>
                    ) : (
                      <QuietButton>
                        {a.cta}
                        <ArrowRight size={13} aria-hidden="true" />
                      </QuietButton>
                    )}
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

function factuurMeta(status: string): { label: string; Icon: LucideIcon; attention: boolean } {
  if (status === "Openstaand") return { label: "Openstaand", Icon: Clock, attention: true };
  if (status === "Betaald") return { label: "Betaald", Icon: Check, attention: false };
  return { label: "Concept", Icon: FileText, attention: false };
}

function Facturen() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen</Eyebrow>
          <h1 className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.02em]">
            Overzicht
          </h1>
        </div>
        <SignalButton>Nieuwe factuur</SignalButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Voldaan", v: "€ 8.622", sub: "3 facturen", bloom: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", bloom: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", bloom: false },
        ].map((s) => (
          <Panel key={s.l} className="p-5" bloom={s.bloom}>
            <Eyebrow>{s.l}</Eyebrow>
            <p
              className="mt-2 text-[24px] font-semibold tracking-[-0.02em]"
              style={{ color: s.bloom ? C.signal : C.ink, ...num }}
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
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
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
                    className={`px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] ${c.a === "right" ? "text-right" : ""}`}
                    style={{ color: C.inkFaint, ...bodyFont }}
                  >
                    {c.h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const fm = factuurMeta(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#eef7f5]"
                    style={{ borderTop: `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-5 py-3.5 text-[11.5px] font-medium"
                      style={{ color: C.inkMute, ...num }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-3.5 text-[13.5px] font-semibold">{f.klant}</td>
                    <td className="px-5 py-3.5 text-[11.5px]" style={{ color: C.inkMute, ...num }}>
                      {f.datum}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                        style={{
                          color: fm.attention ? C.signal : C.inkMute,
                          background: fm.attention ? C.signalTint : C.lineSoft,
                        }}
                      >
                        <fm.Icon size={11} aria-hidden="true" />
                        {fm.label}
                      </span>
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[13.5px] font-semibold"
                      style={{ color: fm.attention ? C.signal : C.ink, ...num }}
                    >
                      {f.bedrag}
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
