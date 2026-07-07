"use client";

// Concept 147 — "Zonnewijzer" · schaduw & zonnetijd. Warm zandsteen/terracotta palet. Een gnomon
// (de staaf van een zonnewijzer) werpt schuine schaduwen over de kaarten; zonne-uur-markeringen
// langs de randen; een seizoens- en tijd-van-de-dag-gevoel. Tijd en voortgang worden uitgedrukt
// als schaduwhoek: hoe verder op de dag, hoe langer de schaduw. Kalm, warm, natuurlijk. Status via
// label + icoon (nooit kleur-alleen). Onderscheidend van "uurwerk" (tandwielen) en "solar"
// (zonnepanelen): dit is een ZONNEWIJZER met schaduw. Deterministisch — geen random, geen Date.
// Fonts: Fraunces (display) + Manrope (tekst) + Newsreader-cijfers via Fraunces.

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  MapPin,
  Coins,
  CalendarDays,
  Plus,
  Sun,
  Sunrise,
  Sunset,
  Compass,
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

// ── Palet — zandsteen, terracotta, warme schaduw ────────────────────────────────
const C = {
  bg: "#f4ede0",
  bgDeep: "#ece2d1",
  card: "#fbf7ee",
  cardWarm: "#f7efe1",
  ink: "#3a2f26",
  inkSoft: "#7a6a58",
  inkFaint: "#a3927d",
  line: "#e2d6c2",
  lineStrong: "#d0c1a8",
  terra: "#c2622d",
  terraDeep: "#9c4a1e",
  clay: "#d98a53",
  sand: "#e8d9bd",
  shadow: "rgba(58,47,38,0.14)",
};

const display = { fontFamily: "var(--font-lab-fraunces)" };
const serif = { fontFamily: "var(--font-lab-newsreader)" };
const body = { fontFamily: "var(--font-lab-manrope)" };

// Schuine schaduw-gradient die een gnomon over een kaart werpt (van linksboven, warm).
const gnomonShadow =
  "linear-gradient(118deg, rgba(58,47,38,0.10) 0%, rgba(58,47,38,0.05) 14%, transparent 34%)";
// Papier-/zandsteentextuur, heel subtiel.
const paper =
  "radial-gradient(circle at 20% 15%, rgba(194,98,45,0.05), transparent 40%), radial-gradient(circle at 85% 90%, rgba(217,138,83,0.05), transparent 45%)";

