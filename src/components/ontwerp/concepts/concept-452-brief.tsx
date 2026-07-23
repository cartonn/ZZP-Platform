"use client";

// Concept 452 — "Brief" · Briefing-first prioritering (summarize/prioritize-benadering).
// Elk scherm opent met één dominant "Wat is nu belangrijk"-herovlak: de belangrijkste actie groot,
// met serif-display en ledger-stijl cijfers. Daaronder een rustige, compacte index van de rest —
// als een goed vormgegeven ochtendbriefing of redactioneel jaarverslag. Warm crème/ivoor papier,
// serif-display (Fraunces/Spectral-achtig), één diep inkt-accent, sterke typografische hiërarchie.
// Animaties respecteren prefers-reduced-motion.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  ChevronRight,
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

// — Palet: warm ivoor papier, diep inkt, gedempte redactionele status-tinten —
const C = {
  paper: "#f7f1e3",
  paperDeep: "#f1e9d6",
  card: "#fbf6ea",
  cardSoft: "#f4ecda",
  ink: "#1c1a14", // diep inkt — hoofdaccent
  inkSoft: "#4a4536",
  inkMute: "#7c745f",
  inkFaint: "#a89e83",
  line: "rgba(28,26,20,0.16)",
  lineSoft: "rgba(28,26,20,0.09)",
  hover: "rgba(28,26,20,0.04)",
  // status (gedempt redactioneel)
  ok: "#3f6b4a",
  okInk: "#2f5439",
  okWash: "rgba(63,107,74,0.12)",
  warn: "#9a6a1a",
  warnInk: "#7a5210",
  warnWash: "rgba(154,106,26,0.14)",
  info: "#3d5573",
  infoInk: "#2c405a",
  infoWash: "rgba(61,85,115,0.12)",
  bad: "#9a3a30",
  badInk: "#7c2c24",
  badWash: "rgba(154,58,48,0.12)",
};

const display = {
  fontFamily: "'Fraunces', 'Spectral', 'Iowan Old Style', Georgia, 'Times New Roman', serif",
  letterSpacing: "-0.015em",
};
const serifBody = {
  fontFamily: "'Spectral', 'Iowan Old Style', Georgia, 'Times New Roman', serif",
};
const bodyFont = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const ledger = {
  fontFamily: "'Fraunces', 'Spectral', Georgia, ui-monospace, serif",
  fontVariantNumeric: "tabular-nums" as const,
};
const num = {
  fontFamily: "'Inter', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

function paperBg(): React.CSSProperties {
  return {
    backgroundColor: C.paper,
    backgroundImage:
      "radial-gradient(120% 70% at 100% -10%, rgba(154,106,26,0.06), transparent 55%)," +
      "radial-gradient(100% 60% at 0% 0%, rgba(28,26,20,0.03), transparent 50%)," +
      "linear-gradient(180deg, #f9f3e6, #f1e9d6)",
  };
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  ink: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        tone: C.ok,
        ink: C.okInk,
        wash: C.okWash,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        tone: C.info,
        ink: C.infoInk,
        wash: C.infoWash,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.warn,
        ink: C.warnInk,
        wash: C.warnWash,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.bad,
        ink: C.badInk,
        wash: C.badWash,
      };
  }
}

