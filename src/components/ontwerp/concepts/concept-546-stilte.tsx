"use client";

// Concept 546 — "Stilte" · calm / zen focus. Low-stimulation, één volgende-beste-actie tegelijk
// centraal, veel lucht, gedempt palet en minimale prikkels. Het systeem toont alleen wat NU telt;
// de rest is één rustige stap weg. Vertrouwen ontstaat via kalmte — passend bij gevoelige documenten.
// 2026-trends: distraction-free focus-mode, editorial serif-typografie, spatiale rust ("slow UI"),
// zachte reduced-motion micro-fades. Deterministisch — geen random/Date.
// Fonts: Fraunces (serif koppen) + Inter (rustige body).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ShieldCheck,
  Feather,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Coins,
  MapPin,
  CalendarDays,
  RefreshCw,
  CloudOff,
  Sparkle,
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

// ── Palet — gedempt, warm, laag contrast maar toegankelijk ────────────────────────────
const C = {
  bg: "#f6f5f1",
  panel: "#fffefb",
  raised: "#faf9f4",
  ink: "#2a2925",
  inkSoft: "#67655d",
  inkFaint: "#a3a096",
  line: "#eae7de",
  lineSoft: "#f1efe8",
  accent: "#6b7f77", // gedempt saliegroen-grijs
  accentDeep: "#495a53",
  accentSoft: "#e8ede9",
  ok: "#5c7a63",
  warn: "#a8804a",
  bad: "#a85a4e",
  info: "#5f7385",
};

const serif = { fontFamily: "var(--font-lab-fraunces)" };
const ui = { fontFamily: "var(--font-lab-inter)" };

function credMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.ok };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.info };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.warn };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.bad };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-medium"
      style={{ background: `${m.tone}14`, color: m.tone, border: `1px solid ${m.tone}30` }}
    >
      <m.Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────────
