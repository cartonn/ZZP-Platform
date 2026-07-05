"use client";

// Concept 93 — "Kaart" · swipe-deck matching / speelkaart-deck (mobiel-first).
// Tinder-voor-opdrachten: grote opdracht-kaarten liggen als een stapel, met swipe-hints
// (nee / later / ja) en een prominent match-percentage; tik voor detail. De overige schermen
// spreken dezelfde kaart-taal — verificatie als kaarten in mapjes, facturen als bon-kaarten.
// Warm, tactiel, speels maar strak; gecentreerd in een mobiel frame (max-w ~440px).
// Deterministisch: geen Math.random/Date.now; alle content komt uit de mock.
// Fonts: --font-lab-bricolage (display) + --font-lab-jakarta (body/UI).

import { useState } from "react";
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Check,
  Plus,
  MapPin,
  Heart,
  X,
  Undo2,
  Home,
  LayoutGrid,
  FileText,
  BadgeCheck,
  Receipt,
  Sparkles,
  Folder,
  ChevronRight,
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

/* ---------- Palet & typografie ---------- */

const C = {
  backdrop: "#efe6db",
  frame: "#fffdfa",
  surface: "#ffffff",
  surfaceAlt: "#fbf4ec",
  ink: "#2a1e16",
  accent: "#ff6a3d",
  accentDeep: "#e8532a",
  amber: "#f0a23a",
  muted: "#7a6a5d",
  faint: "#a8988a",
  line: "#efe3d6",
  ok: "#2f9e6b",
  warn: "#cf7d1e",
  alert: "#d8483f",
  later: "#e0912f",
};

const display = { fontFamily: "var(--font-lab-bricolage)" };
const body = { fontFamily: "var(--font-lab-jakarta)" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a3d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdfa]";
const CARD_SHADOW = "0 2px 4px rgba(42,30,22,0.05), 0 20px 40px -22px rgba(42,30,22,0.45)";

/* ---------- Status → betekenis ---------- */

type CredMeta = { label: string; color: string; Icon: typeof ShieldCheck };
function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.ok, Icon: BadgeCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", color: C.accent, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt", color: C.warn, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.alert, Icon: XCircle };
  }
}
function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

const NAV_ICON: Record<ScreenKey, typeof Home> = {
  dashboard: Home,
  marktplaats: LayoutGrid,
  opdracht: FileText,
  verificatie: ShieldCheck,
  acties: Sparkles,
  facturen: Receipt,
  documenten: Folder,
  berichten: FileText,
};

/* ---------- Kleine bouwstenen ---------- */

function Chip({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...body, color, background: `${color}18` }}
    >
      {children}
    </span>
  );
}

function CredBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <Chip color={m.color}>
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" /> {m.label}
    </Chip>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[19px] font-bold tracking-[-0.01em]" style={{ ...display, color: C.ink }}>
      {children}
    </h2>
  );
}

// Groot rond match-cijfer — het handtekening-element.
function MatchDial({ value, size = 66 }: { value: number; size?: number }) {
  const r = size / 2 - 4;
  const circ = 2 * Math.PI * r;
  const strong = value >= 90;
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
          stroke={`${C.accent}22`}
          strokeWidth="4"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strong ? C.accent : C.amber}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
        />
      </svg>
      <span className="flex flex-col items-center leading-none">
        <span
          className="text-[18px] font-extrabold tabular-nums"
          style={{ ...display, color: C.ink }}
        >
          {value}
        </span>
        <span
          className="text-[8px] font-bold uppercase tracking-[0.1em]"
          style={{ color: C.faint }}
        >
          match
        </span>
      </span>
    </span>
  );
}

/* ---------- Hoofdcomponent (mobiel frame) ---------- */