// — Papiervlak: crème kaart met dunne inkt-hairline, geen zware schaduw (redactioneel plat) —
function Sheet({
  children,
  className = "",
  as: Tag = "div",
  soft = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  soft?: boolean;
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-[6px] ${className}`}
      style={{
        background: soft ? C.cardSoft : C.card,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 2px 8px -6px rgba(28,26,20,0.3)",
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

// Redactionele rubriek-kop met inkt-streep en cijfer.
function Rubriek({ children, nr }: { children: React.ReactNode; nr?: string }) {
  return (
    <div className="flex items-center gap-3">
      {nr && (
        <span
          className="text-[11px] font-semibold tracking-[0.1em]"
          style={{ color: C.inkFaint, ...num }}
        >
          {nr}
        </span>
      )}
      <span
        className="text-[10.5px] font-semibold uppercase tracking-[0.28em]"
        style={{ color: C.inkMute, ...bodyFont }}
      >
        {children}
      </span>
      <span className="h-px flex-1" style={{ background: C.line }} aria-hidden="true" />
    </div>
  );
}

function Chip({
  children,
  tone,
  ink,
  wash,
  alarm = false,
}: {
  children: React.ReactNode;
  tone: string;
  ink: string;
  wash: string;
  alarm?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: ink, background: wash, border: `1px solid ${tone}55`, ...bodyFont }}
    >
      {children}
      {alarm && <span className="sr-only"> (let op)</span>}
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
      className={`group inline-flex items-center justify-center gap-2 rounded-[5px] px-5 py-2.5 text-[13px] font-semibold transition-all duration-200 hover:brightness-[1.15] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c1a14] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f1e3] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: C.paper,
        background: C.ink,
        border: `1px solid ${C.ink}`,
        boxShadow: "0 2px 6px -3px rgba(28,26,20,0.5)",
        ...bodyFont,
      }}
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
      className={`inline-flex items-center justify-center gap-2 rounded-[5px] px-4 py-2.5 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c1a14] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f1e3] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.paper : C.inkSoft,
        background: active ? C.ink : "transparent",
        border: `1px solid ${active ? C.ink : C.line}`,
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

function Meter({ value, tone = C.ink }: { value: number; tone?: string }) {
  return (
    <span className="hidden items-center gap-2.5 sm:flex" aria-hidden="true">
      <span
        className="relative h-1.5 w-24 overflow-hidden rounded-full"
        style={{ background: C.lineSoft }}
      >
        <span
          className="block h-full rounded-full"
          style={{
            width: `${value}%`,
            background: tone,
            transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </span>
      <span className="text-[12.5px] font-semibold" style={{ color: tone, ...num }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept452() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...serifBody, color: C.ink, ...paperBg() }}
    >
      <style>{`
        @keyframes brRise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .br-rise { animation: brRise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes brInk { from { opacity: 0; } to { opacity: 1; } }
        .br-ink { animation: brInk 0.7s ease both; }
        @media (prefers-reduced-motion: reduce) {
          .br-rise, .br-ink { animation: none !important; }
        }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <Masthead />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="br-rise pt-7">
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

function Masthead() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  const datum = "Woensdag 23 juli 2026";
  return (
    <header className="pt-8">
      <div
        className="flex items-center justify-between gap-3 pb-2.5"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.24em]"
          style={{ color: C.inkMute, ...bodyFont }}
        >
          {datum}
        </span>
        <div className="flex items-center gap-3">
          <span
            className="hidden items-center gap-1.5 text-[10.5px] font-semibold sm:inline-flex"
            style={{ color: C.okInk, ...bodyFont }}
          >
            <ShieldCheck size={12} aria-hidden="true" />
            {PROFIEL.trust}
          </span>
          <span
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-full"
            style={{ border: `1px solid ${C.line}`, color: C.inkMute }}
            aria-label={`${ongelezen} ongelezen berichten`}
          >
            <Bell size={14} aria-hidden="true" />
            {ongelezen > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold"
                style={{ background: C.ink, color: C.paper, ...num }}
                aria-hidden="true"
              >
                {ongelezen}
              </span>
            )}
          </span>
        </div>
      </div>
      <div className="flex items-end justify-between gap-4 pt-3">
        <div>
          <h1
            className="text-[38px] font-semibold leading-none sm:text-[46px]"
            style={{ color: C.ink, ...display }}
          >
            De Briefing
          </h1>
          <p className="mt-2 text-[12.5px] italic" style={{ color: C.inkMute, ...serifBody }}>
            Persoonlijke editie · {PROFIEL.naam} · {PROFIEL.plaats}
          </p>
        </div>
        <span
          className="hidden h-12 w-12 items-center justify-center rounded-full text-[14px] font-semibold sm:inline-flex"
          style={{ background: C.ink, color: C.paper, ...display }}
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
    <nav aria-label="Hoofdnavigatie" className="mt-5">
      <div
        className="flex items-center gap-5 overflow-x-auto pb-2.5"
        style={{ borderBottom: `2px solid ${C.ink}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 pb-2 text-[12.5px] font-semibold uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c1a14] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f1e3] motion-reduce:transition-none"
              style={{ color: on ? C.ink : C.inkMute, ...bodyFont }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-[2px] left-0 right-0 h-[3px]"
                  style={{ background: C.ink }}
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
  const top = OPDRACHTEN[0] as Opdracht;
  return (
    <div className="space-y-10">
      {/* HERO — het dominante "Wat is nu belangrijk"-vlak dat het scherm opent. */}
      <section aria-label="Belangrijkste vandaag">
        <Rubriek nr="01">Wat is nu belangrijk</Rubriek>
        <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-[1.55fr_1fr]">
          <div className="br-ink">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{
                color: C.warnInk,
                background: C.warnWash,
                border: `1px solid ${C.warn}55`,
                ...bodyFont,
              }}
            >
              <AlertTriangle size={11} aria-hidden="true" /> Urgent · vraagt vandaag actie
            </span>
            <h2
              className="mt-4 text-[36px] font-semibold leading-[1.04] sm:text-[52px]"
              style={{ color: C.ink, ...display }}
            >
              {primair.titel}
            </h2>
            <p
              className="mt-4 max-w-xl text-[16px] leading-relaxed"
              style={{ color: C.inkSoft, ...serifBody }}
            >
              {primair.detail} Alles wat vandaag telt staat hier bovenaan; de rest van de editie
              wacht rustig hieronder.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <PrimaryButton onClick={onActies}>
                {primair.cta}
                <ArrowRight
                  size={14}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </PrimaryButton>
              <GhostButton onClick={onOpen}>Naar de marktplaats</GhostButton>
            </div>
          </div>

          {/* Ledger-kolom: de kerncijfers als een jaarverslag-balans. */}
          <div
            className="rounded-[6px] p-6"
            style={{
              background: C.ink,
              color: C.paper,
              boxShadow: "0 8px 24px -12px rgba(28,26,20,0.6)",
            }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.24em]"
              style={{ color: C.inkFaint, ...bodyFont }}
            >
              De balans · deze maand
            </p>
            <dl className="mt-4 divide-y" style={{ borderColor: "rgba(247,241,227,0.16)" }}>
              {KPIS.map((k) => (
                <div key={k.label} className="flex items-baseline justify-between gap-3 py-3">
                  <dt
                    className="text-[13px]"
                    style={{ color: "rgba(247,241,227,0.72)", ...serifBody }}
                  >
                    {k.label}
                  </dt>
                  <dd className="flex items-baseline gap-2">
                    <span
                      className="text-[22px] font-semibold leading-none"
                      style={{ color: C.paper, ...ledger }}
                    >
                      {k.value}
                    </span>
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: k.up ? "#9fd3ac" : "#e2b47c", ...num }}
                    >
                      {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
            <p
              className="mt-4 flex items-center gap-2 text-[11px]"
              style={{ color: "rgba(247,241,227,0.6)", ...bodyFont }}
            >
              <Check size={12} aria-hidden="true" style={{ color: "#9fd3ac" }} />
              {verified}/{CREDENTIALS.length} certificaten geverifieerd
            </p>
          </div>
        </div>
      </section>

      {/* Uitgelichte match — redactionele "hoofdartikel"-kaart. */}
      <section aria-label="Uitgelichte opdracht">
        <Rubriek nr="02">Uitgelichte match</Rubriek>
        <Sheet className="mt-5 p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="min-w-0">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {top.opdrachtgever} · {top.plaats}
              </p>
              <h3
                className="mt-2 text-[26px] font-semibold leading-tight sm:text-[32px]"
                style={{ color: C.ink, ...display }}
              >
                {top.titel}
              </h3>
              <p
                className="mt-2 text-[14.5px] leading-relaxed"
                style={{ color: C.inkSoft, ...serifBody }}
              >
                {top.redenen.plus[0]} · {top.redenen.plus[1]}. Een sterke aansluiting op je
                geverifieerde profiel.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                {[
                  { l: "Tarief", v: top.tarief },
                  { l: "Omvang", v: top.uren },
                  { l: "Start", v: top.start },
                ].map((m) => (
                  <span key={m.l} className="flex items-baseline gap-1.5">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: C.inkFaint, ...bodyFont }}
                    >
                      {m.l}
                    </span>
                    <span className="text-[14px] font-semibold" style={{ color: C.ink, ...ledger }}>
                      {m.v}
                    </span>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <div className="text-left sm:text-right">
                <span
                  className="block text-[52px] font-semibold leading-none"
                  style={{ color: C.ink, ...ledger }}
                >
                  {top.match}
                </span>
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: C.inkMute, ...bodyFont }}
                >
                  match-score
                </span>
              </div>
              <PrimaryButton onClick={onOpen}>
                Lees & reageer <ArrowRight size={13} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Sheet>
      </section>

      {/* Compacte index van de rest — rustige redactionele kolommen. */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <Rubriek nr="03">Verder in de marktplaats</Rubriek>
          <ul className="mt-4">
            {OPDRACHTEN.slice(1).map((o, i) => (
              <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                <button
                  type="button"
                  onClick={onOpen}
                  className="group grid w-full grid-cols-[auto_1fr_auto] items-baseline gap-4 py-4 text-left transition-colors hover:bg-[rgba(28,26,20,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1c1a14] motion-reduce:transition-none"
                >
                  <span
                    className="text-[13px] font-semibold"
                    style={{ color: C.inkFaint, ...ledger }}
                  >
                    {o.match}
                  </span>
                  <span className="min-w-0">
                    <span
                      className="block truncate text-[16px] font-semibold"
                      style={{ color: C.ink, ...display }}
                    >
                      {o.titel}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[12px]"
                      style={{ color: C.inkMute, ...bodyFont }}
                    >
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </span>
                  </span>
                  <ChevronRight
                    size={16}
                    aria-hidden="true"
                    className="self-center transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                    style={{ color: C.inkFaint }}
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <Rubriek nr="04">Certificaten</Rubriek>
          <ul className="mt-4 space-y-1">
            {CREDENTIALS.map((c, i) => {
              const st = statusMeta(c.status);
              return (
                <li
                  key={c.naam}
                  className="flex items-center gap-3 py-2.5"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ background: st.wash, border: `1px solid ${st.tone}55`, color: st.ink }}
                    aria-hidden="true"
                  >
                    <st.Icon size={14} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[13.5px] font-semibold"
                      style={{ color: C.ink, ...serifBody }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="block truncate text-[11px]"
                      style={{ color: C.inkMute, ...bodyFont }}
                    >
                      {st.label}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
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

  const beste = filtered[0];

  return (
    <div className="space-y-8">
      {/* Hero-samenvatting: de beste match als opener. */}
      {beste && !q && (
        <section aria-label="Beste match nu">
          <Rubriek nr="01">Beste match nu</Rubriek>
          <Sheet className="mt-4 p-6 sm:p-8" soft>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                <h2
                  className="text-[28px] font-semibold leading-tight sm:text-[34px]"
                  style={{ color: C.ink, ...display }}
                >
                  {beste.titel}
                </h2>
                <p className="mt-2 text-[13.5px]" style={{ color: C.inkMute, ...bodyFont }}>
                  {beste.opdrachtgever} · {beste.plaats} · {beste.uren} · {beste.tarief}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className="text-[46px] font-semibold leading-none"
                  style={{ color: C.ink, ...ledger }}
                >
                  {beste.match}
                </span>
                <PrimaryButton onClick={onOpen}>
                  Reageer <ArrowRight size={13} aria-hidden="true" />
                </PrimaryButton>
              </div>
            </div>
          </Sheet>
        </section>
      )}

      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div
            className="flex flex-1 items-center gap-2.5 rounded-[5px] px-4 py-3"
            style={{ background: C.card, border: `1px solid ${C.line}` }}
          >
            <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek op titel, plaats of opdrachtgever…"
              aria-label="Opdrachten zoeken"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a89e83]"
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
                {s === "match" ? "Beste match" : "Tarief"}
              </GhostButton>
            ))}
            <GhostButton
              onClick={() => setLoading((v) => !v)}
              active={loading}
              ariaPressed={loading}
            >
              {loading ? "Stop" : "Laden…"}
            </GhostButton>
          </div>
        </div>

        <div className="mt-3">
          <Rubriek nr="02">
            {String(filtered.length).padStart(2, "0")} opdrachten in deze editie
          </Rubriek>
        </div>

        {loading ? (
          <ul className="mt-4 space-y-4" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li key={i}>
                <Sheet className="p-6">
                  <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                    <div className="h-3 w-24 rounded" style={{ background: C.lineSoft }} />
                    <div className="h-6 w-2/3 rounded" style={{ background: C.line }} />
                    <div className="h-3 w-1/2 rounded" style={{ background: C.lineSoft }} />
                  </div>
                </Sheet>
              </li>
            ))}
          </ul>
        ) : filtered.length === 0 ? (
          <Sheet className="mt-4 p-6">
            <div className="flex flex-col items-center py-14 text-center">
              <span
                className="inline-flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: C.cardSoft, border: `1px solid ${C.line}`, color: C.inkMute }}
                aria-hidden="true"
              >
                <Search size={24} />
              </span>
              <p className="mt-5 text-[24px] font-semibold" style={{ color: C.ink, ...display }}>
                Een lege editie
              </p>
              <p
                className="mx-auto mt-2 max-w-xs text-[14px]"
                style={{ color: C.inkSoft, ...serifBody }}
              >
                Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm; morgen brengt
                weer nieuwe pagina&rsquo;s.
              </p>
              <div className="mt-6">
                <PrimaryButton onClick={() => setQ("")}>
                  Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
                </PrimaryButton>
              </div>
            </div>
          </Sheet>
        ) : (
          <ul className="mt-4 space-y-4">
            {filtered.map((o, i) => (
              <li key={o.id}>
                <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
              </li>
            ))}
          </ul>
        )}
      </section>
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
    <Sheet className="p-6">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.inkFaint, ...bodyFont }}
            >
              № {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[22px] font-semibold leading-snug"
            style={{ color: C.ink, ...display }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkMute, ...bodyFont }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{ color: C.inkSoft, border: `1px solid ${C.line}`, ...bodyFont }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className="text-[40px] font-semibold leading-none"
            style={{ color: C.ink, ...ledger }}
          >
            {opdracht.match}
          </span>
          <span
            className="text-[9px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.inkFaint, ...bodyFont }}
          >
            match
          </span>
          <span
            className="mt-1 text-[13px] font-semibold"
            style={{ color: strong ? C.okInk : C.warnInk, ...ledger }}
          >
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-[5px] px-3.5 py-1.5 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c1a14] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf6ea]"
          style={{ color: C.ink, border: `1px solid ${C.line}`, ...bodyFont }}
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
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok titel="Voor jou" tone={C.okInk} Icon={Check} items={opdracht.redenen.plus} />
            <RedenBlok
              titel="Let op"
              tone={C.warnInk}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Sheet>
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
      className="rounded-[5px] p-4"
      style={{ background: C.cardSoft, border: `1px solid ${C.lineSoft}` }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: tone, ...bodyFont }}
      >
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2 text-[13px]"
            style={{ color: C.inkSoft, ...serifBody }}
          >
            <Icon size={13} aria-hidden="true" className="mt-1 shrink-0" style={{ color: tone }} />
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
    <div className="space-y-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-[0.12em] transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c1a14] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f1e3]"
        style={{ color: C.inkMute, ...bodyFont }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      {/* Hoofdartikel-kop. */}
      <header style={{ borderBottom: `1px solid ${C.line}` }} className="pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.inkMute, ...bodyFont }}
          >
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
            style={{ color: C.paper, background: C.ink, ...bodyFont }}
          >
            <Check size={11} aria-hidden="true" />
            {strong ? "Sterke match" : "Goede match"}
          </span>
        </div>
        <h1
          className="mt-4 max-w-3xl text-[36px] font-semibold leading-[1.05] sm:text-[48px]"
          style={{ color: C.ink, ...display }}
        >
          {opdracht.titel}
        </h1>
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <PrimaryButton>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </PrimaryButton>
          <GhostButton>Bewaren</GhostButton>
        </div>
      </header>

      {/* Ledger-balans van de opdracht. */}
      <section aria-label="Kerngegevens">
        <Rubriek nr="01">Kerngegevens</Rubriek>
        <div className="mt-4 grid grid-cols-2 gap-px sm:grid-cols-4" style={{ background: C.line }}>
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}` },
          ].map((m) => (
            <div key={m.l} className="p-5" style={{ background: C.card }}>
              <p
                className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {m.l}
              </p>
              <p className="mt-1.5 text-[24px] font-semibold" style={{ color: C.ink, ...ledger }}>
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <Rubriek nr="02">Verklaarbare matching</Rubriek>
        <p
          className="mt-4 max-w-2xl text-[15px] leading-relaxed"
          style={{ color: C.inkSoft, ...serifBody }}
        >
          Afgelezen van je geverifieerde profiel — wat je meebrengt én waar de aandacht ligt,
          transparant en zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Sheet className="p-6">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                style={{ color: C.okInk, background: C.okWash, border: `1px solid ${C.ok}55` }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.okInk, ...bodyFont }}
              >
                Voor jou
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px]"
                  style={{ color: C.inkSoft, ...serifBody }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-1 shrink-0"
                    style={{ color: C.okInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Sheet>
          <Sheet className="p-6" soft>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                style={{
                  color: C.warnInk,
                  background: C.warnWash,
                  border: `1px solid ${C.warn}55`,
                }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.warnInk, ...bodyFont }}
              >
                Let op
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px]"
                  style={{ color: C.inkSoft, ...serifBody }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-1 shrink-0"
                    style={{ color: C.warnInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Sheet>
        </div>
      </section>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  const aandacht = CREDENTIALS.find((c) => c.status === "EXPIRING");

  return (
    <div className="space-y-8">
      {/* Hero: samenvatting van de verificatiestatus. */}
      <section aria-label="Verificatie-overzicht">
        <Rubriek nr="01">De stand van je verificatie</Rubriek>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <h2
              className="text-[30px] font-semibold leading-tight sm:text-[38px]"
              style={{ color: C.ink, ...display }}
            >
              {verified} van {CREDENTIALS.length} certificaten geverifieerd.
            </h2>
            <p
              className="mt-3 max-w-xl text-[15px] leading-relaxed"
              style={{ color: C.inkSoft, ...serifBody }}
            >
              <span style={{ color: C.okInk }}>{PROFIEL.trust}.</span>{" "}
              {aandacht
                ? `${aandacht.naam} ${aandacht.detail.toLowerCase()} en vraagt om vernieuwing.`
                : ""}{" "}
              Documenten blijven versleuteld en privé.
            </p>
            <div className="mt-4 max-w-xs">
              <Meter value={ratio} tone={C.ink} />
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span
              className="block text-[64px] font-semibold leading-none"
              style={{ color: C.ink, ...ledger }}
            >
              {ratio}%
            </span>
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: C.inkMute, ...bodyFont }}
            >
              op orde
            </span>
          </div>
        </div>
      </section>

      <section>
        <Rubriek nr="02">Certificaten in detail</Rubriek>
        <Sheet className="mt-4">
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
                    className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[rgba(28,26,20,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1c1a14] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                        style={{
                          background: st.wash,
                          border: `1px solid ${st.tone}55`,
                          color: st.ink,
                        }}
                        aria-hidden="true"
                      >
                        <st.Icon size={15} />
                      </span>
                      <span className="min-w-0">
                        <span
                          className="block truncate text-[16px] font-semibold"
                          style={{ color: C.ink, ...serifBody }}
                        >
                          {c.naam}
                        </span>
                        <span
                          className="mt-0.5 block truncate text-[11.5px]"
                          style={{ color: C.inkMute, ...bodyFont }}
                        >
                          {c.detail}
                        </span>
                      </span>
                    </span>
                    <span className="hidden sm:flex">
                      <Chip tone={st.tone} ink={st.ink} wash={st.wash} alarm={st.alarm}>
                        <st.Icon size={11} aria-hidden="true" />
                        {st.label}
                      </Chip>
                    </span>
                    <span
                      className="hidden justify-self-end transition-transform motion-reduce:transition-none sm:block"
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
                      <div className="px-6 pb-5 sm:pl-[72px]">
                        <div
                          className="rounded-[5px] p-4"
                          style={{ background: C.cardSoft, border: `1px solid ${C.lineSoft}` }}
                        >
                          <p
                            className="max-w-xl text-[13.5px] leading-relaxed"
                            style={{ color: C.inkSoft, ...serifBody }}
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
        </Sheet>
      </section>

      <section>
        <Rubriek nr="03">Documentenkast</Rubriek>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Sheet key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[5px]"
                  style={{
                    background: C.cardSoft,
                    border: `1px solid ${C.line}`,
                    color: C.inkSoft,
                  }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13px] font-semibold"
                    style={{ color: C.ink, ...serifBody }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold"
                  style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}55` }}
                >
                  <st.Icon size={10} aria-hidden="true" />
                  {st.label}
                </span>
              </Sheet>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Acties() {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const rest = ACTIES.slice(1);
  return (
    <div className="space-y-8">
      <section aria-label="Belangrijkste actie">
        <Rubriek nr="01">Begin hier</Rubriek>
        <div
          className="mt-4 rounded-[6px] p-6 sm:p-8"
          style={{ background: C.ink, color: C.paper }}
        >
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "#e2b47c", border: "1px solid rgba(226,180,124,0.4)", ...bodyFont }}
          >
            <AlertTriangle size={11} aria-hidden="true" /> Meest urgent
          </span>
          <h2
            className="mt-4 text-[32px] font-semibold leading-[1.06] sm:text-[42px]"
            style={{ color: C.paper, ...display }}
          >
            {primair.titel}
          </h2>
          <p
            className="mt-3 max-w-xl text-[15px] leading-relaxed"
            style={{ color: "rgba(247,241,227,0.78)", ...serifBody }}
          >
            {primair.detail}
          </p>
          <div className="mt-5">
            <button
              type="button"
              className="group inline-flex items-center gap-2 rounded-[5px] px-5 py-2.5 text-[13px] font-semibold transition-all duration-200 hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7f1e3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c1a14] motion-reduce:transition-none"
              style={{ background: C.paper, color: C.ink, ...bodyFont }}
            >
              {primair.cta}
              <ArrowUpRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </button>
          </div>
        </div>
      </section>

      <section aria-label="Overige acties">
        <Rubriek nr="02">Verder deze week</Rubriek>
        <ol className="mt-4">
          {rest.map((a, i) => {
            const warn = a.urgentie === "warning";
            const tone = warn ? C.warnInk : C.infoInk;
            return (
              <li key={a.titel} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-5">
                  <span
                    className="text-[24px] font-semibold"
                    style={{ color: C.inkFaint, ...ledger }}
                  >
                    {String(i + 2).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                        style={{ color: tone, ...bodyFont }}
                      >
                        {warn ? (
                          <AlertTriangle size={10} aria-hidden="true" />
                        ) : (
                          <Check size={10} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Aanbevolen"}
                      </span>
                    </div>
                    <h3
                      className="mt-1 text-[19px] font-semibold leading-snug"
                      style={{ color: C.ink, ...display }}
                    >
                      {a.titel}
                    </h3>
                    <p
                      className="mt-1 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.inkSoft, ...serifBody }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <GhostButton className="hidden sm:inline-flex">
                    {a.cta} <ChevronRight size={13} aria-hidden="true" />
                  </GhostButton>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function factuurTone(status: string): {
  ink: string;
  wash: string;
  tone: string;
  Icon: LucideIcon | null;
} {
  if (status === "Openstaand")
    return { ink: C.warnInk, wash: C.warnWash, tone: C.warn, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.okInk, wash: C.okWash, tone: C.ok, Icon: Check };
  return { ink: C.inkMute, wash: C.hover, tone: C.line, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-8">
      <section aria-label="Financieel overzicht">
        <Rubriek nr="01">De rekening</Rubriek>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <h2
              className="text-[30px] font-semibold leading-tight sm:text-[38px]"
              style={{ color: C.ink, ...display }}
            >
              Eén factuur wacht op betaling.
            </h2>
            <p
              className="mt-3 max-w-lg text-[15px] leading-relaxed"
              style={{ color: C.inkSoft, ...serifBody }}
            >
              Van € 8.622 dit jaar is alles voldaan op één na. Een korte herinnering houdt je
              cashflow strak.
            </p>
          </div>
          <PrimaryButton>
            <Plus size={14} aria-hidden="true" /> Nieuwe factuur
          </PrimaryButton>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-px sm:grid-cols-3" style={{ background: C.line }}>
          {[
            { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false },
            { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true },
            { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false },
          ].map((s) => (
            <div key={s.l} className="p-5" style={{ background: s.alarm ? C.cardSoft : C.card }}>
              <div className="flex items-center justify-between">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: C.inkMute, ...bodyFont }}
                >
                  {s.l}
                </p>
                {s.alarm && (
                  <AlertTriangle size={13} aria-hidden="true" style={{ color: C.warnInk }} />
                )}
              </div>
              <p
                className="mt-2 text-[28px] font-semibold"
                style={{ color: s.alarm ? C.warnInk : C.ink, ...ledger }}
              >
                {s.v}
              </p>
              <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute, ...bodyFont }}>
                {s.sub}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <Rubriek nr="02">Facturenboek</Rubriek>
        <Sheet className="mt-4">
          <div
            className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-6 pb-3 pt-5 sm:grid"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
              <span
                key={h}
                className={`text-[9.5px] font-semibold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {h}
              </span>
            ))}
          </div>
          <ul>
            {FACTUREN.map((f, i) => {
              const ft = factuurTone(f.status);
              const acc = f.status === "Openstaand";
              return (
                <li
                  key={f.nr}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 px-6 py-4 transition-colors hover:bg-[rgba(28,26,20,0.04)] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="order-1 text-[11.5px] font-semibold"
                    style={{ color: C.inkMute, ...num }}
                  >
                    {f.nr}
                  </span>
                  <span
                    className="order-3 min-w-0 truncate text-[15px] font-semibold sm:order-2"
                    style={{ color: C.ink, ...serifBody }}
                  >
                    {f.klant}
                  </span>
                  <span
                    className="order-4 hidden text-[11.5px] sm:order-3 sm:inline"
                    style={{ color: C.inkMute, ...num }}
                  >
                    {f.datum}
                  </span>
                  <span className="order-5 sm:order-4">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                      style={{
                        color: ft.ink,
                        background: ft.wash,
                        border: `1px solid ${ft.tone}55`,
                        ...bodyFont,
                      }}
                    >
                      {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                      {f.status}
                    </span>
                  </span>
                  <span
                    className="order-2 text-right text-[16px] font-semibold sm:order-5"
                    style={{ color: acc ? C.warnInk : C.ink, ...ledger }}
                  >
                    {f.bedrag}
                  </span>
                </li>
              );
            })}
          </ul>
          <div
            className="flex items-baseline justify-between px-6 py-4"
            style={{ borderTop: `1px solid ${C.line}` }}
          >
            <span
              className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: C.inkMute, ...bodyFont }}
            >
              <Check size={12} aria-hidden="true" style={{ color: C.ok }} /> Totaal betaald
            </span>
            <span className="text-[24px] font-semibold" style={{ color: C.ink, ...ledger }}>
              {totaalBetaald}
            </span>
          </div>
        </Sheet>
      </section>
    </div>
  );
}