export function Concept546() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0]!;

  return (
    <div
      className="min-h-screen w-full antialiased"
      style={{ ...ui, background: C.bg, color: C.ink }}
    >
      <style>{`
        @keyframes stilFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .stil-fade { animation: stilFade 480ms cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes stilBreath { 0%,100% { transform: scale(1); opacity: 0.55; } 50% { transform: scale(1.08); opacity: 0.9; } }
        .stil-breath { animation: stilBreath 5.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .stil-fade, .stil-breath { animation: none !important; }
        }
      `}</style>

      <header className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-5 py-5 md:px-8">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: C.accentSoft }}
            aria-hidden="true"
          >
            <Feather size={17} strokeWidth={1.8} style={{ color: C.accentDeep }} />
          </span>
          <div className="leading-tight">
            <div className="text-[16px] font-semibold tracking-[-0.01em]" style={serif}>
              Stilte
            </div>
            <div className="text-[11px]" style={{ color: C.inkFaint }}>
              Rustig werken · {PROFIEL.naam}
            </div>
          </div>
        </div>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-medium"
          style={{ background: C.accentDeep, color: "#fff" }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </header>

      {/* Rustige, ademende navigatie */}
      <nav
        className="mx-auto flex max-w-4xl items-center gap-1 overflow-x-auto px-5 pb-2 md:px-8"
        aria-label="Schermen"
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                color: on ? C.accentDeep : C.inkFaint,
                background: on ? C.accentSoft : "transparent",
                outlineColor: C.accent,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-4xl px-5 py-6 md:px-8 md:py-10">
        {screen === "dashboard" && (
          <FocusDashboard
            onOpen={() => setScreen("opdracht")}
            onQueue={() => setScreen("verificatie")}
          />
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
  );
}

// ── Focus-dashboard — één volgende-beste-actie tegelijk, centraal ─────────────────────
function FocusDashboard({ onOpen, onQueue }: { onOpen: () => void; onQueue: () => void }) {
  const sorted = useMemo(
    () =>
      [...ACTIES].sort((a, b) =>
        a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
      ),
    [],
  );
  const [i, setI] = useState(0);
  const actie = sorted[i]!;
  const tone = actie.urgentie === "warning" ? C.warn : C.accent;
  const totaal = sorted.length;

  const ga = (delta: number) => setI((v) => (v + delta + totaal) % totaal);

  return (
    <div className="space-y-10">
      {/* Rustige begroeting */}
      <div className="stil-fade text-center">
        <p className="text-[12.5px] uppercase tracking-[0.16em]" style={{ color: C.inkFaint }}>
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </p>
        <h1
          className="mt-3 text-[26px] font-normal leading-tight tracking-[-0.01em] sm:text-[32px]"
          style={serif}
        >
          Één ding tegelijk.
        </h1>
        <p
          className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed"
          style={{ color: C.inkSoft }}
        >
          We tonen je alleen wat nu telt. De rest wacht rustig op de achtergrond.
        </p>
      </div>

      {/* De centrale kaart — de volgende beste actie */}
      <div className="relative flex justify-center">
        <div
          className="stil-breath pointer-events-none absolute inset-0 -z-0 mx-auto h-full w-full max-w-lg rounded-[40px]"
          style={{ background: `radial-gradient(closest-side, ${C.accentSoft}, transparent)` }}
          aria-hidden="true"
        />
        <section
          key={actie.titel}
          className="stil-fade relative z-10 w-full max-w-lg rounded-3xl px-7 py-9 text-center sm:px-10"
          style={{
            background: C.panel,
            border: `1px solid ${C.line}`,
            boxShadow: "0 4px 40px rgba(42,41,37,0.05)",
          }}
          aria-live="polite"
        >
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: `${tone}14` }}
            aria-hidden="true"
          >
            {actie.urgentie === "warning" ? (
              <AlertTriangle size={24} strokeWidth={1.8} style={{ color: tone }} />
            ) : (
              <Sparkle size={24} strokeWidth={1.8} style={{ color: tone }} />
            )}
          </span>
          <p className="mt-5 text-[11.5px] uppercase tracking-[0.14em]" style={{ color: tone }}>
            {actie.urgentie === "warning" ? "Vraagt aandacht" : "Kans van vandaag"}
          </p>
          <h2
            className="mt-2 text-[22px] font-normal leading-snug tracking-[-0.01em] sm:text-[25px]"
            style={serif}
          >
            {actie.titel}
          </h2>
          <p
            className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed"
            style={{ color: C.inkSoft }}
          >
            {actie.detail}
          </p>
          <button
            onClick={onQueue}
            className="mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-medium text-white transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.accentDeep, outlineColor: C.accent }}
          >
            {actie.cta} <ArrowRight size={16} aria-hidden="true" />
          </button>
        </section>
      </div>

      {/* Rustige stepper */}
      <div className="flex items-center justify-center gap-5">
        <button
          onClick={() => ga(-1)}
          aria-label="Vorige actie"
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[#f1efe8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ border: `1px solid ${C.line}`, color: C.inkSoft, outlineColor: C.accent }}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2" aria-hidden="true">
          {sorted.map((a, idx) => (
            <span
              key={a.titel}
              className="h-2 rounded-full transition-all"
              style={{ width: idx === i ? 22 : 8, background: idx === i ? C.accentDeep : C.line }}
            />
          ))}
        </div>
        <button
          onClick={() => ga(1)}
          aria-label="Volgende actie"
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[#f1efe8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ border: `1px solid ${C.line}`, color: C.inkSoft, outlineColor: C.accent }}
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Alles wat rust op de achtergrond — bewust ingetogen */}
      <div className="border-t pt-8" style={{ borderColor: C.line }}>
        <p
          className="mb-4 text-center text-[12px] uppercase tracking-[0.14em]"
          style={{ color: C.inkFaint }}
        >
          Rustig op de achtergrond
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {KPIS.map((k) => (
            <div
              key={k.label}
              className="rounded-2xl px-4 py-4 text-center"
              style={{ background: C.raised, border: `1px solid ${C.lineSoft}` }}
            >
              <div className="text-[21px] font-normal tabular-nums leading-none" style={serif}>
                {k.value}
              </div>
              <div className="mt-2 text-[11px] leading-tight" style={{ color: C.inkFaint }}>
                {k.label}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onOpen}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors hover:bg-[#f1efe8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.inkSoft, border: `1px solid ${C.line}`, outlineColor: C.accent }}
          >
            Bekijk je beste match <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Marktplaats — kalme lijst met loading/empty/error ─────────────────────────────────
type Laadstatus = "gereed" | "laden" | "fout";

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [laad, setLaad] = useState<Laadstatus>("gereed");
  const filtered = useMemo(
    () =>
      OPDRACHTEN.filter((o) => {
        const t = q.toLowerCase();
        return (
          !t ||
          o.titel.toLowerCase().includes(t) ||
          o.plaats.toLowerCase().includes(t) ||
          o.opdrachtgever.toLowerCase().includes(t)
        );
      }),
    [q],
  );

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-[24px] font-normal tracking-[-0.01em] sm:text-[28px]" style={serif}>
          Passende opdrachten
        </h1>
        <p
          className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed"
          style={{ color: C.inkSoft }}
        >
          Zorgvuldig geselecteerd. Neem rustig de tijd om te kijken wat past.
        </p>
      </div>

      <div
        className="mx-auto flex max-w-md items-center gap-2.5 rounded-full px-5 py-3"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <Search size={16} style={{ color: C.inkFaint }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek rustig…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[14px] outline-none placeholder:opacity-60"
          style={{ color: C.ink }}
        />
      </div>

      {/* Demo-status-schakelaar */}
      <div
        className="flex items-center justify-center gap-1.5"
        role="group"
        aria-label="Weergavestatus"
      >
        {(["gereed", "laden", "fout"] as Laadstatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setLaad(s)}
            aria-pressed={laad === s}
            className="rounded-full px-3.5 py-1.5 text-[11.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: laad === s ? C.accentSoft : "transparent",
              color: laad === s ? C.accentDeep : C.inkFaint,
              border: `1px solid ${laad === s ? "transparent" : C.line}`,
              outlineColor: C.accent,
            }}
          >
            {s === "gereed" ? "Resultaten" : s === "laden" ? "Laden" : "Fout"}
          </button>
        ))}
      </div>

      {laad === "laden" ? (
        <div className="mx-auto max-w-xl space-y-4" aria-busy="true" aria-live="polite">
          <p
            className="flex items-center justify-center gap-2 text-center text-[13px]"
            style={{ color: C.inkFaint }}
          >
            <RefreshCw size={15} className="stil-spin" aria-hidden="true" /> Even geduld, we kijken
            rustig rond…
          </p>
          {[0, 1].map((n) => (
            <div
              key={n}
              className="rounded-3xl px-6 py-6"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <div className="h-4 w-2/3 rounded-full" style={{ background: C.lineSoft }} />
              <div className="mt-3 h-3 w-1/3 rounded-full" style={{ background: C.lineSoft }} />
            </div>
          ))}
          <style>{`@keyframes stilSpin { to { transform: rotate(360deg); } } .stil-spin { animation: stilSpin 1.4s linear infinite; } @media (prefers-reduced-motion: reduce) { .stil-spin { animation: none !important; } }`}</style>
        </div>
      ) : laad === "fout" ? (
        <div
          className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-3xl px-6 py-12 text-center"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <span
            className="h-13 w-13 flex items-center justify-center rounded-full"
            style={{ background: `${C.bad}12`, color: C.bad, width: 52, height: 52 }}
            aria-hidden="true"
          >
            <CloudOff size={24} strokeWidth={1.8} />
          </span>
          <p className="text-[16px] font-normal" style={serif}>
            Even geen verbinding
          </p>
          <p className="max-w-xs text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            We konden de opdrachten niet ophalen. Adem even in — en probeer het zo opnieuw.
          </p>
          <button
            onClick={() => setLaad("gereed")}
            className="mt-1 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.accentDeep, outlineColor: C.accent }}
          >
            <RefreshCw size={14} aria-hidden="true" /> Opnieuw proberen
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-3xl px-6 py-14 text-center"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <span
            className="flex items-center justify-center rounded-full"
            style={{ background: C.raised, color: C.inkFaint, width: 52, height: 52 }}
            aria-hidden="true"
          >
            <Search size={22} strokeWidth={1.8} />
          </span>
          <p className="text-[16px] font-normal" style={serif}>
            Niets gevonden
          </p>
          <p className="max-w-xs text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            Geen resultaat voor “{q}”. Wis je zoekopdracht en kijk rustig verder.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-5 py-2.5 text-[13px] font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.accentDeep, outlineColor: C.accent }}
          >
            Zoekopdracht wissen
          </button>
        </div>
      ) : (
        <div className="mx-auto max-w-xl space-y-4">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="stil-fade block w-full rounded-3xl px-6 py-6 text-left transition-shadow hover:shadow-[0_4px_30px_rgba(42,41,37,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.panel, border: `1px solid ${C.line}`, outlineColor: C.accent }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3
                    className="text-[18px] font-normal leading-snug tracking-[-0.01em]"
                    style={serif}
                  >
                    {o.titel}
                  </h3>
                  <p
                    className="mt-1.5 flex items-center gap-2 text-[13px]"
                    style={{ color: C.inkSoft }}
                  >
                    {o.opdrachtgever}
                    <span style={{ color: C.inkFaint }}>·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={13} aria-hidden="true" /> {o.plaats}
                    </span>
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div
                    className="text-[13px] font-medium tabular-nums"
                    style={{ color: C.accentDeep }}
                  >
                    {o.match}% match
                  </div>
                  <div className="mt-1 text-[13px] tabular-nums" style={{ color: C.inkSoft }}>
                    {o.tarief}
                  </div>
                </div>
              </div>
              <div
                className="mt-4 flex items-center justify-between border-t pt-4"
                style={{ borderColor: C.lineSoft }}
              >
                <span className="text-[12.5px]" style={{ color: C.inkFaint }}>
                  {o.uren} · {o.start}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium"
                  style={{ color: C.accentDeep }}
                >
                  Bekijken <ArrowRight size={14} aria-hidden="true" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ───────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[13px] font-medium transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.inkSoft, outlineColor: C.accent }}
      >
        <ArrowLeft size={15} aria-hidden="true" /> Terug
      </button>

      <div className="stil-fade text-center">
        <p className="text-[12px] uppercase tracking-[0.14em]" style={{ color: C.inkFaint }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <h1
          className="mt-3 text-[28px] font-normal leading-tight tracking-[-0.01em] sm:text-[34px]"
          style={serif}
        >
          {opdracht.titel}
        </h1>
        <div
          className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
          style={{ background: C.accentSoft }}
        >
          <CircleDot size={14} style={{ color: C.accentDeep }} aria-hidden="true" />
          <span className="text-[13px] font-medium" style={{ color: C.accentDeep }}>
            {opdracht.match}% match met jouw profiel
          </span>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {feiten.map((f) => (
          <div
            key={f.l}
            className="rounded-2xl px-4 py-4 text-center"
            style={{ background: C.raised, border: `1px solid ${C.lineSoft}` }}
          >
            <f.Icon
              size={16}
              strokeWidth={1.8}
              className="mx-auto"
              style={{ color: C.accent }}
              aria-hidden="true"
            />
            <dd className="mt-2 text-[14px] font-medium tabular-nums">{f.v}</dd>
            <dt className="mt-1 text-[11px]" style={{ color: C.inkFaint }}>
              {f.l}
            </dt>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div
          className="rounded-3xl px-6 py-6"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <h2 className="text-[15px] font-normal" style={serif}>
            Waarom dit past
          </h2>
          <ul className="mt-3 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px] leading-relaxed"
                style={{ color: C.inkSoft }}
              >
                <Check
                  size={15}
                  strokeWidth={2.2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.ok }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div
          className="rounded-3xl px-6 py-6"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <h2 className="text-[15px] font-normal" style={serif}>
            Om te overwegen
          </h2>
          <ul className="mt-3 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px] leading-relaxed"
                style={{ color: C.inkSoft }}
              >
                <AlertTriangle
                  size={14}
                  strokeWidth={2.2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.warn }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          className="inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-medium text-white transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.accentDeep, outlineColor: C.accent }}
        >
          Rustig reageren <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="text-[13px] font-medium transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.inkSoft, outlineColor: C.accent }}
        >
          Bewaar voor later
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ────────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <span
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: C.accentSoft }}
          aria-hidden="true"
        >
          <ShieldCheck size={22} strokeWidth={1.8} style={{ color: C.accentDeep }} />
        </span>
        <h1
          className="mt-4 text-[24px] font-normal tracking-[-0.01em] sm:text-[28px]"
          style={serif}
        >
          Je dossier is in orde
        </h1>
        <p
          className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed"
          style={{ color: C.inkSoft }}
        >
          {pct}% van je certificaten is geverifieerd. Je documenten blijven altijd privé.
        </p>
      </div>

      <div className="space-y-3">
        {CREDENTIALS.map((c) => {
          const actionable = c.status !== "VERIFIED";
          return (
            <div
              key={c.naam}
              className="flex flex-wrap items-center justify-between gap-4 rounded-3xl px-6 py-5"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <div className="min-w-0">
                <div className="text-[15px] font-medium">{c.naam}</div>
                <div className="mt-0.5 text-[12.5px]" style={{ color: C.inkFaint }}>
                  {c.detail}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusChip status={c.status} />
                {actionable && (
                  <button
                    className="rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors hover:bg-[#dfe6e1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      background: C.accentSoft,
                      color: C.accentDeep,
                      outlineColor: C.accent,
                    }}
                  >
                    Regelen
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Acties (volledige lijst, kalm) ──────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <h1 className="text-[24px] font-normal tracking-[-0.01em] sm:text-[28px]" style={serif}>
          Wat er nog wacht
        </h1>
        <p
          className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed"
          style={{ color: C.inkSoft }}
        >
          Op volgorde van belang. Pak er één op — de rest loopt niet weg.
        </p>
      </div>
      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const tone = a.urgentie === "warning" ? C.warn : C.accent;
          return (
            <li
              key={a.titel}
              className="flex items-start gap-4 rounded-3xl px-6 py-5"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[14px] font-medium tabular-nums"
                style={{ background: C.raised, color: C.accentDeep, ...serif }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: tone }}
                    aria-hidden="true"
                  />
                  <h3 className="text-[15px] font-medium">{a.titel}</h3>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 self-center rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors hover:bg-[#dfe6e1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ background: C.accentSoft, color: C.accentDeep, outlineColor: C.accent }}
              >
                {a.cta}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────────
function Facturen() {
  const tone = (s: string): string =>
    s === "Betaald" ? C.ok : s === "Openstaand" ? C.warn : C.inkFaint;
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <h1 className="text-[24px] font-normal tracking-[-0.01em] sm:text-[28px]" style={serif}>
          Je facturen
        </h1>
        <p
          className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed"
          style={{ color: C.inkSoft }}
        >
          Een rustig overzicht. {open} factuur wacht nog op betaling.
        </p>
      </div>
      <div className="space-y-3">
        {FACTUREN.map((f) => (
          <div
            key={f.nr}
            className="flex flex-wrap items-center justify-between gap-4 rounded-3xl px-6 py-5"
            style={{ background: C.panel, border: `1px solid ${C.line}` }}
          >
            <div className="min-w-0">
              <div className="text-[14px] font-medium">{f.klant}</div>
              <div className="mt-0.5 text-[12px]" style={{ color: C.inkFaint }}>
                {f.nr} · {f.datum}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-medium"
                style={{
                  background: `${tone(f.status)}14`,
                  color: tone(f.status),
                  border: `1px solid ${tone(f.status)}30`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: tone(f.status) }}
                  aria-hidden="true"
                />
                {f.status}
              </span>
              <span className="w-20 text-right text-[15px] font-medium tabular-nums" style={serif}>
                {f.bedrag}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
