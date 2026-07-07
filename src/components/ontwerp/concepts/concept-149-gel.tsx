"use client";

// Concept 149 — "Gel" · organische, gooey blob-UI (Family/Arc-gevoel). Zachte, licht-vervormde
// blobs met organische border-radius, translucente overlappende lagen en een echte gooey-
// samensmelting (SVG goo-filter) waar decoratieve vormen elkaar raken. Vloeiende hover-morph op
// border-radius. Speels maar premium en rustig; pastel→verzadigde verlopen. Onderscheidend van
// "tij" (kalm plat verloop) en "klei" (matte klei-extrusie): dit is GOOEY/vloeibaar organisch.
// Tekst staat altijd op een leesbare laag (donkere inkt op licht, wit op verzadigd) — WCAG-contrast
// bewaakt. Status nooit kleur-alleen: altijd label + icoon. Deterministisch — geen random/Date.
// Fonts: Sora (display) + Jakarta (body) + Spline Sans Mono (zachte mono).

import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Sparkles,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  ThumbsUp,
  ThumbsDown,
  Droplet,
  Bell,
  TrendingUp,
  Wallet,
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

// ── Palet — warm-lila melkglas, verzadigde gel-accenten ──────────────────────────
const C = {
  bg: "#f4f1fb",
  bgDeep: "#ece7f8",
  ink: "#2b2440",
  inkSoft: "#655d80",
  inkFaint: "#948daf",
  white: "#ffffff",
  line: "rgba(90,70,150,0.12)",
  // gel-tinten (pastel → verzadigd via verloop)
  grape: "#7c5cff",
  grapeDeep: "#5b39e8",
  aqua: "#22c9c0",
  aquaDeep: "#0ea79e",
  coral: "#ff6f91",
  coralDeep: "#ef4d75",
  amber: "#ffab3d",
  amberDeep: "#f08a12",
  lime: "#37c76a",
  limeDeep: "#1fa552",
  sky: "#38a3ff",
  skyDeep: "#1a82e6",
};

const display = { fontFamily: "var(--font-lab-sora)" };
const body = { fontFamily: "var(--font-lab-jakarta)" };
const mono = { fontFamily: "var(--font-lab-spline-mono)" };

// Organische border-radius-vormen — deterministisch geroteerd per index voor de blob-look.
const BLOBS = [
  "58% 42% 55% 45% / 55% 48% 52% 45%",
  "42% 58% 45% 55% / 48% 52% 48% 52%",
  "55% 45% 48% 52% / 45% 55% 45% 55%",
  "48% 52% 60% 40% / 52% 44% 56% 48%",
  "60% 40% 42% 58% / 44% 60% 40% 56%",
];
function blob(i: number): string {
  return BLOBS[i % BLOBS.length] as string;
}
// De morph-doelvorm bij hover (subtiele vervorming) via CSS-variabele.
const BLOBS_HOVER = [
  "50% 50% 48% 52% / 48% 52% 48% 52%",
  "52% 48% 55% 45% / 52% 46% 54% 48%",
  "46% 54% 55% 45% / 52% 48% 52% 48%",
  "54% 46% 50% 50% / 46% 54% 46% 54%",
  "50% 50% 52% 48% / 52% 48% 52% 48%",
];
function blobHover(i: number): string {
  return BLOBS_HOVER[i % BLOBS_HOVER.length] as string;
}

type Gel = { from: string; to: string };
const GELS: Gel[] = [
  { from: C.grape, to: C.grapeDeep },
  { from: C.aqua, to: C.aquaDeep },
  { from: C.coral, to: C.coralDeep },
  { from: C.amber, to: C.amberDeep },
];
function gelStyle(g: Gel): React.CSSProperties {
  return { background: `linear-gradient(135deg, ${g.from}, ${g.to})` };
}
function gelAt(i: number): Gel {
  return GELS[i % GELS.length] as Gel;
}

// ── Status-model — nooit kleur-alleen ────────────────────────────────────────────
function credMeta(s: CredStatus): { label: string; Icon: LucideIcon; from: string; to: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, from: C.lime, to: C.limeDeep };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, from: C.sky, to: C.skyDeep };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, from: C.amber, to: C.amberDeep };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, from: C.coral, to: C.coralDeep };
  }
}