// ── Status-model — label + icoon (warme tinten, nooit kleur-alleen) ──────────────
function credMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: "#5c7a4a" };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: "#8a6a58" };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.terra };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.terraDeep };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...body, background: `${m.tone}18`, color: m.tone, border: `1px solid ${m.tone}33` }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── Kaart met gnomon-schaduw ─────────────────────────────────────────────────────
function Card({
  children,
  className = "",
  warm = false,
}: {
  children: React.ReactNode;
  className?: string;
  warm?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: warm ? C.cardWarm : C.card,
        border: `1px solid ${C.line}`,
        boxShadow: `0 1px 0 rgba(255,255,255,0.6) inset, 0 18px 40px -28px ${C.shadow}`,
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: gnomonShadow }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div>
      <h2
        className="text-[24px] font-semibold tracking-[-0.01em]"
        style={{ ...display, color: C.ink }}
      >
        {children}
      </h2>
      {sub && (
        <p className="mt-0.5 text-[13px]" style={{ ...body, color: C.inkSoft }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// De zonnewijzer zelf — een halve-cirkel wijzerplaat met uur-markeringen en een gnomon-wijzer
// waarvan de hoek de waarde (bv. voortgang/match) uitdrukt. De schaduw valt tegenovergesteld.
function Sundial({ value, label, size = 168 }: { value: number; label: string; size?: number }) {
  const cx = 100;
  const cy = 96;
  const r = 78;
  // 0..100 → hoek van 180° (west/ochtend) naar 0° (oost/avond) over de bovenboog.
  const angle = Math.PI * (1 - value / 100);
  const gx = cx + Math.cos(angle) * r;
  const gy = cy - Math.sin(angle) * r;
  // Schaduw valt in tegengestelde, iets langere richting.
  const sx = cx - Math.cos(angle) * (r * 0.62);
  const sy = cy + Math.abs(Math.sin(angle)) * 10 - Math.sin(angle) * (r * 0.62) * 0.15;
  const hours = Array.from({ length: 9 }, (_, i) => i); // 9 uur-markeringen over de boog
  return (
    <svg
      viewBox="0 0 200 116"
      style={{ width: size }}
      role="img"
      aria-label={`${label}: ${value} procent`}
    >
      {/* wijzerplaat-vlak */}
      <path
        d={`M12 ${cy} A${r + 10} ${r + 10} 0 0 1 ${200 - 12} ${cy} Z`}
        fill={C.sand}
        opacity={0.5}
      />
      {/* basisboog */}
      <path
        d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke={C.lineStrong}
        strokeWidth={2}
      />
      {/* uur-markeringen */}
      {hours.map((i) => {
        const a = Math.PI * (1 - i / (hours.length - 1));
        const x1 = cx + Math.cos(a) * r;
        const y1 = cy - Math.sin(a) * r;
        const x2 = cx + Math.cos(a) * (r - (i % 2 === 0 ? 12 : 7));
        const y2 = cy - Math.sin(a) * (r - (i % 2 === 0 ? 12 : 7));
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={C.inkFaint}
            strokeWidth={i % 2 === 0 ? 2 : 1}
          />
        );
      })}
      {/* schaduw van de gnomon */}
      <line
        x1={cx}
        y1={cy}
        x2={sx}
        y2={sy}
        stroke={C.shadow}
        strokeWidth={10}
        strokeLinecap="round"
        opacity={0.6}
      />
      {/* gnomon-wijzer */}
      <line
        x1={cx}
        y1={cy}
        x2={gx}
        y2={gy}
        stroke={C.terra}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <circle cx={gx} cy={gy} r={5} fill={C.terra} />
      {/* voetstuk */}
      <circle cx={cx} cy={cy} r={6} fill={C.ink} />
      {/* waarde */}
      <text
        x={cx}
        y={cy - 26}
        textAnchor="middle"
        style={serif}
        fontSize="30"
        fontWeight={600}
        fill={C.ink}
      >
        {value}
      </text>
      <text
        x={cx}
        y={cy - 12}
        textAnchor="middle"
        style={body}
        fontSize="9"
        fontWeight={700}
        letterSpacing="1.5"
        fill={C.inkFaint}
      >
        {label.toUpperCase()}
      </text>
    </svg>
  );
}

// Kleine schaduw-balk: voortgang als schaduwlengte.
function ShadowBar({ value }: { value: number }) {
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full"
      style={{ background: C.sand }}
      aria-hidden="true"
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${value}%`,
          background: `linear-gradient(90deg, ${C.clay}, ${C.terra})`,
        }}
      />
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept147() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full antialiased"
      style={{ ...body, background: C.bg, color: C.ink, backgroundImage: paper }}
    >
      <header
        className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3.5 md:px-8"
        style={{
          background: "rgba(244,237,224,0.9)",
          borderBottom: `1px solid ${C.line}`,
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${C.terra}16`, border: `1px solid ${C.terra}33` }}
            aria-hidden="true"
          >
            <Compass size={19} strokeWidth={2} style={{ color: C.terra }} />
          </span>
          <div className="leading-none">
            <div
              className="text-[18px] font-semibold tracking-[-0.01em]"
              style={{ ...display, color: C.ink }}
            >
              Zonnewijzer
            </div>
            <div className="mt-1 text-[12px]" style={{ ...body, color: C.inkSoft }}>
              {PROFIEL.naam} · {PROFIEL.rol}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
            style={{ background: C.cardWarm, border: `1px solid ${C.line}`, color: C.inkSoft }}
          >
            <Sun size={13} style={{ color: C.terra }} aria-hidden="true" /> Middagstand
          </span>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold"
            style={{ background: C.terra, color: C.card, ...body }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      <nav
        className="flex items-center gap-1.5 overflow-x-auto px-4 py-3 md:px-8"
        aria-label="Schermen"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...body,
                color: on ? C.card : C.inkSoft,
                background: on ? C.terra : "transparent",
                border: `1px solid ${on ? C.terra : C.line}`,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-7 md:px-8 md:py-9">
        {screen === "dashboard" && (
          <Dashboard
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

// ── Dashboard ────────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onQueue }: { onOpen: () => void; onQueue: () => void }) {
  const lead = ACTIES.find((a) => a.urgentie === "warning") ?? ACTIES[0];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      {/* Hero: zonnewijzer + begroeting */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card warm className="p-6 lg:col-span-2">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <Sundial value={92} label="Match" size={190} />
            <div className="min-w-0">
              <p
                className="text-[12px] font-bold uppercase tracking-[0.16em]"
                style={{ ...body, color: C.terra }}
              >
                Goedemiddag, Sanne
              </p>
              <h1
                className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.01em] sm:text-[32px]"
                style={{ ...display, color: C.ink }}
              >
                De zon staat gunstig — je match-kwaliteit is hoog.
              </h1>
              <div
                className="mt-4 flex flex-wrap items-center gap-4 text-[13px]"
                style={{ color: C.inkSoft }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Sunrise size={15} style={{ color: C.clay }} aria-hidden="true" /> 7 open reacties
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Sunset size={15} style={{ color: C.terra }} aria-hidden="true" /> 2 te factureren
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Lead-actie */}
        <Card className="flex flex-col p-5" warm>
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
            style={{ ...body, color: C.terra }}
          >
            <AlertTriangle size={13} aria-hidden="true" /> Vraagt aandacht
          </span>
          <h3
            className="mt-2 text-[18px] font-semibold leading-snug"
            style={{ ...display, color: C.ink }}
          >
            {lead?.titel}
          </h3>
          <p className="mt-1.5 flex-1 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {lead?.detail}
          </p>
          <button
            onClick={onQueue}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...body, background: C.terra, color: C.card }}
          >
            {lead?.cta} <ArrowRight size={15} aria-hidden="true" />
          </button>
        </Card>
      </div>

      {/* KPI's als zonne-uur-tegels */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold" style={{ ...body, color: C.inkSoft }}>
                {k.label}
              </span>
              <span
                className="text-[11px] font-bold tabular-nums"
                style={{ ...body, color: k.up ? "#5c7a4a" : C.terra }}
              >
                {k.up ? "↑" : "↓"} {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[28px] font-semibold tabular-nums tracking-[-0.02em]"
              style={{ ...serif, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <ShadowBar value={[92, 70, 82, 45][i % 4] as number} />
            </div>
          </Card>
        ))}
      </div>

      {/* Kansen + dekking */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div
            className="flex items-center justify-between border-b px-5 py-4"
            style={{ borderColor: C.line }}
          >
            <SectionTitle sub="Gerangschikt op zonnestand — de beste match staat hoog">
              Kansen vandaag
            </SectionTitle>
            <button
              onClick={onOpen}
              className="text-[12px] font-semibold transition-colors hover:opacity-70 focus-visible:outline-none"
              style={{ ...body, color: C.terra }}
            >
              Alles →
            </button>
          </div>
          <ul className="divide-y" style={{ borderColor: C.line }}>
            {OPDRACHTEN.map((o) => (
              <li key={o.id}>
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f7efe1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c2622d]/40"
                >
                  <span
                    className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full text-[14px] font-bold tabular-nums"
                    style={{
                      ...serif,
                      background: `${C.terra}14`,
                      border: `1px solid ${C.terra}30`,
                      color: C.terraDeep,
                    }}
                    aria-hidden="true"
                  >
                    {o.match}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[15px] font-semibold"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </div>
                    <div className="mt-0.5 truncate text-[12.5px]" style={{ color: C.inkSoft }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                  </div>
                  <ArrowRight
                    size={16}
                    className="shrink-0"
                    style={{ color: C.inkFaint }}
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <SectionTitle sub={`${dek}% van je bewijs staat in het licht`}>Vertrouwen</SectionTitle>
          <div className="mt-4 flex items-center justify-center">
            <Sundial value={dek} label="Dekking" size={168} />
          </div>
          <ul className="mt-4 space-y-2">
            {CREDENTIALS.map((c) => (
              <li key={c.naam} className="flex items-center justify-between gap-2">
                <span className="truncate text-[12.5px] font-medium" style={{ color: C.ink }}>
                  {c.naam}
                </span>
                <StatusChip status={c.status} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

// ── Marktplaats ──────────────────────────────────────────────────────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle sub="Opdrachten in het licht van vandaag">Marktplaats</SectionTitle>
        <div
          className="flex items-center gap-2 rounded-full px-3.5 py-2"
          style={{ background: C.card, border: `1px solid ${C.line}` }}
        >
          <Search size={15} style={{ color: C.inkFaint }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-56 bg-transparent text-[13px] outline-none placeholder:opacity-60"
            style={{ ...body, color: C.ink }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <Search size={26} style={{ color: C.inkFaint }} aria-hidden="true" />
          <p className="text-[16px] font-semibold" style={{ ...display, color: C.ink }}>
            Niets in de schaduw gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
            Geen opdracht komt overeen met “{q}”.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-xl px-4 py-2 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...body, background: C.terra, color: C.card }}
          >
            Zoekopdracht wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Card key={o.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span
                    className="text-[11px] font-bold uppercase tracking-[0.12em]"
                    style={{ ...body, color: C.inkFaint }}
                  >
                    {o.id}
                  </span>
                  <h3
                    className="mt-1 text-[17px] font-semibold leading-snug"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-1 text-[12.5px]" style={{ color: C.inkSoft }}>
                    {o.opdrachtgever} · {o.plaats}
                  </p>
                </div>
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[15px] font-bold tabular-nums"
                  style={{
                    ...serif,
                    background: `${C.terra}14`,
                    border: `1px solid ${C.terra}30`,
                    color: C.terraDeep,
                  }}
                  aria-hidden="true"
                >
                  {o.match}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style={{ ...body, background: C.sand, color: C.inkSoft }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-4 flex items-center justify-between border-t pt-3"
                style={{ borderColor: C.line }}
              >
                <span
                  className="text-[14px] font-semibold"
                  style={{ ...serif, color: C.terraDeep }}
                >
                  {o.tarief}
                </span>
                <button
                  onClick={onOpen}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold transition-colors hover:bg-[#f7efe1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ ...body, border: `1px solid ${C.lineStrong}`, color: C.ink }}
                >
                  Bekijk <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[13px] font-semibold transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ ...body, color: C.inkSoft }}
      >
        <ArrowLeft size={15} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Card warm className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <span
              className="text-[12px] font-bold uppercase tracking-[0.14em]"
              style={{ ...body, color: C.terra }}
            >
              {opdracht.id} · {opdracht.start}
            </span>
            <h1
              className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.01em] sm:text-[34px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <Sundial value={opdracht.match} label="Match" size={188} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((m) => (
          <Card key={m.l} className="p-4">
            <m.Icon size={16} style={{ color: C.terra }} aria-hidden="true" />
            <div
              className="mt-3 text-[18px] font-semibold tabular-nums"
              style={{ ...serif, color: C.ink }}
            >
              {m.v}
            </div>
            <div className="mt-1 text-[12px] font-medium" style={{ ...body, color: C.inkSoft }}>
              {m.l}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h3
            className="flex items-center gap-2 text-[16px] font-semibold"
            style={{ ...display, color: C.ink }}
          >
            <Sun size={16} style={{ color: "#5c7a4a" }} aria-hidden="true" /> Wat pleit vóór
          </h3>
          <ul className="mt-3 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                style={{ color: C.inkSoft }}
              >
                <Check
                  size={16}
                  strokeWidth={2.4}
                  className="mt-0.5 shrink-0"
                  style={{ color: "#5c7a4a" }}
                  aria-hidden="true"
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h3
            className="flex items-center gap-2 text-[16px] font-semibold"
            style={{ ...display, color: C.ink }}
          >
            <Sunset size={16} style={{ color: C.terra }} aria-hidden="true" /> Waar de schaduw valt
          </h3>
          <ul className="mt-3 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                style={{ color: C.inkSoft }}
              >
                <AlertTriangle
                  size={15}
                  strokeWidth={2.4}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.terra }}
                  aria-hidden="true"
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-[14px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...body, background: C.terra, color: C.card }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-[14px] font-semibold transition-colors hover:bg-[#f7efe1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...body, border: `1px solid ${C.lineStrong}`, color: C.ink }}
        >
          Bewaar voor later
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ──────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <SectionTitle sub="Elk bewijsstuk werpt licht op je betrouwbaarheid">
        Verificatie
      </SectionTitle>

      <Card warm className="flex flex-col items-center gap-6 p-6 sm:flex-row">
        <Sundial value={pct} label="Compleet" size={180} />
        <div>
          <p
            className="text-[13px] font-bold uppercase tracking-[0.14em]"
            style={{ ...body, color: C.terra }}
          >
            Vertrouwensniveau · {PROFIEL.trust}
          </p>
          <p className="mt-2 max-w-md text-[15px] leading-relaxed" style={{ color: C.ink }}>
            {verified} van {CREDENTIALS.length} bewijsstukken staan volledig in het licht. Vernieuw
            wat binnenkort verloopt om zichtbaar te blijven voor opdrachtgevers.
          </p>
        </div>
      </Card>

      <Card>
        <div className="border-b px-5 py-4" style={{ borderColor: C.line }}>
          <h3 className="text-[16px] font-semibold" style={{ ...display, color: C.ink }}>
            Bewijsstukken
          </h3>
        </div>
        <ul className="divide-y" style={{ borderColor: C.line }}>
          {CREDENTIALS.map((c) => {
            const m = credMeta(c.status);
            const actionable = c.status !== "VERIFIED";
            return (
              <li key={c.naam} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: `${m.tone}16`,
                    border: `1px solid ${m.tone}33`,
                    color: m.tone,
                  }}
                  aria-hidden="true"
                >
                  <m.Icon size={18} strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold" style={{ ...display, color: C.ink }}>
                    {c.naam}
                  </div>
                  <div className="text-[12.5px]" style={{ color: C.inkSoft }}>
                    {c.detail}
                  </div>
                </div>
                <StatusChip status={c.status} />
                <button
                  disabled={!actionable}
                  className="rounded-xl px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    ...body,
                    background: actionable ? C.terra : "transparent",
                    color: actionable ? C.card : C.inkFaint,
                    border: `1px solid ${actionable ? C.terra : C.line}`,
                  }}
                >
                  {actionable ? "Vernieuwen" : "In orde"}
                </button>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

// ── Acties ───────────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-5">
      <SectionTitle sub="Volg de zon — begin bij wat het snelst vervaagt">
        Volgende stappen
      </SectionTitle>
      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Card warm={warn} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[18px] font-semibold tabular-nums"
                  style={{
                    ...serif,
                    background: warn ? `${C.terra}16` : C.sand,
                    border: `1px solid ${warn ? C.terra : C.lineStrong}44`,
                    color: warn ? C.terraDeep : C.ink,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {warn ? (
                      <AlertTriangle
                        size={15}
                        strokeWidth={2.4}
                        style={{ color: C.terra }}
                        aria-hidden="true"
                      />
                    ) : (
                      <Sun size={15} style={{ color: C.clay }} aria-hidden="true" />
                    )}
                    <h3 className="text-[16px] font-semibold" style={{ ...display, color: C.ink }}>
                      {a.titel}
                    </h3>
                    <span
                      className="text-[11px] font-bold uppercase tracking-[0.12em]"
                      style={{ ...body, color: warn ? C.terra : C.inkFaint }}
                    >
                      {warn ? "Vervaagt snel" : "Op je gemak"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:self-center"
                  style={{
                    ...body,
                    background: warn ? C.terra : "transparent",
                    color: warn ? C.card : C.ink,
                    border: `1px solid ${warn ? C.terra : C.lineStrong}`,
                  }}
                >
                  {a.cta}
                </button>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const meta = (status: string): { tone: string; Icon: LucideIcon } => {
    if (status === "Betaald") return { tone: "#5c7a4a", Icon: Check };
    if (status === "Openstaand") return { tone: C.terra, Icon: Clock };
    return { tone: C.inkFaint, Icon: CalendarDays };
  };
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;
  const total = "€ 8.622";
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle sub="Wat is betaald, wat staat nog in de schaduw">Facturen</SectionTitle>
        <button
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...body, background: C.terra, color: C.card }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: total },
          { l: "Openstaand", v: `${open}` },
          { l: "Concept", v: `${FACTUREN.filter((f) => f.status === "Concept").length}` },
        ].map((s) => (
          <Card key={s.l} className="p-4">
            <span className="text-[12px] font-semibold" style={{ ...body, color: C.inkSoft }}>
              {s.l}
            </span>
            <div
              className="mt-1.5 text-[24px] font-semibold tabular-nums"
              style={{ ...serif, color: C.ink }}
            >
              {s.v}
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] ${i === 4 ? "text-right" : ""}`}
                  style={{ ...body, color: C.inkFaint }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const m = meta(f.status);
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[#f7efe1]"
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <td
                    className="px-5 py-4 text-[12.5px] font-medium tabular-nums"
                    style={{ ...body, color: C.inkSoft }}
                  >
                    {f.nr}
                  </td>
                  <td
                    className="px-5 py-4 text-[13.5px] font-semibold"
                    style={{ ...display, color: C.ink }}
                  >
                    {f.klant}
                  </td>
                  <td
                    className="px-5 py-4 text-[12.5px] tabular-nums"
                    style={{ ...body, color: C.inkSoft }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{
                        ...body,
                        background: `${m.tone}16`,
                        color: m.tone,
                        border: `1px solid ${m.tone}33`,
                      }}
                    >
                      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
                      {f.status}
                    </span>
                  </td>
                  <td
                    className="px-5 py-4 text-right text-[15px] font-semibold tabular-nums"
                    style={{ ...serif, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${C.lineStrong}` }}>
              <td
                colSpan={4}
                className="px-5 py-4 text-[12px] font-bold uppercase tracking-[0.1em]"
                style={{ ...body, color: C.inkFaint }}
              >
                Totaal betaald
              </td>
              <td
                className="px-5 py-4 text-right text-[18px] font-semibold tabular-nums"
                style={{ ...serif, color: C.terraDeep }}
              >
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </Card>
    </div>
  );
}
