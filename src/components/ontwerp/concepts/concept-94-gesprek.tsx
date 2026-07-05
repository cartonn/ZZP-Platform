"use client";

// Concept 94 — "Gesprek" · conversationeel formulier, één-vraag-per-scherm (Typeform-grade).
// Het platform als een kalme, geleide flow: precies één ding tegelijk in het midden van het scherm,
// een subtiele voortgangsbalk bovenaan, vloeiende overgangen en toetsenbord-hints (Enter ↵).
// Verificatie-upload wordt een stap-voor-stap wizard, reageren op een opdracht een gesprek, de
// dashboard/marktplaats/facturen delen dezelfde ruime, gefocuste taal: licht, sereen, veel witruimte,
// grote type. Rustpunt in plaats van dashboard-drukte — het systeem stelt de volgende beste vraag.
// Fonts: --font-lab-sora (display, groot & rustig) + --font-lab-inter (body/UI).

import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  CornerDownLeft,
  Check,
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
  Upload,
  MapPin,
  Send,
  Plus,
  FileText,
  Sparkles,
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
  NAV,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

void NAV;

/* ---------- Palet & typografie ---------- */

const C = {
  bg: "#f6f5f1",
  paper: "#ffffff",
  soft: "#efeee9",
  ink: "#181613",
  sub: "#5c574f",
  faint: "#928c81",
  accent: "#4f46e5",
  accentSoft: "#eceafe",
  accentInk: "#3730a3",
  line: "rgba(24,22,19,0.10)",
  lineSoft: "rgba(24,22,19,0.06)",
  ok: "#3f7a52",
  warn: "#b0791f",
  alert: "#b23c30",
  info: "#4a6b8a",
};

const display = { fontFamily: "var(--font-lab-sora)" };
const body = { fontFamily: "var(--font-lab-inter)" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f5f1]";

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; color: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.ok, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In behandeling", color: C.info, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", color: C.warn, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.alert, Icon: XCircle };
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Kleine bouwstenen ---------- */

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em]"
      style={{ ...body, color: C.accent }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: C.accent }}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

function KeyHint({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[12.5px]"
      style={{ ...body, color: C.faint }}
    >
      {children}
    </span>
  );
}

function KeyCap({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold"
      style={{
        ...body,
        color: C.sub,
        background: C.paper,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 0 rgba(24,22,19,0.05)",
      }}
    >
      {children}
    </kbd>
  );
}

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
      style={{
        ...body,
        color: m.color,
        background: `${m.color}14`,
        border: `1px solid ${m.color}33`,
      }}
    >
      <Icon size={13} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function PillButton({
  children,
  onClick,
  variant = "primary",
  disabled,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "quiet";
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const styles =
    variant === "primary"
      ? { color: "#ffffff", background: C.accent, border: `1px solid ${C.accent}` }
      : variant === "ghost"
        ? { color: C.ink, background: C.paper, border: `1px solid ${C.line}` }
        : { color: C.sub, background: "transparent", border: "1px solid transparent" };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[14px] font-semibold transition-all hover:brightness-[1.03] active:translate-y-px disabled:opacity-50 ${RING}`}
      style={{ ...body, ...styles }}
    >
      {children}
    </button>
  );
}

// Serene mini-sparkline.
function Spark({ data, color = C.accent }: { data: number[]; color?: string }) {
  const w = 120;
  const h = 34;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 6) - 3;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={area} fill={`${color}14`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2.4" fill={color} />}
    </svg>
  );
}

/* ---------- Voortgangsbalk (het handtekening-element) ---------- */

function Progress({ value }: { value: number }) {
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full"
      style={{ background: C.soft }}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Voortgang van deze flow"
    >
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${value}%`, background: `linear-gradient(90deg, ${C.accent}, #7c74f0)` }}
      />
    </div>
  );
}