function CredBadge({ status, big = false }: { status: CredStatus; big?: boolean }) {
  const m = credMeta(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold text-white ${
        big ? "px-3 py-1 text-[12px]" : "px-2.5 py-1 text-[11px]"
      }`}
      style={{ ...body, background: `linear-gradient(135deg, ${m.from}, ${m.to})` }}
    >
      <m.Icon size={big ? 14 : 12} strokeWidth={2.6} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Match-toon (verzadigd hoe hoger de match).
function matchGel(m: number): Gel {
  if (m >= 90) return { from: C.lime, to: C.limeDeep };
  if (m >= 80) return { from: C.aqua, to: C.aquaDeep };
  return { from: C.amber, to: C.amberDeep };
}

// ── Blob-kaart — organische, licht-vervormde kaart met hover-morph ───────────────
function Blob({
  children,
  i = 0,
  className = "",
  interactive = false,
  tint = C.white,
  as = "div",
}: {
  children: React.ReactNode;
  i?: number;
  className?: string;
  interactive?: boolean;
  tint?: string;
  as?: "div" | "li";
}) {
  const Tag = as;
  return (
    <Tag
      className={`gel-blob relative ${interactive ? "gel-morph transition-[border-radius,transform,box-shadow] duration-500" : ""} ${className}`}
      style={
        {
          background: tint,
          borderRadius: blob(i),
          border: `1px solid ${C.line}`,
          boxShadow: "0 18px 40px -24px rgba(70,40,140,0.45), 0 2px 8px -4px rgba(70,40,140,0.18)",
          ["--blob-hover" as string]: blobHover(i),
        } as React.CSSProperties
      }
    >
      {children}
    </Tag>
  );
}

// Zachte pil-knop met gel-verloop.
function GelButton({
  children,
  gel,
  onClick,
  className = "",
  ghost = false,
}: {
  children: React.ReactNode;
  gel?: Gel;
  onClick?: () => void;
  className?: string;
  ghost?: boolean;
}) {
  const g = gel ?? gelAt(0);
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:brightness-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0 ${className}`}
      style={
        ghost
          ? {
              ...body,
              color: C.ink,
              background: "rgba(124,92,255,0.10)",
              ["--tw-ring-color" as string]: C.grape,
            }
          : {
              ...body,
              color: C.white,
              background: `linear-gradient(135deg, ${g.from}, ${g.to})`,
              boxShadow: `0 12px 24px -12px ${g.to}`,
              ["--tw-ring-color" as string]: g.to,
            }
      }
    >
      {children}
    </button>
  );
}

// Zachte sparkline op de gel-kaarten.
function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 100;
    return `${x},${y}`;
  });
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-9 w-full" aria-hidden="true">
      <polyline
        points={`0,100 ${pts.join(" ")} 100,100`}
        fill={tone}
        opacity={0.14}
        stroke="none"
      />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={tone}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Ring-meter voor match/dekking.