export function Concept93() {
  const [screen, setScreen] = useState<ScreenKey>("marktplaats");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="flex min-h-[680px] w-full items-center justify-center p-4 antialiased sm:p-8"
      style={{ ...body, color: C.ink, background: C.backdrop }}
    >
      {/* Telefoon-frame */}
      <div
        className="relative flex w-full max-w-[440px] flex-col overflow-hidden rounded-[34px]"
        style={{
          background: C.frame,
          border: `1px solid ${C.line}`,
          boxShadow: "0 30px 70px -30px rgba(42,30,22,0.55), 0 0 0 8px rgba(255,255,255,0.5)",
          minHeight: 640,
        }}
      >
        {/* Statusbalk + header */}
        <div className="shrink-0 px-5 pt-4">
          <div
            className="mx-auto mb-3 h-1.5 w-24 rounded-full"
            style={{ background: C.line }}
            aria-hidden="true"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[12px] font-extrabold text-white"
                style={{ ...display, background: C.accent }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div>
                <p className="text-[13px] font-bold leading-tight" style={{ ...display }}>
                  {PROFIEL.naam.split(" ")[0]}
                </p>
                <p
                  className="flex items-center gap-1 text-[10px] font-semibold"
                  style={{ color: C.ok }}
                >
                  <ShieldCheck size={10} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
                </p>
              </div>
            </div>
            <span
              className="rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em]"
              style={{ ...display, color: C.accent, background: `${C.accent}15` }}
            >
              {SCREENS.find((s) => s.key === screen)?.label}
            </span>
          </div>
        </div>

        {/* Scherm-inhoud */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 pt-4">
          {screen === "dashboard" && <Dashboard onGo={setScreen} />}
          {screen === "marktplaats" && <SwipeDeck onOpen={open} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties onGo={setScreen} />}
          {screen === "facturen" && <Facturen />}
        </div>

        {/* Onderbalk (screen switcher) */}
        <nav
          className="shrink-0"
          style={{ borderTop: `1px solid ${C.line}`, background: C.surface }}
          aria-label="Hoofdnavigatie"
        >
          <div className="flex items-stretch justify-between px-1.5 py-1.5">
            {SCREENS.map((s) => {
              const on = s.key === screen;
              const Icon = NAV_ICON[s.key];
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5 transition-colors ${RING}`}
                  style={{
                    color: on ? C.accent : C.faint,
                    background: on ? `${C.accent}12` : "transparent",
                  }}
                >
                  <Icon size={18} strokeWidth={on ? 2.6 : 2} aria-hidden="true" />
                  <span className="text-[9px] font-bold" style={{ ...body }}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[12px] font-semibold" style={{ color: C.muted }}>
          Goedemorgen,
        </p>
        <SectionTitle>Klaar om te swipen?</SectionTitle>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {KPIS.slice(0, 4).map((k) => (
          <div
            key={k.label}
            className="rounded-2xl p-3.5"
            style={{ background: C.surfaceAlt, border: `1px solid ${C.line}` }}
          >
            <p className="text-[10.5px] font-semibold leading-tight" style={{ color: C.muted }}>
              {k.label}
            </p>
            <p className="mt-1 text-[20px] font-extrabold tabular-nums" style={{ ...display }}>
              {k.value}
            </p>
            <span
              className="mt-1 inline-block text-[10.5px] font-bold"
              style={{ color: k.up ? C.ok : C.warn }}
            >
              {k.up ? "▲" : "▼"} {k.trend}
            </span>
          </div>
        ))}
      </div>

      {/* Call-to-swipe */}
      <button
        type="button"
        onClick={() => onGo("marktplaats")}
        className={`flex w-full items-center gap-3 rounded-2xl p-4 text-left text-white transition-transform hover:-translate-y-0.5 ${RING}`}
        style={{ background: C.accent, boxShadow: CARD_SHADOW }}
      >
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: "rgba(255,255,255,0.2)" }}
          aria-hidden="true"
        >
          <LayoutGrid size={20} strokeWidth={2.4} />
        </span>
        <span className="flex-1">
          <span className="block text-[15px] font-bold" style={{ ...display }}>
            {OPDRACHTEN.length} nieuwe matches
          </span>
          <span className="block text-[12px]" style={{ color: "rgba(255,255,255,0.85)" }}>
            Swipe je stapel van vandaag
          </span>
        </span>
        <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
      </button>

      {/* Volgende beste actie */}
      <div>
        <p
          className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em]"
          style={{ color: C.faint }}
        >
          Vraagt om actie
        </p>
        <div
          className="rounded-2xl p-4"
          style={{ background: `${C.amber}12`, border: `1px solid ${C.amber}44` }}
          role="alert"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} strokeWidth={2.4} color={C.warn} aria-hidden="true" />
            <span className="text-[13.5px] font-bold" style={{ ...display }}>
              {ACTIES[0]!.titel}
            </span>
          </div>
          <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
            {ACTIES[0]!.detail}
          </p>
          <button
            type="button"
            onClick={() => onGo("verificatie")}
            className={`mt-3 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-bold text-white transition-colors ${RING}`}
            style={{ background: C.warn }}
          >
            {ACTIES[0]!.cta} <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats — swipe-deck (de ster) ---------- */

type SwipeDir = "nee" | "later" | "ja";

function SwipeDeck({ onOpen }: { onOpen: (id: string) => void }) {
  const [index, setIndex] = useState(0);
  const [exit, setExit] = useState<SwipeDir | null>(null);
  const [history, setHistory] = useState<SwipeDir[]>([]);

  const act = (dir: SwipeDir) => {
    if (exit || index >= OPDRACHTEN.length) return;
    setExit(dir);
    window.setTimeout(() => {
      setHistory((h) => [...h, dir]);
      setIndex((i) => i + 1);
      setExit(null);
    }, 300);
  };
  const undo = () => {
    if (exit || index === 0) return;
    setHistory((h) => h.slice(0, -1));
    setIndex((i) => i - 1);
  };
  const reset = () => {
    setIndex(0);
    setHistory([]);
  };

  const done = index >= OPDRACHTEN.length;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <SectionTitle>Jouw stapel</SectionTitle>
        <span className="text-[12px] font-bold tabular-nums" style={{ ...display, color: C.muted }}>
          {Math.min(index + (done ? 0 : 1), OPDRACHTEN.length)}/{OPDRACHTEN.length}
        </span>
      </div>

      {/* Kaart-stapel */}
      <div className="relative mx-auto w-full" style={{ height: 388, maxWidth: 340 }}>
        {done ? (
          <div
            className="flex h-full flex-col items-center justify-center rounded-3xl p-8 text-center"
            style={{ background: C.surfaceAlt, border: `1px dashed ${C.line}` }}
          >
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: `${C.ok}18` }}
              aria-hidden="true"
            >
              <Check size={30} strokeWidth={2.4} color={C.ok} />
            </span>
            <p className="mt-4 text-[17px] font-bold" style={{ ...display }}>
              Alle matches bekeken
            </p>
            <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
              Je hebt {history.filter((h) => h === "ja").length} keer &quot;ja&quot; gezegd. Kom
              later terug voor nieuwe.
            </p>
            <button
              type="button"
              onClick={reset}
              className={`mt-5 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-bold text-white transition-colors ${RING}`}
              style={{ background: C.accent }}
            >
              <Undo2 size={14} strokeWidth={2.6} aria-hidden="true" /> Opnieuw bekijken
            </button>
          </div>
        ) : (
          OPDRACHTEN.map((o, i) => {
            if (i < index || i > index + 2) return null;
            const depth = i - index; // 0 = boven
            const isTop = depth === 0;
            const leaving = isTop && exit;
            const translate =
              leaving === "nee"
                ? "translateX(-130%) rotate(-16deg)"
                : leaving === "ja"
                  ? "translateX(130%) rotate(16deg)"
                  : leaving === "later"
                    ? "translateY(130%)"
                    : `translateY(${depth * 12}px) scale(${1 - depth * 0.05})`;
            return (
              <div
                key={o.id}
                className="absolute inset-0"
                style={{
                  transform: translate,
                  opacity: leaving ? 0 : 1,
                  zIndex: 10 - depth,
                  transition: "transform 300ms cubic-bezier(0.22,1,0.36,1), opacity 300ms ease",
                }}
                aria-hidden={!isTop}
              >
                <SwipeCard o={o} isTop={isTop} exit={isTop ? exit : null} onOpen={onOpen} />
              </div>
            );
          })
        )}
      </div>

      {/* Swipe-knoppen */}
      {!done && (
        <div className="mt-5 flex items-center justify-center gap-4">
          <SwipeButton label="Nee, niet passend" color={C.alert} onClick={() => act("nee")}>
            <X size={24} strokeWidth={2.8} aria-hidden="true" />
          </SwipeButton>
          <SwipeButton label="Later bekijken" color={C.later} small onClick={() => act("later")}>
            <Clock size={20} strokeWidth={2.6} aria-hidden="true" />
          </SwipeButton>
          <SwipeButton label="Ja, ik reageer" color={C.ok} onClick={() => act("ja")}>
            <Heart size={22} strokeWidth={2.6} aria-hidden="true" />
          </SwipeButton>
          <SwipeButton label="Ongedaan maken" color={C.muted} small onClick={undo}>
            <Undo2 size={18} strokeWidth={2.6} aria-hidden="true" />
          </SwipeButton>
        </div>
      )}
      <p className="mt-3 text-center text-[11px]" style={{ color: C.faint }}>
        Tik op de kaart voor alle details.
      </p>
    </div>
  );
}

function SwipeButton({
  children,
  label,
  color,
  small,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  color: string;
  small?: boolean;
  onClick: () => void;
}) {
  const s = small ? "h-12 w-12" : "h-16 w-16";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex ${s} items-center justify-center rounded-full transition-transform hover:-translate-y-1 active:scale-95 ${RING}`}
      style={{
        color,
        background: C.surface,
        border: `2px solid ${color}33`,
        boxShadow: CARD_SHADOW,
      }}
    >
      {children}
    </button>
  );
}

function SwipeCard({
  o,
  isTop,
  exit,
  onOpen,
}: {
  o: Opdracht;
  isTop: boolean;
  exit: SwipeDir | null;
  onOpen: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => isTop && onOpen(o.id)}
      tabIndex={isTop ? 0 : -1}
      aria-label={`${o.titel}, match ${o.match} procent — open details`}
      className={`relative flex h-full w-full flex-col overflow-hidden rounded-3xl text-left ${RING}`}
      style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: CARD_SHADOW }}
    >
      {/* Bovenband met "album-art" (CSS/SVG, geen externe afbeelding) */}
      <div className="relative h-32 shrink-0 overflow-hidden" aria-hidden="true">
        <svg
          viewBox="0 0 340 128"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id={`g-${o.id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={C.accent} />
              <stop offset="1" stopColor={C.amber} />
            </linearGradient>
          </defs>
          <rect width="340" height="128" fill={`url(#g-${o.id})`} />
          {[0, 1, 2, 3].map((k) => (
            <circle
              key={k}
              cx={40 + k * 80}
              cy={k % 2 ? 30 : 96}
              r={44 - k * 4}
              fill="none"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="2"
            />
          ))}
        </svg>
        <span
          className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white"
          style={{ ...display, background: "rgba(0,0,0,0.22)" }}
        >
          {o.id}
        </span>
        <span className="absolute bottom-3 right-3">
          <span
            className="flex h-[70px] w-[70px] items-center justify-center rounded-full"
            style={{
              background: "rgba(255,255,255,0.92)",
              boxShadow: "0 6px 16px -8px rgba(0,0,0,0.4)",
            }}
          >
            <MatchDial value={o.match} size={62} />
          </span>
        </span>
      </div>

      {/* Swipe-stempels */}
      {isTop && exit === "nee" && <Stamp text="NEE" color={C.alert} rot={-14} side="right" />}
      {isTop && exit === "ja" && <Stamp text="JA" color={C.ok} rot={14} side="left" />}
      {isTop && exit === "later" && <Stamp text="LATER" color={C.later} rot={-6} side="center" />}

      <div className="flex flex-1 flex-col p-4">
        <h3
          className="text-[17px] font-extrabold leading-tight"
          style={{ ...display, color: C.ink }}
        >
          {o.titel}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-[12.5px]" style={{ color: C.muted }}>
          <MapPin size={13} strokeWidth={2.2} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
        </p>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Chip color={C.accent}>{o.tarief}</Chip>
          <Chip color={C.amber}>
            <Clock size={11} strokeWidth={2.4} aria-hidden="true" /> {o.uren}
          </Chip>
          <Chip color={C.muted}>{o.start}</Chip>
        </div>

        <div className="mt-auto space-y-1 pt-3">
          {o.redenen.plus.slice(0, 2).map((r) => (
            <p key={r} className="flex items-center gap-1.5 text-[12px] font-medium">
              <Check size={13} strokeWidth={2.8} color={C.ok} aria-hidden="true" /> {r}
            </p>
          ))}
        </div>
      </div>
    </button>
  );
}

function Stamp({
  text,
  color,
  rot,
  side,
}: {
  text: string;
  color: string;
  rot: number;
  side: "left" | "right" | "center";
}) {
  const pos =
    side === "left"
      ? "left-5 top-6"
      : side === "right"
        ? "right-5 top-6"
        : "left-1/2 top-24 -translate-x-1/2";
  return (
    <span
      className={`pointer-events-none absolute ${pos} z-20 rounded-xl border-4 px-3 py-1 text-[24px] font-black uppercase tracking-[0.06em]`}
      style={{
        ...display,
        color,
        borderColor: color,
        transform: `rotate(${rot}deg)`,
        background: "rgba(255,255,255,0.7)",
      }}
      aria-hidden="true"
    >
      {text}
    </span>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className={`inline-flex items-center gap-1 text-[12.5px] font-bold ${RING} rounded-lg`}
        style={{ color: C.accent }}
      >
        <ChevronRight size={15} strokeWidth={2.6} className="rotate-180" aria-hidden="true" /> Terug
        naar stapel
      </button>

      <div
        className="overflow-hidden rounded-3xl"
        style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: CARD_SHADOW }}
      >
        <div className="relative flex items-center gap-4 p-4" style={{ background: C.surfaceAlt }}>
          <MatchDial value={opdracht.match} size={64} />
          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.08em]"
              style={{ color: C.faint }}
            >
              {opdracht.id}
            </p>
            <h2 className="text-[18px] font-extrabold leading-tight" style={{ ...display }}>
              {opdracht.titel}
            </h2>
            <p className="text-[12px]" style={{ color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-px p-px" style={{ background: C.line }}>
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
          ].map((m) => (
            <div key={m.l} className="p-3 text-center" style={{ background: C.surface }}>
              <p
                className="text-[9.5px] font-bold uppercase tracking-[0.06em]"
                style={{ color: C.faint }}
              >
                {m.l}
              </p>
              <p className="mt-0.5 text-[13px] font-bold tabular-nums" style={{ ...display }}>
                {m.v}
              </p>
            </div>
          ))}
        </div>

        <div className="p-4">
          <div className="flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{ color: C.muted, background: C.surfaceAlt }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Redenen */}
      <div
        className="rounded-2xl p-4"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <p
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em]"
          style={{ color: C.ok }}
        >
          <Check size={13} strokeWidth={3} aria-hidden="true" /> Waarom dit past
        </p>
        <ul className="mt-2 space-y-1.5">
          {opdracht.redenen.plus.map((r) => (
            <li key={r} className="flex items-start gap-2 text-[13px]">
              <Check
                size={15}
                strokeWidth={2.4}
                color={C.ok}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />{" "}
              {r}
            </li>
          ))}
        </ul>
        <p
          className="mt-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em]"
          style={{ color: C.warn }}
        >
          <AlertTriangle size={13} strokeWidth={2.4} aria-hidden="true" /> Let op
        </p>
        <ul className="mt-2 space-y-1.5">
          {opdracht.redenen.min.map((r) => (
            <li key={r} className="flex items-start gap-2 text-[13px]" style={{ color: C.muted }}>
              <AlertTriangle
                size={15}
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

      <button
        type="button"
        onClick={react}
        disabled={state !== "idle"}
        aria-live="polite"
        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[14px] font-bold text-white transition-colors disabled:opacity-90 ${RING}`}
        style={{ background: state === "sent" ? C.ok : C.accent, boxShadow: CARD_SHADOW }}
      >
        {state === "idle" && (
          <>
            <Heart size={16} strokeWidth={2.6} aria-hidden="true" /> Reageer op opdracht
          </>
        )}
        {state === "sending" && "Versturen…"}
        {state === "sent" && (
          <>
            <Check size={16} strokeWidth={3} aria-hidden="true" /> Reactie verstuurd
          </>
        )}
      </button>
    </div>
  );
}

/* ---------- Verificatie — kaarten in mapjes ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-5">
      <div>
        <SectionTitle>Jouw mapjes</SectionTitle>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          {verified}/{CREDENTIALS.length} geverifieerd · veilig & privé bewaard.
        </p>
      </div>

      <div className="space-y-3">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const Icon = m.Icon;
          return (
            <div
              key={c.naam}
              className="relative rounded-2xl p-4"
              style={{
                background: C.surface,
                border: `1px solid ${C.line}`,
                boxShadow: CARD_SHADOW,
              }}
            >
              {/* Mapje-tab bovenrand */}
              <span
                className="absolute -top-2 left-4 h-2 w-14 rounded-t-lg"
                style={{ background: m.color }}
                aria-hidden="true"
              />
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${m.color}18` }}
                  aria-hidden="true"
                >
                  <Icon size={20} strokeWidth={2.2} color={m.color} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold leading-tight" style={{ ...display }}>
                    {c.naam}
                  </p>
                  <p className="text-[11.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
              </div>
              <div className="mt-2.5">
                <CredBadge status={c.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <SectionTitle>Te doen</SectionTitle>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Op volgorde van urgentie — begin bovenaan.
        </p>
      </div>

      <div className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.warn : C.accent;
          return (
            <div
              key={a.titel}
              className="rounded-2xl p-4"
              style={{
                background: C.surface,
                border: `1px solid ${C.line}`,
                boxShadow: CARD_SHADOW,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[12px] font-extrabold text-white"
                  style={{ ...display, background: color }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span
                  className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
                  style={{ color }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
              </div>
              <p className="mt-2 text-[14px] font-bold" style={{ ...display }}>
                {a.titel}
              </p>
              <p className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                {a.detail}
              </p>
              <button
                type="button"
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className={`mt-3 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-bold transition-colors ${RING}`}
                style={{
                  color: warn ? "#fff" : C.accent,
                  background: warn ? C.warn : `${C.accent}14`,
                }}
              >
                {a.cta} <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Facturen — bon-kaarten ---------- */

function Facturen() {
  const statusColor: Record<string, string> = {
    Betaald: C.ok,
    Openstaand: C.warn,
    Concept: C.faint,
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <SectionTitle>Bonnen</SectionTitle>
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold text-white transition-colors ${RING}`}
          style={{ background: C.accent }}
        >
          <Plus size={13} strokeWidth={2.8} aria-hidden="true" /> Nieuw
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-2xl p-3.5"
          style={{ background: `${C.ok}12`, border: `1px solid ${C.ok}33` }}
        >
          <p
            className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
            style={{ color: C.ok }}
          >
            Ontvangen
          </p>
          <p
            className="mt-1 text-[19px] font-extrabold tabular-nums"
            style={{ ...display, color: C.ok }}
          >
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </div>
        <div
          className="rounded-2xl p-3.5"
          style={{ background: `${C.warn}12`, border: `1px solid ${C.warn}33` }}
        >
          <p
            className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
            style={{ color: C.warn }}
          >
            Openstaand
          </p>
          <p
            className="mt-1 text-[19px] font-extrabold tabular-nums"
            style={{ ...display, color: C.warn }}
          >
            € {open.toLocaleString("nl-NL")}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {FACTUREN.map((f) => {
          const color = statusColor[f.status] ?? C.faint;
          return (
            <div
              key={f.nr}
              className="relative overflow-hidden rounded-2xl p-4"
              style={{
                background: C.surface,
                border: `1px solid ${C.line}`,
                boxShadow: CARD_SHADOW,
              }}
            >
              {/* Bon-perforatie links */}
              <span
                className="absolute inset-y-0 left-0 w-1.5"
                style={{
                  background: `repeating-linear-gradient(180deg, ${color} 0 6px, transparent 6px 12px)`,
                }}
                aria-hidden="true"
              />
              <div className="flex items-center justify-between pl-2">
                <div>
                  <p className="text-[13px] font-extrabold tabular-nums" style={{ ...display }}>
                    {f.nr}
                  </p>
                  <p className="text-[12px] font-medium" style={{ color: C.muted }}>
                    {f.klant}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[16px] font-extrabold tabular-nums" style={{ ...display }}>
                    {f.bedrag}
                  </p>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: color }}
                      aria-hidden="true"
                    />
                    <span className="text-[11px] font-bold" style={{ color }}>
                      {f.status}
                    </span>
                  </span>
                </div>
              </div>
              <p className="mt-2 pl-2 text-[10.5px] tabular-nums" style={{ color: C.faint }}>
                {f.datum}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