// Vloeiende fade/slide-in bij het wisselen van vraag.
function Reveal({ id, children }: { id: string | number; children: React.ReactNode }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    setShown(false);
    const t = window.setTimeout(() => setShown(true), 20);
    return () => window.clearTimeout(t);
  }, [id]);
  return (
    <div
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 360ms ease, transform 360ms cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {children}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept94() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const openOpdracht = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, color: C.ink, background: C.bg }}
    >
      {/* Kop: merk + slanke screen-switcher */}
      <header
        className="sticky top-0 z-10"
        style={{ background: `${C.bg}f2`, backdropFilter: "blur(8px)" }}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-5 pb-3 pt-5 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-xl text-[13px] font-bold"
                style={{ ...display, color: "#fff", background: C.accent }}
                aria-hidden="true"
              >
                G
              </span>
              <span
                className="text-[15px] font-semibold tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                Gesprek
              </span>
            </div>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-semibold"
              style={{ color: C.accentInk, background: C.accentSoft }}
              title={PROFIEL.naam}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
          <nav
            className="flex gap-1 overflow-x-auto pb-1"
            aria-label="Kies een onderdeel"
            style={{ scrollbarWidth: "none" }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${RING}`}
                  style={{
                    color: on ? C.accentInk : C.sub,
                    background: on ? C.accentSoft : "transparent",
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-16 pt-6 sm:px-8">
        {screen === "dashboard" && <Dashboard onGo={setScreen} onOpen={openOpdracht} />}
        {screen === "marktplaats" && <Marktplaats onOpen={openOpdracht} />}
        {screen === "opdracht" && <OpdrachtGesprek opdracht={active} onGo={setScreen} />}
        {screen === "verificatie" && <VerificatieWizard />}
        {screen === "acties" && <Acties onGo={setScreen} />}
        {screen === "facturen" && <Facturen />}
      </main>
    </div>
  );
}

/* ---------- Dashboard — serene samenvatting + volgende beste stap ---------- */

function Dashboard({
  onGo,
  onOpen,
}: {
  onGo: (k: ScreenKey) => void;
  onOpen: (id?: string) => void;
}) {
  const focus = ACTIES[0];
  const top = OPDRACHTEN[0];
  const voornaam = PROFIEL.naam.split(" ")[0];

  return (
    <Reveal id="dashboard">
      <div className="space-y-10">
        <div className="space-y-4 pt-4">
          <Kicker>Vandaag</Kicker>
          <h1
            className="text-[34px] leading-[1.1] tracking-tight sm:text-[44px]"
            style={{ ...display, color: C.ink }}
          >
            Goedemorgen, {voornaam}.
          </h1>
          <p className="max-w-lg text-[16px] leading-relaxed" style={{ color: C.sub }}>
            Je bent op {PROFIEL.trust.toLowerCase()}. Er zijn {OPDRACHTEN.length} passende
            opdrachten en één ding dat vandaag je aandacht vraagt.
          </p>
        </div>

        {/* De volgende beste stap — het rustpunt */}
        {focus && (
          <div
            className="rounded-3xl p-6 sm:p-8"
            style={{
              background: C.paper,
              border: `1px solid ${C.line}`,
              boxShadow: "0 30px 60px -50px rgba(24,22,19,0.5)",
            }}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
              <span
                className="text-[12.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.accent }}
              >
                Volgende beste stap
              </span>
            </div>
            <p
              className="mt-4 text-[22px] font-semibold leading-snug sm:text-[26px]"
              style={{ ...display, color: C.ink }}
            >
              {focus.titel}
            </p>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed" style={{ color: C.sub }}>
              {focus.detail}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <PillButton onClick={() => onGo("verificatie")}>
                {focus.cta} <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
              </PillButton>
              <KeyHint>
                Druk <KeyCap>Enter ↵</KeyCap> om te beginnen
              </KeyHint>
            </div>
          </div>
        )}

        {/* KPI's — rustig, drie op een rij */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {KPIS.map((k) => (
            <div
              key={k.label}
              className="rounded-2xl p-4"
              style={{ background: C.paper, border: `1px solid ${C.lineSoft}` }}
            >
              <p className="text-[11.5px] font-medium leading-tight" style={{ color: C.faint }}>
                {k.label}
              </p>
              <p
                className="mt-2 text-[22px] font-semibold tabular-nums tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                {k.value}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <span
                  className="text-[12px] font-semibold tabular-nums"
                  style={{ color: k.up ? C.ok : C.warn }}
                >
                  {k.up ? "▲" : "▼"} {k.trend}
                </span>
                <Spark data={k.spark} color={k.up ? C.accent : C.warn} />
              </div>
            </div>
          ))}
        </div>

        {/* Top-match als rustige uitnodiging */}
        {top && (
          <div>
            <h2
              className="mb-3 text-[13px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.faint }}
            >
              Beste match voor jou
            </h2>
            <button
              type="button"
              onClick={() => onOpen(top.id)}
              className={`flex w-full items-center gap-4 rounded-2xl p-5 text-left transition-all hover:-translate-y-0.5 ${RING}`}
              style={{ background: C.paper, border: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl text-[16px] font-bold tabular-nums"
                style={{ ...display, color: C.accentInk, background: C.accentSoft }}
                aria-hidden="true"
              >
                {top.match}
                <span className="text-[9px] font-medium tracking-wide" style={{ color: C.accent }}>
                  match
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-semibold" style={{ color: C.ink }}>
                  {top.titel}
                </span>
                <span
                  className="mt-0.5 flex items-center gap-1.5 truncate text-[13px]"
                  style={{ color: C.sub }}
                >
                  <MapPin size={13} strokeWidth={2} aria-hidden="true" /> {top.opdrachtgever} ·{" "}
                  {top.plaats} · {top.tarief}
                </span>
              </span>
              <ArrowRight size={20} strokeWidth={2} color={C.accent} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Berichten-preview */}
        <div>
          <h2
            className="mb-3 text-[13px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: C.faint }}
          >
            Recente berichten
          </h2>
          <ul className="space-y-2">
            {BERICHTEN.slice(0, 2).map((b) => (
              <li
                key={b.van}
                className="flex items-center gap-3 rounded-2xl p-3.5"
                style={{ background: C.paper, border: `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                  style={{ color: C.accentInk, background: C.accentSoft }}
                  aria-hidden="true"
                >
                  {b.initialen}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[13.5px] font-semibold" style={{ color: C.ink }}>
                      {b.van}
                    </span>
                    {b.ongelezen && (
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: C.accent }}
                        aria-label="ongelezen bericht"
                      />
                    )}
                  </span>
                  <span className="block truncate text-[12.5px]" style={{ color: C.sub }}>
                    {b.preview}
                  </span>
                </span>
                <span className="shrink-0 text-[11.5px] tabular-nums" style={{ color: C.faint }}>
                  {b.tijd}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Reveal>
  );
}