function Ring({ value, gel, label }: { value: number; gel: Gel; label: string }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - value / 100);
  const id = `gel-ring-${label.replace(/\s+/g, "")}`;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" aria-hidden="true">
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={gel.from} />
              <stop offset="1" stopColor={gel.to} />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(90,70,150,0.12)" strokeWidth="7" />
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            stroke={`url(#${id})`}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={off}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-[15px] font-bold tabular-nums"
          style={{ ...display, color: C.ink }}
        >
          {value}
        </span>
      </div>
      <span className="text-[11px] font-semibold" style={{ ...body, color: C.inkSoft }}>
        {label}
      </span>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept149() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden antialiased"
      style={{ ...body, background: C.bg, color: C.ink }}
    >
      {/* Gooey-filter — decoratieve blobs smelten samen waar ze elkaar raken */}
      <svg className="pointer-events-none absolute h-0 w-0" aria-hidden="true">
        <defs>
          <filter id="gel-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {/* Zachte samensmeltende achtergrond-blobs (decoratief, gooey) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ filter: "url(#gel-goo)" }}
        aria-hidden="true"
      >
        <span
          className="absolute h-72 w-72 rounded-full opacity-40 blur-[2px]"
          style={{
            top: "-4rem",
            left: "-3rem",
            background: `radial-gradient(circle, ${C.grape}, transparent 70%)`,
          }}
        />
        <span
          className="absolute h-64 w-64 rounded-full opacity-40 blur-[2px]"
          style={{
            top: "2rem",
            left: "8rem",
            background: `radial-gradient(circle, ${C.aqua}, transparent 70%)`,
          }}
        />
        <span
          className="absolute h-80 w-80 rounded-full opacity-30 blur-[2px]"
          style={{
            top: "-6rem",
            right: "-4rem",
            background: `radial-gradient(circle, ${C.coral}, transparent 70%)`,
          }}
        />
        <span
          className="absolute h-72 w-72 rounded-full opacity-25 blur-[2px]"
          style={{
            bottom: "-8rem",
            right: "20%",
            background: `radial-gradient(circle, ${C.amber}, transparent 70%)`,
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-5 md:px-8">
        {/* Kop */}
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center text-white"
              style={{ ...gelStyle(gelAt(0)), borderRadius: blob(0) }}
              aria-hidden="true"
            >
              <Droplet size={20} strokeWidth={2.4} />
            </span>
            <div className="leading-tight">
              <div className="text-[17px] font-bold tracking-[-0.01em]" style={display}>
                ZZP&nbsp;Gel
              </div>
              <div className="text-[12px]" style={{ color: C.inkSoft }}>
                Zorgt dat je werk vloeit
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold sm:inline-flex"
              style={{ background: "rgba(55,199,106,0.14)", color: C.limeDeep }}
            >
              <ShieldCheck size={14} strokeWidth={2.6} aria-hidden="true" />
              {PROFIEL.trust}
            </span>
            <span
              className="flex h-10 w-10 items-center justify-center text-[13px] font-bold text-white"
              style={{ ...gelStyle(gelAt(2)), borderRadius: blob(2) }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        {/* Scherm-switcher */}
        <nav className="mb-6 flex items-center gap-1.5 overflow-x-auto pb-1" aria-label="Schermen">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  on
                    ? {
                        ...body,
                        color: C.white,
                        ...gelStyle(gelAt(0)),
                        boxShadow: `0 10px 20px -12px ${C.grapeDeep}`,
                        ["--tw-ring-color" as string]: C.grape,
                      }
                    : {
                        ...body,
                        color: C.inkSoft,
                        background: "rgba(124,92,255,0.08)",
                        ["--tw-ring-color" as string]: C.grape,
                      }
                }
              >
                {s.label}
              </button>
            );
          })}
        </nav>

        <main>
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

      {/* Hover-morph regel (border-radius vloeit naar de doelvorm) */}
      <style>{`
        .gel-morph:hover { border-radius: var(--blob-hover) !important; transform: translateY(-3px); box-shadow: 0 26px 52px -26px rgba(70,40,140,0.5); }
        @media (prefers-reduced-motion: reduce) { .gel-morph { transition: none !important; } .gel-morph:hover { transform: none; } }
      `}</style>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const kpiIcons = [TrendingUp, Bell, Wallet, Coins];
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-5">
      {/* Hero-groet + aandacht-blob */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Blob
          i={0}
          interactive
          className="overflow-hidden p-6 text-white lg:col-span-2"
          tint="transparent"
        >
          <div className="absolute inset-0 -z-0" style={gelStyle(gelAt(0))} aria-hidden="true" />
          <div className="relative z-10">
            <p className="text-[13px] font-medium opacity-90">
              Goedemorgen, {PROFIEL.naam.split(" ")[0]}
            </p>
            <h1
              className="mt-1 text-[26px] font-bold leading-tight tracking-[-0.02em] sm:text-[30px]"
              style={display}
            >
              Je week vloeit lekker door
            </h1>
            <p className="mt-2 max-w-md text-[14px] leading-relaxed opacity-90">
              3 nieuwe matches boven 85% en je omzet loopt op. Eén ding vraagt aandacht: je VOG
              verloopt binnenkort.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <GelButton
                gel={{ from: "#ffffff", to: "#f2eefe" }}
                className="!text-[#5b39e8]"
                onClick={onOpen}
              >
                Bekijk matches <ArrowRight size={16} aria-hidden="true" />
              </GelButton>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white ring-1 ring-white/40 transition-all duration-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <AlertTriangle size={15} strokeWidth={2.6} aria-hidden="true" /> Los actie op
              </button>
            </div>
          </div>
        </Blob>

        {/* Vertrouwen / dekking-blob */}
        <Blob i={1} interactive className="flex flex-col items-center justify-center gap-3 p-6">
          <Ring value={dek} gel={{ from: C.lime, to: C.limeDeep }} label="Dekking certificaten" />
          <p className="text-center text-[13px] leading-snug" style={{ color: C.inkSoft }}>
            {verified} van {CREDENTIALS.length} certificaten geverifieerd
          </p>
          <CredBadge status="VERIFIED" />
        </Blob>
      </div>

      {/* KPI-blobs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const g = gelAt(i);
          const Icon = kpiIcons[i % kpiIcons.length] as LucideIcon;
          return (
            <Blob key={k.label} i={i + 1} interactive className="p-4">
              <div className="flex items-center justify-between">
                <span
                  className="flex h-8 w-8 items-center justify-center text-white"
                  style={{ ...gelStyle(g), borderRadius: blob(i + 2) }}
                  aria-hidden="true"
                >
                  <Icon size={15} strokeWidth={2.4} />
                </span>
                <span
                  className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold"
                  style={{
                    background: k.up ? "rgba(55,199,106,0.14)" : "rgba(255,171,61,0.16)",
                    color: k.up ? C.limeDeep : C.amberDeep,
                  }}
                >
                  {k.up ? (
                    <ArrowUpRight size={12} aria-hidden="true" />
                  ) : (
                    <ArrowRight size={12} className="rotate-90" aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-3 text-[24px] font-bold leading-none tracking-[-0.02em]"
                style={{ ...display, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-1 text-[12px]" style={{ color: C.inkSoft }}>
                {k.label}
              </div>
              <div className="mt-2">
                <Spark data={k.spark} tone={g.to} />
              </div>
            </Blob>
          );
        })}
      </div>

      {/* Aanbevolen matches + aandacht-strook */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <h2 className="px-1 text-[15px] font-bold" style={display}>
            Matches voor jou
          </h2>
          {OPDRACHTEN.map((o, i) => {
            const g = matchGel(o.match);
            return (
              <Blob key={o.id} i={i} interactive className="overflow-hidden">
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none"
                >
                  <span
                    className="flex h-14 w-14 shrink-0 flex-col items-center justify-center text-white"
                    style={{ ...gelStyle(g), borderRadius: blob(i + 1) }}
                    aria-hidden="true"
                  >
                    <span className="text-[17px] font-bold leading-none" style={display}>
                      {o.match}
                    </span>
                    <span className="text-[9px] font-semibold opacity-90">match</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[15px] font-bold"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </div>
                    <div className="mt-0.5 truncate text-[12.5px]" style={{ color: C.inkSoft }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{ background: "rgba(55,199,106,0.13)", color: C.limeDeep }}
                        >
                          <Check size={11} strokeWidth={2.8} aria-hidden="true" /> {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight
                    size={18}
                    className="shrink-0"
                    style={{ color: C.inkFaint }}
                    aria-hidden="true"
                  />
                </button>
              </Blob>
            );
          })}
        </div>

        <div className="space-y-4">
          <h2 className="px-1 text-[15px] font-bold" style={display}>
            Vraagt aandacht
          </h2>
          <Blob i={3} interactive className="overflow-hidden p-5 text-white" tint="transparent">
            <div
              className="absolute inset-0 -z-0"
              style={gelStyle({ from: C.amber, to: C.amberDeep })}
              aria-hidden="true"
            />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/25 px-2.5 py-1 text-[11px] font-bold">
                <AlertTriangle size={12} strokeWidth={2.8} aria-hidden="true" /> Let op
              </span>
              <h3 className="mt-2.5 text-[16px] font-bold leading-snug" style={display}>
                {warn.titel}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed opacity-95">{warn.detail}</p>
              <GelButton
                gel={{ from: "#ffffff", to: "#fff4e4" }}
                className="mt-4 !text-[#f08a12]"
                onClick={onActies}
              >
                {warn.cta} <ArrowRight size={15} aria-hidden="true" />
              </GelButton>
            </div>
          </Blob>
          <Blob i={4} interactive className="p-5">
            <div className="flex items-center gap-2">
              <Sparkles size={16} style={{ color: C.grape }} aria-hidden="true" />
              <h3 className="text-[14px] font-bold" style={display}>
                Tip
              </h3>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
              Profielen met een geverifieerde BIG-registratie krijgen gemiddeld 2× sneller een
              reactie van opdrachtgevers.
            </p>
          </Blob>
        </div>
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[20px] font-bold tracking-[-0.01em]" style={display}>
          Marktplaats
        </h2>
        <Blob i={2} className="flex items-center gap-2 px-4 py-2">
          <Search size={16} style={{ color: C.inkFaint }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek opdracht, plaats…"
            aria-label="Opdrachten zoeken"
            className="w-44 bg-transparent text-[13px] outline-none placeholder:opacity-60"
            style={{ ...body, color: C.ink }}
          />
        </Blob>
      </div>

      {filtered.length === 0 ? (
        <Blob i={0} className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center text-white"
            style={{ ...gelStyle(gelAt(0)), borderRadius: blob(1) }}
            aria-hidden="true"
          >
            <Search size={24} />
          </span>
          <p className="text-[16px] font-bold" style={display}>
            Niets gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
            Geen opdracht voor “{q}”. Probeer een andere zoekterm.
          </p>
          <GelButton onClick={() => setQ("")}>Zoekterm wissen</GelButton>
        </Blob>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o, i) => {
            const g = matchGel(o.match);
            return (
              <Blob key={o.id} i={i} interactive className="flex flex-col overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3
                        className="text-[16px] font-bold leading-snug"
                        style={{ ...display, color: C.ink }}
                      >
                        {o.titel}
                      </h3>
                      <p className="mt-1 text-[12.5px]" style={{ color: C.inkSoft }}>
                        {o.opdrachtgever}
                      </p>
                    </div>
                    <span
                      className="flex h-12 w-12 shrink-0 flex-col items-center justify-center text-white"
                      style={{ ...gelStyle(g), borderRadius: blob(i + 2) }}
                      aria-hidden="true"
                    >
                      <span className="text-[15px] font-bold leading-none" style={display}>
                        {o.match}
                      </span>
                      <span className="text-[8px] font-semibold opacity-90">match</span>
                    </span>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-2 text-[12px]">
                    <Meta Icon={MapPin} value={o.plaats} />
                    <Meta Icon={Coins} value={o.tarief} />
                    <Meta Icon={Clock} value={o.uren} />
                    <Meta Icon={CalendarDays} value={o.start} />
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                        style={{ background: "rgba(124,92,255,0.10)", color: C.grapeDeep }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-auto px-5 pb-5">
                  <GelButton gel={g} onClick={onOpen} className="w-full">
                    Bekijk opdracht <ArrowRight size={15} aria-hidden="true" />
                  </GelButton>
                </div>
              </Blob>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={2.2} style={{ color: C.inkFaint }} aria-hidden="true" />
      <span className="truncate">{value}</span>
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const g = matchGel(opdracht.match);
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
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors hover:bg-[rgba(124,92,255,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ ...body, color: C.inkSoft, ["--tw-ring-color" as string]: C.grape }}
      >
        <ArrowRight size={15} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Blob i={0} interactive className="overflow-hidden p-6 text-white" tint="transparent">
        <div className="absolute inset-0 -z-0" style={gelStyle(g)} aria-hidden="true" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/25 px-2.5 py-1 text-[11px] font-semibold">
              {opdracht.id}
            </span>
            <h1
              className="mt-2.5 text-[26px] font-bold leading-tight tracking-[-0.02em] sm:text-[30px]"
              style={display}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-1.5 text-[14px] opacity-95">
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[40px] font-bold leading-none" style={display}>
              {opdracht.match}
              <span className="text-[18px]">%</span>
            </span>
            <span className="text-[12px] font-semibold opacity-90">match-score</span>
          </div>
        </div>
      </Blob>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f, i) => (
          <Blob key={f.l} i={i + 1} interactive className="p-4">
            <span
              className="flex h-8 w-8 items-center justify-center text-white"
              style={{ ...gelStyle(gelAt(i)), borderRadius: blob(i) }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={2.4} />
            </span>
            <div
              className="mt-3 text-[16px] font-bold leading-none"
              style={{ ...display, color: C.ink }}
            >
              {f.v}
            </div>
            <div className="mt-1 text-[12px]" style={{ color: C.inkSoft }}>
              {f.l}
            </div>
          </Blob>
        ))}
      </div>

      {/* Verklaarbare matching */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Blob i={2} className="p-5">
          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center text-white"
              style={{ ...gelStyle({ from: C.lime, to: C.limeDeep }), borderRadius: blob(1) }}
              aria-hidden="true"
            >
              <ThumbsUp size={14} strokeWidth={2.6} />
            </span>
            <h2 className="text-[15px] font-bold" style={display}>
              Waarom dit past
            </h2>
          </div>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                style={{ color: C.ink }}
              >
                <Check
                  size={16}
                  strokeWidth={2.8}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.limeDeep }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Blob>
        <Blob i={3} className="p-5">
          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center text-white"
              style={{ ...gelStyle({ from: C.amber, to: C.amberDeep }), borderRadius: blob(2) }}
              aria-hidden="true"
            >
              <ThumbsDown size={14} strokeWidth={2.6} />
            </span>
            <h2 className="text-[15px] font-bold" style={display}>
              Om te overwegen
            </h2>
          </div>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                style={{ color: C.ink }}
              >
                <AlertTriangle
                  size={15}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.amberDeep }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Blob>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <GelButton gel={g} className="flex-1">
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </GelButton>
        <GelButton ghost>Bewaar voor later</GelButton>
      </div>
    </div>
  );
}

// ── Verificatie ──────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[20px] font-bold tracking-[-0.01em]" style={display}>
          Verificatie &amp; certificaten
        </h2>
        <GelButton>
          <Plus size={15} aria-hidden="true" /> Certificaat toevoegen
        </GelButton>
      </div>

      <Blob
        i={0}
        interactive
        className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:justify-between"
      >
        <div className="flex items-center gap-5">
          <Ring value={dek} gel={{ from: C.lime, to: C.limeDeep }} label="Dekking" />
          <div>
            <div className="text-[17px] font-bold" style={display}>
              {verified} van {CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 max-w-sm text-[13px] leading-snug" style={{ color: C.inkSoft }}>
              Opdrachtgevers zien alleen je geverifieerde certificaten. Hoe hoger je dekking, hoe
              meer vertrouwen.
            </p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold text-white"
          style={gelStyle({ from: C.lime, to: C.limeDeep })}
        >
          <ShieldCheck size={15} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
        </span>
      </Blob>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c, i) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Blob key={c.naam} i={i} interactive className="flex items-center gap-4 p-5">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center text-white"
                style={{ ...gelStyle({ from: m.from, to: m.to }), borderRadius: blob(i + 1) }}
                aria-hidden="true"
              >
                <m.Icon size={18} strokeWidth={2.4} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15px] font-bold"
                  style={{ ...display, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2">
                  <CredBadge status={c.status} />
                </div>
              </div>
              {actionable && (
                <button
                  className="shrink-0 rounded-full px-3.5 py-2 text-[12px] font-semibold transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    ...body,
                    color: C.white,
                    background: `linear-gradient(135deg, ${m.from}, ${m.to})`,
                    ["--tw-ring-color" as string]: m.to,
                  }}
                >
                  {c.status === "EXPIRING"
                    ? "Vernieuwen"
                    : c.status === "REJECTED"
                      ? "Opnieuw"
                      : "Bekijk"}
                </button>
              )}
            </Blob>
          );
        })}
      </div>
    </div>
  );
}

