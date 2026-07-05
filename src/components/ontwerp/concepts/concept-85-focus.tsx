"use client";

// Concept 85 — "Focus" · enkelvoudige zen-focusmodus (licht, warm).
// Precies één ding tegelijk, oversized en centraal; al het andere treedt terug of dimt.
// Progressive disclosure: de volgende beste actie vult het scherm met één grote primaire knop,
// secundaire info klein en rustig eronder. Denk Things / iA Writer — enorme rust, veel wit,
// grote leesbare typografie, geen visuele ruis. Zachte cross-fade tussen "één taak"-kaarten.
// Palet: bg #faf9f7, fg #15130f, accent #111827 (bijna-zwart, ingetogen). Fonts: Sora (display) + Inter (body).

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  MapPin,
  Sparkle,
  ChevronRight,
  CircleDot,
  RotateCw,
  Wallet,
  Compass,
  Layers,
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

/* ---------- Palet & typografie ---------- */

const C = {
  bg: "#faf9f7",
  bgSoft: "#f4f2ee",
  card: "#ffffff",
  fg: "#15130f",
  muted: "#6b6559",
  faint: "#9a9385",
  line: "#eae6df",
  lineSoft: "#f0ede7",
  accent: "#111827",
  ok: "#3f7d55",
  okSoft: "#eef4ef",
  warn: "#b06a1a",
  warnSoft: "#f7efe3",
  alert: "#a83a34",
  alertSoft: "#f8ecea",
};

const display = { fontFamily: "var(--font-lab-sora)" };
const body = { fontFamily: "var(--font-lab-inter)" };

const SHADOW = "0 1px 2px rgba(21,19,15,0.04), 0 12px 32px -20px rgba(21,19,15,0.18)";
const SHADOW_LIFT = "0 2px 4px rgba(21,19,15,0.05), 0 24px 48px -24px rgba(21,19,15,0.28)";

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; color: string; soft: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.ok, soft: C.okSoft, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", color: C.warn, soft: C.warnSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", color: C.warn, soft: C.warnSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.alert, soft: C.alertSoft, Icon: XCircle };
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Kleine bouwstenen ---------- */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
      style={{ ...body, color: C.faint }}
    >
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-semibold"
      style={{ ...body, color: m.color, background: m.soft }}
    >
      <Icon size={12.5} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Rustige sparkline — dunne inkt-lijn, geen ruis.
function Spark({ data, color = C.accent }: { data: number[]; color?: string }) {
  const w = 88;
  const h = 26;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2" fill={color} />}
    </svg>
  );
}

// Grote, rustige match-ring — het brandpunt van een opdrachtkaart.
function MatchRing({ value, size = 92 }: { value: number; size?: number }) {
  const stroke = 5;
  const r = size / 2 - stroke;
  const circ = 2 * Math.PI * r;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.line}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
        />
      </svg>
      <span className="flex flex-col items-center leading-none">
        <span
          className="text-[22px] font-semibold tabular-nums"
          style={{ ...display, color: C.fg }}
        >
          {value}
        </span>
        <span
          className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]"
          style={{ ...body, color: C.faint }}
        >
          match
        </span>
      </span>
    </span>
  );
}

// Één-focus wrapper met zachte cross-fade bij wisselen (deterministische key-animatie).
function Focus({ stepKey, children }: { stepKey: string; children: React.ReactNode }) {
  return (
    <div key={stepKey} className="focus85-fade">
      {children}
    </div>
  );
}