/* ---------- Marktplaats — één opdracht per scherm ---------- */

function Marktplaats({ onOpen }: { onOpen: (id?: string) => void }) {
  const [i, setI] = useState(0);
  const total = OPDRACHTEN.length;
  const o = OPDRACHTEN[i] as Opdracht;
  const next = () => setI((v) => Math.min(v + 1, total - 1));
  const prev = () => setI((v) => Math.max(v - 1, 0));

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between">
        <Kicker>Marktplaats</Kicker>
        <span className="text-[13px] font-semibold tabular-nums" style={{ color: C.faint }}>
          {i + 1} / {total}
        </span>
      </div>
      <Progress value={((i + 1) / total) * 100} />

      <Reveal id={o.id}>
        <div
          className="rounded-3xl p-6 sm:p-8"
          style={{
            background: C.paper,
            border: `1px solid ${C.line}`,
            boxShadow: "0 30px 60px -50px rgba(24,22,19,0.5)",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span
                className="text-[12.5px] font-semibold tracking-wide"
                style={{ color: C.accent }}
              >
                {o.id}
              </span>
              <h2
                className="mt-1.5 text-[26px] leading-tight tracking-tight sm:text-[30px]"
                style={{ ...display, color: C.ink }}
              >
                {o.titel}
              </h2>
              <p className="mt-2 flex items-center gap-1.5 text-[14px]" style={{ color: C.sub }}>
                <MapPin size={14} strokeWidth={2} aria-hidden="true" /> {o.opdrachtgever} ·{" "}
                {o.plaats}
              </p>
            </div>
            <span
              className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl text-[20px] font-bold tabular-nums"
              style={{ ...display, color: C.accentInk, background: C.accentSoft }}
              aria-label={`Match ${o.match} procent`}
            >
              {o.match}
              <span
                className="text-[9px] font-medium tracking-wide"
                style={{ color: C.accent }}
                aria-hidden="true"
              >
                match
              </span>
            </span>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { l: "Tarief", v: o.tarief },
              { l: "Omvang", v: o.uren },
              { l: "Start", v: o.start },
            ].map((m) => (
              <div
                key={m.l}
                className="rounded-2xl p-3.5 text-center"
                style={{ background: C.soft }}
              >
                <dt
                  className="text-[11px] font-medium uppercase tracking-wide"
                  style={{ color: C.faint }}
                >
                  {m.l}
                </dt>
                <dd
                  className="mt-1 text-[15px] font-semibold tabular-nums"
                  style={{ ...display, color: C.ink }}
                >
                  {m.v}
                </dd>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {o.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-3 py-1 text-[12.5px] font-medium"
                style={{ color: C.sub, background: C.soft, border: `1px solid ${C.lineSoft}` }}
              >
                {t}
              </span>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <PillButton onClick={() => onOpen(o.id)}>
              Bekijk & reageer <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
            </PillButton>
            <PillButton
              variant="ghost"
              onClick={next}
              disabled={i >= total - 1}
              ariaLabel="Volgende opdracht"
            >
              Volgende <CornerDownLeft size={15} strokeWidth={2.4} aria-hidden="true" />
            </PillButton>
          </div>
        </div>
      </Reveal>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prev}
          disabled={i === 0}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors disabled:opacity-40 ${RING}`}
          style={{ color: C.sub }}
        >
          <ArrowLeft size={15} strokeWidth={2.2} aria-hidden="true" /> Vorige
        </button>
        <KeyHint>
          <KeyCap>↑</KeyCap> <KeyCap>↓</KeyCap> om te bladeren
        </KeyHint>
      </div>
    </div>
  );
}

/* ---------- Opdracht — reageren als gesprek ---------- */

type ChatStep = { from: "hen" | "jij"; text: string };

function OpdrachtGesprek({ opdracht, onGo }: { opdracht: Opdracht; onGo: (k: ScreenKey) => void }) {
  const [phase, setPhase] = useState<"intro" | "sending" | "sent">("intro");
  const react = () => {
    if (phase !== "intro") return;
    setPhase("sending");
    window.setTimeout(() => setPhase("sent"), 900);
  };

  const stream: ChatStep[] = [
    { from: "hen", text: `Hoi! We zoeken iemand voor "${opdracht.titel}" in ${opdracht.plaats}.` },
    {
      from: "hen",
      text: `${opdracht.tarief} · ${opdracht.uren} · start ${opdracht.start}. Past dit bij je?`,
    },
  ];

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onGo("marktplaats")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium ${RING}`}
          style={{ color: C.sub }}
        >
          <ArrowLeft size={15} strokeWidth={2.2} aria-hidden="true" /> Terug
        </button>
        <span className="text-[12.5px] font-semibold" style={{ color: C.accent }}>
          {opdracht.id}
        </span>
      </div>

      {/* Rijke kaart bovenaan het gesprek */}
      <div
        className="rounded-3xl p-6"
        style={{ background: C.paper, border: `1px solid ${C.line}` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-[24px] leading-tight tracking-tight"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h2>
            <p className="mt-1.5 text-[14px]" style={{ color: C.sub }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <span
            className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl text-[18px] font-bold tabular-nums"
            style={{ ...display, color: C.accentInk, background: C.accentSoft }}
            aria-label={`Match ${opdracht.match} procent`}
          >
            {opdracht.match}
            <span className="text-[9px] font-medium" style={{ color: C.accent }} aria-hidden="true">
              match
            </span>
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide"
              style={{ color: C.ok }}
            >
              <Check size={13} strokeWidth={3} aria-hidden="true" /> Waarom het past
            </p>
            <ul className="mt-2 space-y-1.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2 text-[13.5px]"
                  style={{ color: C.ink }}
                >
                  <Check
                    size={14}
                    strokeWidth={2.4}
                    color={C.ok}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />{" "}
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide"
              style={{ color: C.warn }}
            >
              <AlertTriangle size={13} strokeWidth={2.4} aria-hidden="true" /> Let op
            </p>
            <ul className="mt-2 space-y-1.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2 text-[13.5px]"
                  style={{ color: C.sub }}
                >
                  <AlertTriangle
                    size={14}
                    strokeWidth={2.2}
                    color={C.warn}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />{" "}
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Gespreks-stream */}
      <div className="space-y-3" aria-live="polite">
        {stream.map((m, idx) => (
          <div key={idx} className="max-w-[80%]">
            <div
              className="rounded-2xl rounded-tl-md px-4 py-3 text-[14px] leading-relaxed"
              style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.ink }}
            >
              {m.text}
            </div>
          </div>
        ))}

        {phase === "sent" && (
          <div className="ml-auto max-w-[80%]">
            <div
              className="rounded-2xl rounded-tr-md px-4 py-3 text-[14px] leading-relaxed"
              style={{ background: C.accent, color: "#fff" }}
            >
              Ja, dit past goed bij mijn beschikbaarheid en tarief. Ik reageer graag!
            </div>
            <p
              className="mt-1 flex items-center justify-end gap-1 text-[11.5px]"
              style={{ color: C.ok }}
            >
              <Check size={12} strokeWidth={3} aria-hidden="true" /> Verstuurd
            </p>
          </div>
        )}
      </div>

      {/* Antwoord-actie */}
      {phase !== "sent" ? (
        <div
          className="flex items-center gap-3 rounded-full p-2 pl-5"
          style={{ background: C.paper, border: `1px solid ${C.line}` }}
        >
          <span className="flex-1 truncate text-[14px]" style={{ color: C.faint }}>
            {phase === "sending" ? "Reactie versturen…" : "Reageer op deze opdracht…"}
          </span>
          <button
            type="button"
            onClick={react}
            disabled={phase === "sending"}
            aria-label="Reactie versturen"
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-all disabled:opacity-60 ${RING}`}
            style={{ background: C.accent, color: "#fff" }}
          >
            {phase === "sending" ? (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden="true"
              />
            ) : (
              <Send size={17} strokeWidth={2.2} aria-hidden="true" />
            )}
          </button>
        </div>
      ) : (
        <div
          className="flex flex-col items-center gap-3 rounded-3xl p-7 text-center"
          style={{ background: C.accentSoft, border: `1px solid ${C.accent}33` }}
        >
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: C.accent }}
          >
            <Check size={22} strokeWidth={2.6} color="#fff" aria-hidden="true" />
          </span>
          <p className="text-[16px] font-semibold" style={{ ...display, color: C.accentInk }}>
            Je reactie is onderweg
          </p>
          <p className="max-w-sm text-[13.5px]" style={{ color: C.sub }}>
            {opdracht.opdrachtgever} reageert gemiddeld binnen 6 uur. We laten het je weten.
          </p>
          <PillButton variant="ghost" onClick={() => onGo("marktplaats")}>
            Terug naar marktplaats <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
          </PillButton>
        </div>
      )}
    </div>
  );
}

/* ---------- Verificatie — stap-voor-stap upload wizard ---------- */

function VerificatieWizard() {
  const [step, setStep] = useState(0);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done">("idle");
  const total = CREDENTIALS.length;
  const cred = CREDENTIALS[step] as (typeof CREDENTIALS)[number];
  const meta = credMeta(cred.status);
  const doc = DOCUMENTEN[step];

  const doUpload = () => {
    if (uploadState !== "idle") return;
    setUploadState("uploading");
    window.setTimeout(() => setUploadState("done"), 950);
  };
  const goto = (n: number) => {
    setStep(n);
    setUploadState("idle");
  };

  const done = step >= total - 1 && uploadState === "done";

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between">
        <Kicker>Verificatie</Kicker>
        <span className="text-[13px] font-semibold tabular-nums" style={{ color: C.faint }}>
          Stap {step + 1} / {total}
        </span>
      </div>
      <Progress value={((step + (uploadState === "done" ? 1 : 0)) / total) * 100} />

      <Reveal id={cred.naam}>
        <div
          className="rounded-3xl p-6 sm:p-8"
          style={{ background: C.paper, border: `1px solid ${C.line}` }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ background: `${meta.color}14`, border: `1px solid ${meta.color}33` }}
            >
              <meta.Icon size={20} strokeWidth={2} color={meta.color} aria-hidden="true" />
            </span>
            <StatusBadge status={cred.status} />
          </div>

          <h2
            className="mt-5 text-[26px] leading-tight tracking-tight sm:text-[30px]"
            style={{ ...display, color: C.ink }}
          >
            {cred.naam}
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed" style={{ color: C.sub }}>
            {cred.detail}
          </p>

          {/* Upload-vak */}
          <div className="mt-6">
            {uploadState === "done" ? (
              <div
                className="flex items-center gap-3 rounded-2xl p-4"
                style={{ background: `${C.ok}12`, border: `1px solid ${C.ok}33` }}
                role="status"
              >
                <Check size={20} strokeWidth={2.6} color={C.ok} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold" style={{ color: C.ink }}>
                    {doc ? doc.naam : "Bewijsstuk toegevoegd"}
                  </p>
                  <p className="text-[12.5px]" style={{ color: C.sub }}>
                    {doc ? `${doc.type} · ${doc.grootte}` : "Klaar voor beoordeling"} · we bewaren
                    dit veilig en privé.
                  </p>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={doUpload}
                disabled={uploadState === "uploading"}
                className={`flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-colors hover:bg-[#eceafe]/40 disabled:opacity-70 ${RING}`}
                style={{ borderColor: `${C.accent}55` }}
              >
                {uploadState === "uploading" ? (
                  <>
                    <span
                      className="h-7 w-7 animate-spin rounded-full border-2 border-[#4f46e5]/30 border-t-[#4f46e5]"
                      aria-hidden="true"
                    />
                    <span className="text-[14px] font-semibold" style={{ color: C.accentInk }}>
                      Bestand uploaden…
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{ background: C.accentSoft }}
                    >
                      <Upload size={22} strokeWidth={2} color={C.accent} aria-hidden="true" />
                    </span>
                    <span className="text-[15px] font-semibold" style={{ color: C.ink }}>
                      Sleep je bewijsstuk hierheen
                    </span>
                    <span className="text-[12.5px]" style={{ color: C.faint }}>
                      PDF of afbeelding, max 10 MB — of klik om te kiezen
                    </span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <PillButton
              onClick={() => (done ? undefined : goto(Math.min(step + 1, total - 1)))}
              disabled={done}
            >
              {done ? "Alles ingediend" : "Volgende certificaat"}
              {!done && <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />}
            </PillButton>
            <KeyHint>
              <KeyCap>Enter ↵</KeyCap> voor de volgende
            </KeyHint>
          </div>
        </div>
      </Reveal>

      {/* Stap-indicatoren */}
      <ol className="flex flex-wrap items-center gap-2" aria-label="Voortgang certificaten">
        {CREDENTIALS.map((c, idx) => {
          const on = idx === step;
          const passed = idx < step;
          return (
            <li key={c.naam}>
              <button
                type="button"
                onClick={() => goto(idx)}
                aria-current={on ? "step" : undefined}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${RING}`}
                style={{
                  color: on ? C.accentInk : passed ? C.ok : C.sub,
                  background: on ? C.accentSoft : passed ? `${C.ok}12` : C.paper,
                  border: `1px solid ${on ? C.accent + "44" : C.lineSoft}`,
                }}
              >
                {passed ? (
                  <Check size={13} strokeWidth={3} aria-hidden="true" />
                ) : (
                  <span className="text-[11px] tabular-nums">{idx + 1}</span>
                )}
                <span className="hidden sm:inline">{c.naam.split(" ")[0]}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ---------- Acties — de volgende beste stappen als kalme lijst ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div className="space-y-6 pt-2">
      <div className="space-y-3">
        <Kicker>Acties</Kicker>
        <h1
          className="text-[30px] leading-tight tracking-tight sm:text-[38px]"
          style={{ ...display, color: C.ink }}
        >
          Wat vraagt nu je aandacht?
        </h1>
        <p className="max-w-md text-[15px] leading-relaxed" style={{ color: C.sub }}>
          Op volgorde van urgentie. Begin bovenaan — één stap tegelijk.
        </p>
      </div>

      <div className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.warn : C.accent;
          const first = i === 0;
          return (
            <div
              key={a.titel}
              className="rounded-3xl p-5 sm:p-6"
              style={{
                background: first ? C.paper : C.paper,
                border: `1px solid ${first ? color + "44" : C.lineSoft}`,
                boxShadow: first ? "0 24px 50px -46px rgba(24,22,19,0.5)" : "none",
              }}
            >
              <div className="flex items-start gap-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[15px] font-bold tabular-nums"
                  style={{ ...display, color, background: `${color}14` }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color }}
                  >
                    {warn ? (
                      <AlertTriangle size={12} strokeWidth={2.4} aria-hidden="true" />
                    ) : (
                      <Sparkles size={12} strokeWidth={2.4} aria-hidden="true" />
                    )}
                    {warn ? "Belangrijk" : "Kans"}
                  </span>
                  <p
                    className="mt-1.5 text-[17px] font-semibold leading-snug"
                    style={{ ...display, color: C.ink }}
                  >
                    {a.titel}
                  </p>
                  <p className="mt-1 text-[13.5px] leading-relaxed" style={{ color: C.sub }}>
                    {a.detail}
                  </p>
                  <div className="mt-4">
                    <PillButton
                      variant={first ? "primary" : "ghost"}
                      onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                    >
                      {a.cta} <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
                    </PillButton>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="flex items-center gap-3 rounded-2xl p-4"
        style={{ background: `${C.ok}0e`, border: `1px solid ${C.ok}2a` }}
      >
        <Check size={18} strokeWidth={2.4} color={C.ok} aria-hidden="true" />
        <p className="text-[13.5px]" style={{ color: C.sub }}>
          Verder ben je bij. Nieuwe stappen verschijnen hier vanzelf.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen — ruime lijst ---------- */

function Facturen() {
  const statusMeta: Record<string, { color: string; label: string }> = {
    Betaald: { color: C.ok, label: "Betaald" },
    Openstaand: { color: C.warn, label: "Openstaand" },
    Concept: { color: C.faint, label: "Concept" },
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
    <div className="space-y-6 pt-2">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Kicker>Facturen</Kicker>
          <h1
            className="text-[30px] leading-tight tracking-tight sm:text-[38px]"
            style={{ ...display, color: C.ink }}
          >
            Je financiën
          </h1>
        </div>
        <PillButton variant="ghost">
          <Plus size={15} strokeWidth={2.4} aria-hidden="true" /> Nieuwe
        </PillButton>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div
          className="rounded-3xl p-6"
          style={{ background: C.paper, border: `1px solid ${C.lineSoft}` }}
        >
          <p className="text-[12px] font-medium uppercase tracking-wide" style={{ color: C.faint }}>
            Ontvangen
          </p>
          <p
            className="mt-2 text-[28px] font-semibold tabular-nums tracking-tight"
            style={{ ...display, color: C.ok }}
          >
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </div>
        <div
          className="rounded-3xl p-6"
          style={{ background: C.paper, border: `1px solid ${C.lineSoft}` }}
        >
          <p className="text-[12px] font-medium uppercase tracking-wide" style={{ color: C.faint }}>
            Openstaand
          </p>
          <p
            className="mt-2 text-[28px] font-semibold tabular-nums tracking-tight"
            style={{ ...display, color: C.warn }}
          >
            € {open.toLocaleString("nl-NL")}
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {FACTUREN.map((f) => {
          const m = statusMeta[f.status] ?? { color: C.faint, label: f.status };
          return (
            <li
              key={f.nr}
              className="flex items-center gap-4 rounded-2xl p-4"
              style={{ background: C.paper, border: `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: C.soft }}
                aria-hidden="true"
              >
                <FileText size={17} strokeWidth={2} color={C.sub} />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-[14px] font-semibold tabular-nums"
                  style={{ color: C.ink }}
                >
                  {f.nr}
                </p>
                <p className="truncate text-[12.5px]" style={{ color: C.sub }}>
                  {f.klant} · {f.datum}
                </p>
              </div>
              <span
                className="text-[15px] font-semibold tabular-nums"
                style={{ ...display, color: C.ink }}
              >
                {f.bedrag}
              </span>
              <span
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
                style={{ color: m.color, background: `${m.color}14` }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: m.color }}
                  aria-hidden="true"
                />
                {m.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