// ── Acties (next-action) ─────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold tracking-[-0.01em]" style={display}>
          Volgende beste acties
        </h2>
        <p className="mt-1 text-[13.5px]" style={{ color: C.inkSoft }}>
          Op volgorde van urgentie — pak de bovenste eerst.
        </p>
      </div>
      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const g: Gel = warn
            ? { from: C.amber, to: C.amberDeep }
            : { from: C.grape, to: C.grapeDeep };
          return (
            <li key={a.titel}>
              <Blob
                i={i}
                interactive
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center text-[17px] font-bold text-white"
                  style={{ ...gelStyle(g), borderRadius: blob(i + 1), ...display }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                      style={gelStyle(g)}
                    >
                      {warn ? (
                        <AlertTriangle size={12} strokeWidth={2.8} aria-hidden="true" />
                      ) : (
                        <Sparkles size={12} strokeWidth={2.8} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Kans"}
                    </span>
                    <h3 className="text-[15.5px] font-bold" style={{ ...display, color: C.ink }}>
                      {a.titel}
                    </h3>
                  </div>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
                    {a.detail}
                  </p>
                </div>
                <GelButton gel={g} className="shrink-0 self-start sm:self-center">
                  {a.cta} <ArrowRight size={15} aria-hidden="true" />
                </GelButton>
              </Blob>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factGel = (status: string): { g: Gel; Icon: LucideIcon; label: string } => {
    if (status === "Betaald")
      return { g: { from: C.lime, to: C.limeDeep }, Icon: Check, label: "Betaald" };
    if (status === "Openstaand")
      return { g: { from: C.amber, to: C.amberDeep }, Icon: Clock, label: "Openstaand" };
    return { g: { from: C.inkFaint, to: C.inkSoft }, Icon: Droplet, label: "Concept" };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[20px] font-bold tracking-[-0.01em]" style={display}>
          Facturen
        </h2>
        <GelButton>
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </GelButton>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, g: { from: C.lime, to: C.limeDeep } as Gel },
          { l: "Openstaand", v: `${open}`, g: { from: C.amber, to: C.amberDeep } as Gel },
          { l: "Te factureren", v: "€ 1.350", g: { from: C.grape, to: C.grapeDeep } as Gel },
        ].map((s, i) => (
          <Blob key={s.l} i={i} interactive className="p-4 text-white" tint="transparent">
            <div className="absolute inset-0 -z-0" style={gelStyle(s.g)} aria-hidden="true" />
            <div className="relative z-10">
              <div className="text-[12px] font-medium opacity-90">{s.l}</div>
              <div
                className="mt-1.5 text-[24px] font-bold leading-none tracking-[-0.02em]"
                style={display}
              >
                {s.v}
              </div>
            </div>
          </Blob>
        ))}
      </div>

      <Blob i={1} className="overflow-hidden">
        <ul>
          {FACTUREN.map((f, i) => {
            const m = factGel(f.status);
            return (
              <li
                key={f.nr}
                className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-[rgba(124,92,255,0.05)]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center text-white"
                  style={{ ...gelStyle(m.g), borderRadius: blob(i) }}
                  aria-hidden="true"
                >
                  <m.Icon size={15} strokeWidth={2.6} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-bold" style={{ ...display, color: C.ink }}>
                    {f.nr}
                  </div>
                  <div className="text-[12.5px]" style={{ color: C.inkSoft }}>
                    {f.klant} · {f.datum}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold text-white"
                  style={gelStyle(m.g)}
                >
                  <m.Icon size={12} strokeWidth={2.8} aria-hidden="true" /> {m.label}
                </span>
                <span
                  className="w-20 text-right text-[15px] font-bold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
      </Blob>
    </div>
  );
}