// Stapper: vorige / brandpunt-teller / volgende.
function Stepper({
  index,
  total,
  onPrev,
  onNext,
  label,
}: {
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <button
        onClick={onPrev}
        aria-label="Vorige"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111827] focus-visible:ring-offset-2"
        style={{ color: C.muted, border: `1px solid ${C.line}` }}
      >
        <ArrowLeft size={17} strokeWidth={2.2} aria-hidden="true" />
      </button>
      <div className="flex flex-col items-center gap-2">
        <span className="text-[11px] font-medium" style={{ ...body, color: C.faint }}>
          {label}
        </span>
        <span className="flex items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === index ? 20 : 6,
                background: i === index ? C.accent : C.line,
              }}
            />
          ))}
        </span>
      </div>
      <button
        onClick={onNext}
        aria-label="Volgende"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111827] focus-visible:ring-offset-2"
        style={{ color: C.fg, border: `1px solid ${C.line}` }}
      >
        <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept85() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, color: C.fg, background: C.bg }}
    >
      <style>{`
        @keyframes focus85-fade {
          from { opacity: 0; transform: translateY(6px) scale(0.995); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .focus85-fade { animation: focus85-fade 0.34s cubic-bezier(0.22,0.61,0.36,1) both; }
      `}</style>

      <div className="relative flex min-h-[680px] flex-col md:flex-row">
        {/* Minimale, terugtredende nav */}
        <aside
          className="shrink-0 md:w-[228px]"
          style={{ borderRight: `1px solid ${C.line}`, background: C.bg }}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 px-6 py-6">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: C.accent }}
                aria-hidden="true"
              >
                <CircleDot size={17} strokeWidth={2.2} color="#faf9f7" />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[15px] font-semibold tracking-[-0.01em]"
                  style={{ ...display, color: C.fg }}
                >
                  Focus
                </div>
                <div
                  className="text-[10px] font-medium uppercase tracking-[0.2em]"
                  style={{ color: C.faint }}
                >
                  één ding tegelijk
                </div>
              </div>
            </div>

            <nav
              className="flex flex-row gap-1 overflow-x-auto px-3 pb-2 md:flex-1 md:flex-col md:pb-0"
              aria-label="Hoofdnavigatie"
            >
              {SCREENS.map((s) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className="group relative flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111827] focus-visible:ring-offset-2 md:w-full"
                    style={{
                      color: on ? C.fg : C.muted,
                      background: on ? C.card : "transparent",
                      boxShadow: on ? SHADOW : "none",
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full transition-all"
                      style={{
                        background: on ? C.accent : "transparent",
                        border: on ? "none" : `1px solid ${C.line}`,
                      }}
                      aria-hidden="true"
                    />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </nav>

            <div
              className="mt-auto flex items-center gap-3 px-5 py-5"
              style={{ borderTop: `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                style={{ ...display, color: "#faf9f7", background: C.accent }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-semibold" style={{ color: C.fg }}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="flex items-center gap-1 text-[10.5px] font-semibold"
                  style={{ color: C.ok }}
                >
                  <ShieldCheck size={11} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-10 sm:px-10 lg:px-16">
            {screen === "dashboard" && <Dashboard onGo={setScreen} />}
            {screen === "marktplaats" && <Marktplaats onGo={setScreen} />}
            {screen === "opdracht" && <OpdrachtFocus onGo={setScreen} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties onGo={setScreen} />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Dashboard — één brandpunt: de volgende beste actie ---------- */

function Dashboard({ onGo }: { onGo: (k: ScreenKey) => void }) {
  const primair = ACTIES[0];
  const warn = primair?.urgentie === "warning";
  const accent = warn ? C.warn : C.accent;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="text-center">
        <Eyebrow>
          <Sparkle size={12} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.plaats} · vandaag
        </Eyebrow>
        <h1
          className="mt-4 text-[34px] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[42px]"
          style={{ ...display, color: C.fg }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed" style={{ color: C.muted }}>
          Alles is rustig. Er is één ding dat nu je aandacht vraagt.
        </p>
      </header>

      {/* Het ene brandpunt — grote primaire actie */}
      {primair && (
        <div
          className="mt-10 rounded-[26px] p-8 text-center sm:p-10"
          style={{ background: C.card, boxShadow: SHADOW_LIFT, border: `1px solid ${C.line}` }}
        >
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: warn ? C.warnSoft : C.bgSoft }}
            aria-hidden="true"
          >
            {warn ? (
              <AlertTriangle size={24} strokeWidth={2} color={accent} />
            ) : (
              <Compass size={24} strokeWidth={2} color={accent} />
            )}
          </span>
          <p
            className="mt-5 text-[12px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: accent }}
          >
            {warn ? "Volgende beste actie" : "Aanbevolen"}
          </p>
          <h2
            className="mx-auto mt-2 max-w-md text-[26px] font-semibold leading-tight tracking-[-0.01em] sm:text-[30px]"
            style={{ ...display, color: C.fg }}
          >
            {primair.titel}
          </h2>
          <p
            className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed"
            style={{ color: C.muted }}
          >
            {primair.detail}
          </p>
          <button
            onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-[15px] font-semibold text-white transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111827] focus-visible:ring-offset-2 sm:w-auto sm:px-10"
            style={{ background: C.accent, boxShadow: "0 10px 24px -12px rgba(17,24,39,0.6)" }}
          >
            {primair.cta} <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
          </button>
          <button
            onClick={() => onGo("acties")}
            className="mt-3 block w-full text-[13px] font-medium transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111827] focus-visible:ring-offset-2 sm:mx-auto sm:w-auto"
            style={{ color: C.faint }}
          >
            Later · toon alle {ACTIES.length} acties
          </button>
        </div>
      )}

      {/* Secundaire info — klein en rustig eronder */}
      <div className="mt-10">
        <p
          className="text-center text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: C.faint }}
        >
          Rustig op de achtergrond
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {KPIS.map((k) => (
            <div
              key={k.label}
              className="rounded-2xl p-4"
              style={{ background: C.card, border: `1px solid ${C.lineSoft}` }}
            >
              <p className="text-[11px] font-medium leading-tight" style={{ color: C.faint }}>
                {k.label}
              </p>
              <p
                className="mt-1.5 text-[19px] font-semibold tabular-nums"
                style={{ ...display, color: C.fg }}
              >
                {k.value}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span
                  className="text-[11px] font-semibold tabular-nums"
                  style={{ color: k.up ? C.ok : C.warn }}
                >
                  {k.trend}
                </span>
                <Spark data={k.spark} color={k.up ? C.ok : C.warn} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2">
        <button
          onClick={() => onGo("marktplaats")}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111827] focus-visible:ring-offset-2"
          style={{ color: C.muted, border: `1px solid ${C.line}` }}
        >
          <Compass size={14} strokeWidth={2.2} aria-hidden="true" /> Naar de marktplaats
        </button>
      </div>
    </div>
  );
}

/* ---------- Marktplaats — één opdracht in beeld, blader één-voor-één ---------- */

function Marktplaats({ onGo }: { onGo: (k: ScreenKey) => void }) {
  const [i, setI] = useState(0);
  const total = OPDRACHTEN.length;
  const o = OPDRACHTEN[i] as Opdracht;
  const prev = () => setI((n) => (n - 1 + total) % total);
  const next = () => setI((n) => (n + 1) % total);

  return (
    <div className="mx-auto max-w-2xl">
      <header className="text-center">
        <Eyebrow>
          <Compass size={12} strokeWidth={2.4} aria-hidden="true" /> Marktplaats
        </Eyebrow>
        <h1
          className="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.02em] sm:text-[36px]"
          style={{ ...display, color: C.fg }}
        >
          Één opdracht tegelijk
        </h1>
        <p className="mt-3 text-[14px]" style={{ color: C.muted }}>
          Neem de tijd. Beoordeel deze match voordat je verder bladert.
        </p>
      </header>

      <div className="mt-8">
        <Focus stepKey={o.id}>
          <article
            className="rounded-[26px] p-7 sm:p-9"
            style={{ background: C.card, boxShadow: SHADOW_LIFT, border: `1px solid ${C.line}` }}
          >
            <div className="flex flex-col items-center gap-5 text-center">
              <MatchRing value={o.match} size={104} />
              <div>
                <span
                  className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: C.faint }}
                >
                  {o.id}
                </span>
                <h2
                  className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.01em] sm:text-[28px]"
                  style={{ ...display, color: C.fg }}
                >
                  {o.titel}
                </h2>
                <p
                  className="mt-2 flex items-center justify-center gap-1.5 text-[13.5px]"
                  style={{ color: C.muted }}
                >
                  <MapPin size={13} strokeWidth={2.2} aria-hidden="true" /> {o.opdrachtgever} ·{" "}
                  {o.plaats}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-3 py-1 text-[11.5px] font-medium"
                    style={{ color: C.muted, background: C.bgSoft }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <dl className="mt-7 grid grid-cols-3 gap-3">
              {[
                { l: "Tarief", v: o.tarief },
                { l: "Omvang", v: o.uren },
                { l: "Start", v: o.start },
              ].map((m) => (
                <div
                  key={m.l}
                  className="rounded-2xl px-3 py-3 text-center"
                  style={{ background: C.bgSoft }}
                >
                  <dt
                    className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: C.faint }}
                  >
                    {m.l}
                  </dt>
                  <dd
                    className="mt-1 text-[14px] font-semibold"
                    style={{ ...display, color: C.fg }}
                  >
                    {m.v}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Progressive disclosure: alleen de sterkste reden staat groot, rest klein */}
            <div className="mt-6 space-y-2">
              {o.redenen.plus.slice(0, 2).map((r) => (
                <p
                  key={r}
                  className="flex items-center gap-2.5 text-[13.5px]"
                  style={{ color: C.fg }}
                >
                  <Check
                    size={16}
                    strokeWidth={2.6}
                    color={C.ok}
                    className="shrink-0"
                    aria-hidden="true"
                  />{" "}
                  {r}
                </p>
              ))}
              {o.redenen.min.slice(0, 1).map((r) => (
                <p
                  key={r}
                  className="flex items-center gap-2.5 text-[13px]"
                  style={{ color: C.muted }}
                >
                  <AlertTriangle
                    size={15}
                    strokeWidth={2.2}
                    color={C.warn}
                    className="shrink-0"
                    aria-hidden="true"
                  />{" "}
                  {r}
                </p>
              ))}
            </div>

            <button
              onClick={() => onGo("opdracht")}
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-[15px] font-semibold text-white transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111827] focus-visible:ring-offset-2"
              style={{ background: C.accent }}
            >
              Bekijk & reageer <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </article>
        </Focus>

        <div className="mt-6">
          <Stepper
            index={i}
            total={total}
            onPrev={prev}
            onNext={next}
            label={`Opdracht ${i + 1} van ${total}`}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- Opdracht-detail — brandpunt met volledige onderbouwing ---------- */

function OpdrachtFocus({ onGo }: { onGo: (k: ScreenKey) => void }) {
  const o = OPDRACHTEN[0] as Opdracht;
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => onGo("marktplaats")}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111827] focus-visible:ring-offset-2"
        style={{ color: C.muted }}
      >
        <ArrowLeft size={15} strokeWidth={2.2} aria-hidden="true" /> Marktplaats
      </button>

      <header className="mt-6 text-center">
        <MatchRing value={o.match} size={112} />
        <span
          className="mt-4 block text-[11px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: C.faint }}
        >
          {o.id}
        </span>
        <h1
          className="mx-auto mt-2 max-w-lg text-[30px] font-semibold leading-tight tracking-[-0.02em] sm:text-[36px]"
          style={{ ...display, color: C.fg }}
        >
          {o.titel}
        </h1>
        <p
          className="mt-3 flex items-center justify-center gap-1.5 text-[14px]"
          style={{ color: C.muted }}
        >
          <MapPin size={14} strokeWidth={2.2} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
        </p>
      </header>

      {/* Eén primaire actie, oversized */}
      <div className="mt-8">
        <button
          onClick={react}
          disabled={state !== "idle"}
          aria-live="polite"
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-[15px] font-semibold text-white transition-transform hover:scale-[1.008] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111827] focus-visible:ring-offset-2 disabled:opacity-90"
          style={{ background: state === "sent" ? C.ok : C.accent }}
        >
          {state === "idle" && (
            <>
              Reageer op deze opdracht <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
            </>
          )}
          {state === "sending" && "Versturen…"}
          {state === "sent" && (
            <>
              <Check size={17} strokeWidth={2.8} aria-hidden="true" /> Reactie verstuurd
            </>
          )}
        </button>
      </div>

      <dl className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: o.tarief },
          { l: "Omvang", v: o.uren },
          { l: "Start", v: o.start },
          { l: "Match", v: `${o.match}%` },
        ].map((m) => (
          <div
            key={m.l}
            className="rounded-2xl px-4 py-4 text-center"
            style={{ background: C.card, border: `1px solid ${C.lineSoft}` }}
          >
            <dt
              className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </dt>
            <dd
              className="mt-1.5 text-[17px] font-semibold tabular-nums"
              style={{ ...display, color: C.fg }}
            >
              {m.v}
            </dd>
          </div>
        ))}
      </dl>

      <section
        className="mt-7 rounded-[24px] p-7"
        style={{ background: C.card, boxShadow: SHADOW, border: `1px solid ${C.line}` }}
      >
        <h2 className="text-center text-[15px] font-semibold" style={{ ...display, color: C.fg }}>
          Waarom deze match
        </h2>
        <div className="mt-5 space-y-3">
          {o.redenen.plus.map((r) => (
            <p key={r} className="flex items-start gap-3 text-[14px]" style={{ color: C.fg }}>
              <Check
                size={17}
                strokeWidth={2.6}
                color={C.ok}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />{" "}
              {r}
            </p>
          ))}
          {o.redenen.min.map((r) => (
            <p key={r} className="flex items-start gap-3 text-[14px]" style={{ color: C.muted }}>
              <AlertTriangle
                size={16}
                strokeWidth={2.2}
                color={C.warn}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />{" "}
              {r}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------- Verificatie — één credential-actie in brandpunt, rest gedimd ---------- */

function Verificatie() {
  const [i, setI] = useState(0);
  const total = CREDENTIALS.length;
  const c = CREDENTIALS[i]!;
  const m = credMeta(c.status);
  const Icon = m.Icon;
  const prev = () => setI((n) => (n - 1 + total) % total);
  const next = () => setI((n) => (n + 1) % total);

  return (
    <div className="mx-auto max-w-2xl">
      <header className="text-center">
        <Eyebrow>
          <ShieldCheck size={12} strokeWidth={2.4} aria-hidden="true" /> Verificatie
        </Eyebrow>
        <h1
          className="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.02em] sm:text-[36px]"
          style={{ ...display, color: C.fg }}
        >
          Je bewijsstukken
        </h1>
        <p className="mt-3 text-[14px]" style={{ color: C.muted }}>
          Veilig en privé bewaard. Beoordeel er één tegelijk.
        </p>
      </header>

      <div className="mt-8">
        <Focus stepKey={c.naam}>
          <article
            className="rounded-[26px] p-8 text-center sm:p-10"
            style={{ background: C.card, boxShadow: SHADOW_LIFT, border: `1px solid ${C.line}` }}
          >
            <span
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: m.soft }}
              aria-hidden="true"
            >
              <Icon size={28} strokeWidth={2} color={m.color} />
            </span>
            <h2
              className="mt-5 text-[24px] font-semibold tracking-[-0.01em]"
              style={{ ...display, color: C.fg }}
            >
              {c.naam}
            </h2>
            <div className="mt-3 flex justify-center">
              <StatusBadge status={c.status} />
            </div>
            <p
              className="mx-auto mt-4 max-w-sm text-[14px] leading-relaxed"
              style={{ color: C.muted }}
            >
              {c.detail}
            </p>

            {c.status === "EXPIRING" && (
              <button
                className="mt-6 inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-[14px] font-semibold text-white transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111827] focus-visible:ring-offset-2"
                style={{ background: C.accent }}
              >
                Vernieuw nu <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
              </button>
            )}
            {c.status === "SUBMITTED" && (
              <p
                className="mt-6 inline-flex items-center gap-2 text-[13px] font-medium"
                style={{ color: C.warn }}
              >
                <Clock size={14} strokeWidth={2.4} aria-hidden="true" /> Wordt beoordeeld — geen
                actie nodig
              </p>
            )}
            {c.status === "VERIFIED" && (
              <p
                className="mt-6 inline-flex items-center gap-2 text-[13px] font-medium"
                style={{ color: C.ok }}
              >
                <Check size={14} strokeWidth={2.6} aria-hidden="true" /> Alles in orde — niets te
                doen
              </p>
            )}
          </article>
        </Focus>

        <div className="mt-6">
          <Stepper
            index={i}
            total={total}
            onPrev={prev}
            onNext={next}
            label={`Bewijsstuk ${i + 1} van ${total}`}
          />
        </div>
      </div>

      {/* Gedimd overzicht — al het andere treedt terug */}
      <div className="mt-10">
        <p
          className="text-center text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: C.faint }}
        >
          Alle bewijsstukken
        </p>
        <div className="mt-4 space-y-2">
          {CREDENTIALS.map((cc, idx) => {
            const on = idx === i;
            const mm = credMeta(cc.status);
            const II = mm.Icon;
            return (
              <button
                key={cc.naam}
                onClick={() => setI(idx)}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111827] focus-visible:ring-offset-2"
                style={{
                  background: on ? C.card : "transparent",
                  border: `1px solid ${on ? C.line : "transparent"}`,
                  boxShadow: on ? SHADOW : "none",
                  opacity: on ? 1 : 0.55,
                }}
              >
                <II
                  size={17}
                  strokeWidth={2.1}
                  color={mm.color}
                  className="shrink-0"
                  aria-hidden="true"
                />
                <span
                  className="min-w-0 flex-1 truncate text-[13.5px] font-medium"
                  style={{ color: C.fg }}
                >
                  {cc.naam}
                </span>
                <ChevronRight size={15} strokeWidth={2.2} color={C.faint} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Acties — brandpunt-lijst, loading → error → één-voor-één ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  const [feed, setFeed] = useState<"loading" | "error" | "ok">("loading");
  useEffect(() => {
    const t = window.setTimeout(() => setFeed("error"), 650);
    return () => window.clearTimeout(t);
  }, []);

  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="text-center">
        <Eyebrow>
          <Layers size={12} strokeWidth={2.4} aria-hidden="true" /> Op volgorde
        </Eyebrow>
        <h1
          className="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.02em] sm:text-[36px]"
          style={{ ...display, color: C.fg }}
        >
          Volgende acties
        </h1>
        <p className="mt-3 text-[14px]" style={{ color: C.muted }}>
          Begin bovenaan. Werk rustig naar beneden.
        </p>
      </header>

      {/* Live-strook — loading + error-state */}
      <div className="mt-8">
        {feed === "loading" && (
          <div
            className="flex items-center gap-3 rounded-2xl px-5 py-4"
            style={{ background: C.card, border: `1px solid ${C.lineSoft}` }}
            role="status"
            aria-live="polite"
          >
            <span className="sr-only">Berichten worden geladen…</span>
            <span
              className="h-3 w-3 animate-pulse rounded-full"
              style={{ background: C.line }}
              aria-hidden="true"
            />
            <span
              className="h-3 flex-1 animate-pulse rounded-full"
              style={{ background: C.lineSoft }}
              aria-hidden="true"
            />
          </div>
        )}
        {feed === "error" && (
          <div
            className="flex flex-col gap-3 rounded-2xl px-5 py-4 sm:flex-row sm:items-center"
            style={{ background: C.alertSoft, border: `1px solid ${C.alert}33` }}
            role="alert"
          >
            <XCircle size={18} strokeWidth={2.2} color={C.alert} aria-hidden="true" />
            <p className="flex-1 text-[13px]" style={{ color: C.fg }}>
              Kon je berichten niet ophalen.
            </p>
            <button
              onClick={() => setFeed("ok")}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111827] focus-visible:ring-offset-2"
              style={{ background: C.accent }}
            >
              <RotateCw size={13} strokeWidth={2.4} aria-hidden="true" /> Opnieuw
            </button>
          </div>
        )}
        {feed === "ok" && (
          <p
            className="flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-[13px]"
            style={{ background: C.okSoft, color: C.ok }}
          >
            <Check size={15} strokeWidth={2.6} aria-hidden="true" /> {ongelezen} ongelezen berichten
            opgehaald.
          </p>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {ACTIES.map((a, idx) => {
          const warn = a.urgentie === "warning";
          const accent = warn ? C.warn : C.accent;
          const focusOne = idx === 0;
          return (
            <article
              key={a.titel}
              className="rounded-[22px] p-6"
              style={{
                background: C.card,
                border: `1px solid ${focusOne ? C.line : C.lineSoft}`,
                boxShadow: focusOne ? SHADOW_LIFT : "none",
                opacity: focusOne ? 1 : 0.7,
              }}
            >
              <div className="flex items-start gap-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: warn ? C.warnSoft : C.bgSoft }}
                  aria-hidden="true"
                >
                  {warn ? (
                    <AlertTriangle size={19} strokeWidth={2} color={accent} />
                  ) : (
                    <Sparkle size={19} strokeWidth={2} color={accent} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: accent }}
                  >
                    {warn ? "Waarschuwing" : "Kans"}
                  </span>
                  <h2
                    className={`mt-1 font-semibold tracking-[-0.01em] ${focusOne ? "text-[19px]" : "text-[16px]"}`}
                    style={{ ...display, color: C.fg }}
                  >
                    {a.titel}
                  </h2>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
                    {a.detail}
                  </p>
                  <button
                    onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111827] focus-visible:ring-offset-2"
                    style={
                      focusOne
                        ? { background: C.accent, color: "#fff" }
                        : { background: C.bgSoft, color: C.fg }
                    }
                  >
                    {a.cta} <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div
        className="mt-8 flex items-center justify-center gap-2.5 rounded-2xl px-5 py-4 text-[13px]"
        style={{ background: C.bgSoft, color: C.muted }}
      >
        <Check size={15} strokeWidth={2.4} color={C.ok} aria-hidden="true" /> Verder is alles
        bijgewerkt — geniet van de rust.
      </div>
    </div>
  );
}

/* ---------- Facturen — één openstaande factuur in brandpunt ---------- */

function Facturen() {
  const statusMeta: Record<string, { color: string; soft: string }> = {
    Betaald: { color: C.ok, soft: C.okSoft },
    Openstaand: { color: C.warn, soft: C.warnSoft },
    Concept: { color: C.faint, soft: C.bgSoft },
  };
  const open = FACTUREN.find((f) => f.status === "Openstaand");
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const openTotaal = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );

  const docsKlaar = DOCUMENTEN.filter((d) => d.status === "VERIFIED").length;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="text-center">
        <Eyebrow>
          <Wallet size={12} strokeWidth={2.4} aria-hidden="true" /> Financiën
        </Eyebrow>
        <h1
          className="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.02em] sm:text-[36px]"
          style={{ ...display, color: C.fg }}
        >
          Facturen
        </h1>
        <p className="mt-3 text-[14px]" style={{ color: C.muted }}>
          {docsKlaar} van {DOCUMENTEN.length} documenten geverifieerd · alles op orde.
        </p>
      </header>

      {/* Het ene brandpunt: de openstaande factuur */}
      {open && (
        <div
          className="mt-8 rounded-[26px] p-8 text-center"
          style={{ background: C.card, boxShadow: SHADOW_LIFT, border: `1px solid ${C.line}` }}
        >
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.warn }}
          >
            Openstaand · vraagt aandacht
          </span>
          <p
            className="mt-3 text-[40px] font-semibold tabular-nums tracking-[-0.02em] sm:text-[48px]"
            style={{ ...display, color: C.fg }}
          >
            {open.bedrag}
          </p>
          <p className="mt-2 text-[14px]" style={{ color: C.muted }}>
            {open.nr} · {open.klant} · verstuurd {open.datum}
          </p>
          <button
            className="mt-6 inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-[14.5px] font-semibold text-white transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111827] focus-visible:ring-offset-2"
            style={{ background: C.accent }}
          >
            Herinnering sturen <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div
          className="rounded-2xl px-5 py-4 text-center"
          style={{ background: C.card, border: `1px solid ${C.lineSoft}` }}
        >
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: C.faint }}
          >
            Ontvangen
          </p>
          <p
            className="mt-1.5 text-[20px] font-semibold tabular-nums"
            style={{ ...display, color: C.ok }}
          >
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </div>
        <div
          className="rounded-2xl px-5 py-4 text-center"
          style={{ background: C.card, border: `1px solid ${C.lineSoft}` }}
        >
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: C.faint }}
          >
            Openstaand
          </p>
          <p
            className="mt-1.5 text-[20px] font-semibold tabular-nums"
            style={{ ...display, color: C.warn }}
          >
            € {openTotaal.toLocaleString("nl-NL")}
          </p>
        </div>
      </div>

      {/* Rustige, terugtredende historie */}
      <div className="mt-8">
        <p
          className="text-center text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: C.faint }}
        >
          Historie
        </p>
        <div className="mt-4 space-y-1.5">
          {FACTUREN.map((f) => {
            const meta = statusMeta[f.status] ?? { color: C.faint, soft: C.bgSoft };
            const isOpen = f.status === "Openstaand";
            return (
              <div
                key={f.nr}
                className="flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{
                  background: isOpen ? C.card : "transparent",
                  border: `1px solid ${isOpen ? C.line : "transparent"}`,
                  opacity: isOpen ? 1 : 0.7,
                }}
              >
                <span className="text-[12.5px] font-semibold tabular-nums" style={{ color: C.fg }}>
                  {f.nr}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px]" style={{ color: C.muted }}>
                  {f.klant}
                </span>
                <span
                  className="hidden text-[12px] tabular-nums sm:inline"
                  style={{ color: C.faint }}
                >
                  {f.datum}
                </span>
                <span className="text-[13px] font-semibold tabular-nums" style={{ color: C.fg }}>
                  {f.bedrag}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ color: meta.color, background: meta.soft }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: meta.color }}
                    aria-hidden="true"
                  />
                  {f.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-6 text-center text-[11px]" style={{ color: C.faint }}>
        {NAV.length} onderdelen in je werkruimte · alles synchroon.
      </p>
    </div>
  );
}
