"use client";

// Concept 480 — "Speelkwartier" · Kleurrijk-speels maar verfijnd. Vrolijke kleurblokken, ronde
// vormen en zacht-3D knoppen met blije microcopy — maar met de informatiedichtheid en rust van een
// premium SaaS. Duolingo-energie × Linear-discipline: samenhangend palet, consequente rondingen.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Award,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Flame,
  Heart,
  MapPin,
  PartyPopper,
  Plus,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  TrendingUp,
  Wallet,
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

// — Samenhangend, vrolijk palet: koraal, mint, zonnegeel, lavendel op zacht-wit —
const C = {
  bg: "#fffdf9",
  bgWarm: "#fff7ed",
  card: "#ffffff",
  ink: "#211e2b",
  inkSoft: "#4a4552",
  inkMute: "#7c7686",
  inkFaint: "#a8a2b2",
  line: "#efe9e0",
  lineSoft: "#f6f1ea",

  coral: "#ff6b6b",
  coralDark: "#e04b4b",
  coralText: "#c93a3a",
  coralSoft: "#ffe8e6",

  mint: "#22c55e",
  mintDark: "#15a349",
  mintText: "#0f8a3d",
  mintSoft: "#dcfce7",

  sun: "#fbbf24",
  sunDark: "#e0a012",
  sunText: "#a16207",
  sunSoft: "#fef3c7",

  lav: "#8b5cf6",
  lavDark: "#7338e8",
  lavText: "#6d28d9",
  lavSoft: "#ede9fe",
};

const bodyFont = {
  fontFamily: "'Inter', 'Nunito', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

type Palette = { base: string; dark: string; text: string; soft: string };
const P = {
  coral: { base: C.coral, dark: C.coralDark, text: C.coralText, soft: C.coralSoft } as Palette,
  mint: { base: C.mint, dark: C.mintDark, text: C.mintText, soft: C.mintSoft } as Palette,
  sun: { base: C.sun, dark: C.sunDark, text: C.sunText, soft: C.sunSoft } as Palette,
  lav: { base: C.lav, dark: C.lavDark, text: C.lavText, soft: C.lavSoft } as Palette,
};

// Accentkleur + icoon per hoofdscherm — geeft elke tab een eigen vrolijke identiteit.
const SCREEN_THEME: Record<ScreenKey, { pal: Palette; Icon: LucideIcon }> = {
  dashboard: { pal: P.lav, Icon: Sun },
  marktplaats: { pal: P.coral, Icon: Search },
  opdracht: { pal: P.sun, Icon: Star },
  verificatie: { pal: P.mint, Icon: ShieldCheck },
  acties: { pal: P.coral, Icon: Flame },
  facturen: { pal: P.lav, Icon: Wallet },
  documenten: { pal: P.mint, Icon: FileText },
  berichten: { pal: P.sun, Icon: Heart },
};

function credPalette(s: CredStatus): {
  pal: Palette;
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
} {
  switch (s) {
    case "VERIFIED":
      return { pal: P.mint, label: "Geverifieerd", Icon: ShieldCheck, alarm: false };
    case "SUBMITTED":
      return { pal: P.lav, label: "In beoordeling", Icon: Clock, alarm: false };
    case "EXPIRING":
      return { pal: P.sun, label: "Verloopt bijna", Icon: AlertTriangle, alarm: true };
    case "REJECTED":
      return { pal: P.coral, label: "Afgewezen", Icon: X, alarm: true };
  }
}

// — Zacht-3D knop: chunky, met "onderrand" die indrukt bij klik —
function PlayButton({
  children,
  onClick,
  pal = P.lav,
  variant = "solid",
  size = "md",
  className = "",
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  pal?: Palette;
  variant?: "solid" | "soft" | "outline";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}) {
  const pad = size === "sm" ? "px-3.5 py-2 text-[12.5px]" : "px-5 py-2.5 text-[13.5px]";
  const styles: React.CSSProperties =
    variant === "solid"
      ? { background: pal.base, color: "#fff", boxShadow: `0 4px 0 ${pal.dark}` }
      : variant === "soft"
        ? { background: pal.soft, color: pal.text, boxShadow: `0 4px 0 ${pal.base}33` }
        : {
            background: C.card,
            color: C.ink,
            boxShadow: `0 4px 0 ${C.line}`,
            border: `1.5px solid ${C.line}`,
          };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`sk-btn inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition-all duration-100 hover:-translate-y-[1px] hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdf9] ${pad} ${className}`}
      style={{ ...styles, ...bodyFont }}
    >
      {children}
    </button>
  );
}

// — Vrolijke badge (chip) —
function Chip({
  children,
  pal,
  Icon,
}: {
  children: React.ReactNode;
  pal: Palette;
  Icon?: LucideIcon;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ color: pal.text, background: pal.soft, ...bodyFont }}
    >
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  );
}

// — Ronde kaart met dikke radii en zachte schaduw —
function Card({
  children,
  className = "",
  as: Tag = "div",
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
  tone?: string;
}) {
  return (
    <Tag
      className={`rounded-[26px] ${className}`}
      style={{
        background: C.card,
        border: `1.5px solid ${tone ?? C.line}`,
        boxShadow: "0 1px 2px rgba(33,30,43,0.03), 0 12px 30px -18px rgba(33,30,43,0.18)",
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

// — Speelse sparkline met dikke ronde lijn —
function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 88;
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
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="3" fill="#fff" stroke={tone} strokeWidth="2.4" />
    </svg>
  );
}

export function Concept480() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full antialiased"
      style={{
        ...bodyFont,
        color: C.ink,
        backgroundColor: C.bg,
        backgroundImage: [
          "radial-gradient(38% 30% at 88% 4%, rgba(139,92,246,0.10) 0%, rgba(139,92,246,0) 70%)",
          "radial-gradient(34% 26% at 6% 8%, rgba(255,107,107,0.10) 0%, rgba(255,107,107,0) 70%)",
          "radial-gradient(40% 34% at 60% 100%, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0) 70%)",
        ].join(","),
      }}
    >
      <style>{`
        @keyframes skPop { from { opacity: 0; transform: translateY(10px) scale(0.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .sk-pop { animation: skPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
        .sk-btn:active { transform: translateY(3px) !important; box-shadow: none !important; }
        @media (prefers-reduced-motion: reduce) {
          .sk-pop { animation: none !important; }
          .sk-btn { transition: none !important; }
          .sk-btn:hover { transform: none !important; }
          .sk-btn:active { transform: none !important; }
        }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="sk-pop pt-6">
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
    </div>
  );
}

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex items-center justify-between gap-4 py-5">
      <div className="flex items-center gap-3">
        <span
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${C.coral} 0%, ${C.sun} 50%, ${C.lav} 100%)`,
            color: "#fff",
            boxShadow: "0 6px 16px -6px rgba(139,92,246,0.6)",
          }}
          aria-hidden="true"
        >
          <PartyPopper size={20} strokeWidth={2.2} />
        </span>
        <div>
          <p
            className="text-[19px] font-extrabold leading-none tracking-[-0.02em]"
            style={{ color: C.ink }}
          >
            Speelkwartier
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute }}>
            Hoi {PROFIEL.naam.split(" ")[0]}, fijn dat je er bent!
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold sm:inline-flex"
          style={{ color: C.mintText, background: C.mintSoft }}
        >
          <ShieldCheck size={12} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: C.card, border: `1.5px solid ${C.line}`, color: C.inkMute }}
          aria-label={`${ongelezen} nieuwe berichten`}
        >
          <Heart size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.coral, color: "#fff", ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-[12.5px] font-extrabold"
          style={{ background: C.lavSoft, color: C.lavText, ...num }}
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
      <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
        {SCREENS.map((s) => {
          const on = s.key === screen;
          const { pal, Icon } = SCREEN_THEME[s.key];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="sk-btn inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-bold transition-all duration-100 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdf9]"
              style={
                on
                  ? { background: pal.base, color: "#fff", boxShadow: `0 4px 0 ${pal.dark}` }
                  : {
                      background: C.card,
                      color: C.inkSoft,
                      border: `1.5px solid ${C.line}`,
                      boxShadow: `0 4px 0 ${C.lineSoft}`,
                    }
              }
            >
              <Icon size={15} aria-hidden="true" style={{ color: on ? "#fff" : pal.text }} />
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
    <div className="space-y-5">
      {/* Held + next action */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div
          className="relative overflow-hidden rounded-[30px] p-7 md:p-8"
          style={{
            background: `linear-gradient(135deg, ${C.lav} 0%, ${C.lavDark} 100%)`,
            color: "#fff",
            boxShadow: "0 20px 44px -22px rgba(115,56,232,0.7)",
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full"
            style={{ background: "rgba(255,255,255,0.12)" }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-12 right-16 h-24 w-24 rounded-full"
            style={{ background: "rgba(251,191,36,0.28)" }}
          />
          <p
            className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em]"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            <Sparkles size={13} aria-hidden="true" /> Goedemorgen
          </p>
          <h1 className="mt-3 text-[30px] font-extrabold leading-[1.08] tracking-[-0.02em] md:text-[38px]">
            Klaar voor een topdag, {PROFIEL.naam.split(" ")[0]}?
          </h1>
          <p
            className="mt-3 max-w-md text-[14px] leading-relaxed"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            Je certificaten stralen, er liggen verse matches klaar en één klusje wacht nog op je. We
            doen het samen — hup!
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onActies}
              className="sk-btn inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-[13.5px] font-bold transition-all duration-100 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#7338e8]"
              style={{ color: C.lavText, boxShadow: "0 4px 0 rgba(0,0,0,0.15)" }}
            >
              <Rocket size={15} aria-hidden="true" /> Volgende actie
            </button>
            <button
              type="button"
              onClick={onMarkt}
              className="sk-btn inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-[13.5px] font-bold text-white transition-all duration-100 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#7338e8]"
              style={{
                background: "rgba(255,255,255,0.18)",
                boxShadow: "0 4px 0 rgba(0,0,0,0.14)",
              }}
            >
              Naar marktplaats <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>

        <Card className="flex flex-col p-6" tone={C.sunSoft}>
          <div className="flex items-center justify-between">
            <Chip pal={P.sun} Icon={Flame}>
              Vraagt aandacht
            </Chip>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: C.sunSoft, color: C.sunText }}
              aria-hidden="true"
            >
              <AlertTriangle size={16} />
            </span>
          </div>
          <h2 className="mt-3 text-[18px] font-extrabold leading-snug" style={{ color: C.ink }}>
            {primair.titel}
          </h2>
          <p className="mt-2 flex-1 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-4">
            <PlayButton pal={P.sun} onClick={onActies} className="w-full">
              {primair.cta} <ArrowRight size={15} aria-hidden="true" />
            </PlayButton>
          </div>
          <p
            className="mt-4 flex items-center gap-2 border-t pt-3 text-[12px]"
            style={{ color: C.inkMute, borderColor: C.line }}
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full"
              style={{ background: C.mintSoft, color: C.mintText }}
              aria-hidden="true"
            >
              <Check size={12} />
            </span>
            {verified}/{CREDENTIALS.length} certificaten in orde · {ratio}% compleet
          </p>
        </Card>
      </section>

      {/* KPI's als vrolijke tegels */}
      <section>
        <SectionHead pal={P.coral} Icon={TrendingUp}>
          Jouw cijfers deze maand
        </SectionHead>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const pal = [P.coral, P.mint, P.sun, P.lav][i % 4] as Palette;
            return (
              <Card key={k.label} className="p-5" tone={`${pal.base}55`}>
                <div className="flex items-start justify-between">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: pal.soft, color: pal.text }}
                    aria-hidden="true"
                  >
                    <Star size={16} />
                  </span>
                  <span
                    className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                    style={{ color: pal.text, background: pal.soft, ...num }}
                  >
                    <TrendingUp
                      size={11}
                      aria-hidden="true"
                      style={{ transform: k.up ? "none" : "scaleY(-1)" }}
                    />
                    {k.trend.replace(/^\+/, "")}
                  </span>
                </div>
                <p className="mt-3 text-[11px] font-bold" style={{ color: C.inkMute }}>
                  {k.label}
                </p>
                <p
                  className="mt-0.5 text-[26px] font-extrabold leading-none tracking-[-0.01em]"
                  style={{ color: C.ink, ...num }}
                >
                  {k.value}
                </p>
                <div className="mt-2">
                  <Spark data={k.spark} tone={pal.base} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Matches + certificaten */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex items-center justify-between">
            <SectionHead pal={P.coral} Icon={Sparkles}>
              Matches die bij je passen
            </SectionHead>
            <button
              type="button"
              onClick={onMarkt}
              className="rounded-lg text-[12px] font-bold transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b6b]"
              style={{ color: C.coralText }}
            >
              Alles →
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <li key={o.id}>
                <OpdrachtRow opdracht={o} onOpen={onOpen} />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <SectionHead pal={P.mint} Icon={ShieldCheck}>
            Jouw certificaten
          </SectionHead>
          <Card className="p-4">
            <ul>
              {CREDENTIALS.map((c, i) => {
                const cp = credPalette(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 px-1 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: cp.pal.soft, color: cp.pal.text }}
                      aria-hidden="true"
                    >
                      <cp.Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13px] font-bold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="block truncate text-[11px]"
                        style={{ color: cp.alarm ? cp.pal.text : C.inkMute }}
                      >
                        {cp.label}
                      </span>
                    </span>
                    {cp.alarm && (
                      <AlertTriangle size={15} aria-hidden="true" style={{ color: cp.pal.text }} />
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Streak-achtig speels blokje */}
          <div
            className="mt-4 flex items-center gap-3 rounded-[22px] p-4"
            style={{ background: C.coralSoft }}
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ background: C.coral, color: "#fff" }}
              aria-hidden="true"
            >
              <Flame size={20} />
            </span>
            <div>
              <p className="text-[13px] font-extrabold" style={{ color: C.coralText }}>
                7 dagen actief op rij! 🔥
              </p>
              <p className="text-[11.5px]" style={{ color: C.inkSoft }}>
                Blijf zichtbaar — dat levert de beste matches op.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHead({
  children,
  pal,
  Icon,
}: {
  children: React.ReactNode;
  pal: Palette;
  Icon: LucideIcon;
}) {
  return (
    <h2
      className="mb-3 flex items-center gap-2 text-[13px] font-extrabold tracking-[-0.01em]"
      style={{ color: C.ink }}
    >
      <span
        className="flex h-6 w-6 items-center justify-center rounded-lg"
        style={{ background: pal.soft, color: pal.text }}
        aria-hidden="true"
      >
        <Icon size={13} />
      </span>
      {children}
    </h2>
  );
}

function OpdrachtRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const strong = opdracht.match >= 90;
  const pal = strong ? P.mint : P.lav;
  return (
    <Card as="article" className="overflow-hidden">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[#fffbf5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8b5cf6]"
      >
        <MatchRing value={opdracht.match} pal={pal} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-extrabold" style={{ color: C.ink }}>
            {opdracht.titel}
          </span>
          <span
            className="mt-0.5 flex items-center gap-1 truncate text-[12px]"
            style={{ color: C.inkMute }}
          >
            <MapPin size={12} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </span>
          <span
            className="mt-1.5 flex items-center gap-1.5 text-[11.5px] font-bold"
            style={{ color: C.mintText }}
          >
            <Check size={13} aria-hidden="true" /> {opdracht.redenen.plus[0]}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-2">
          <span className="text-[13px] font-extrabold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <ChevronRight size={18} aria-hidden="true" style={{ color: C.inkFaint }} />
        </span>
      </button>
    </Card>
  );
}

// — Ronde match-ring (SVG donut) — speels én informatief —
function MatchRing({ value, pal, size = 48 }: { value: number; pal: Palette; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={pal.soft} strokeWidth="4.5" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={pal.base}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="absolute text-[12px] font-extrabold" style={{ color: pal.text, ...num }}>
        {value}
      </span>
    </span>
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
    <div className="space-y-5">
      <div>
        <SectionHead pal={P.coral} Icon={Search}>
          Marktplaats
        </SectionHead>
        <h1
          className="text-[28px] font-extrabold leading-tight tracking-[-0.02em]"
          style={{ color: C.ink }}
        >
          Opdrachten die bij jou passen 🎯
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: C.inkMute }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten stralen op jouw profiel
        </p>
      </div>

      {/* Zoek + sorteer */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-2xl px-4 py-3"
          style={{ background: C.card, border: `1.5px solid ${C.line}` }}
        >
          <Search size={17} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#a8a2b2]"
            style={{ color: C.ink, ...bodyFont }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-[#f6f1ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b6b]"
              style={{ color: C.inkMute }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <PlayButton
              key={s}
              size="sm"
              variant={sort === s ? "solid" : "outline"}
              pal={P.coral}
              onClick={() => setSort(s)}
            >
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </PlayButton>
          ))}
        </div>
      </div>

      {/* States */}
      {mode === "loading" ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Card className="p-5">
                <div className="flex items-center gap-4">
                  <div
                    className="h-12 w-12 shrink-0 animate-pulse rounded-full motion-reduce:animate-none"
                    style={{ background: C.lineSoft }}
                  />
                  <div className="flex-1 space-y-2.5">
                    <div
                      className="h-4 w-2/3 animate-pulse rounded-full motion-reduce:animate-none"
                      style={{ background: C.lineSoft }}
                    />
                    <div
                      className="h-3 w-1/2 animate-pulse rounded-full motion-reduce:animate-none"
                      style={{ background: C.lineSoft }}
                    />
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          pal={P.coral}
          Icon={AlertTriangle}
          titel="Oeps, er ging iets mis"
          tekst="We konden de opdrachten even niet ophalen. Adem in, adem uit, en probeer het opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : filtered.length === 0 ? (
        <StateBlock
          pal={P.lav}
          Icon={Search}
          titel="Nog niets gevonden"
          tekst={`Geen opdracht voor ${q ? `“${q}”` : "je zoekterm"}. Probeer een ander woord — er komt vast iets leuks langs!`}
          cta="Zoekterm wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}

      {/* Demo-schakelaars voor de andere states (aantoonbaar aanwezig) */}
      <div className="flex items-center justify-center gap-4 pt-1">
        {(["loading", "error"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(mode === m ? "ok" : m)}
            className="rounded text-[11px] font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b6b]"
            style={{ color: C.inkFaint }}
          >
            {m === "loading" ? "Laadstaat tonen" : "Foutstaat tonen"}
          </button>
        ))}
      </div>
    </div>
  );
}

function StateBlock({
  pal,
  Icon,
  titel,
  tekst,
  cta,
  onCta,
}: {
  pal: Palette;
  Icon: LucideIcon;
  titel: string;
  tekst: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <Card className="flex flex-col items-center px-6 py-14 text-center">
      <span
        className="flex h-16 w-16 items-center justify-center rounded-3xl"
        style={{ background: pal.soft, color: pal.text }}
        aria-hidden="true"
      >
        <Icon size={28} />
      </span>
      <p className="mt-5 text-[20px] font-extrabold" style={{ color: C.ink }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
        {tekst}
      </p>
      <PlayButton pal={pal} onClick={onCta} className="mt-6">
        {cta} <ArrowRight size={15} aria-hidden="true" />
      </PlayButton>
    </Card>
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
  const pal = strong ? P.mint : P.lav;
  return (
    <Card as="article" className="p-5">
      <div className="flex items-start gap-4">
        <MatchRing value={opdracht.match} pal={pal} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Chip pal={pal} Icon={strong ? Award : Star}>
              {strong ? "Sterke match" : "Goede match"}
            </Chip>
            <span className="text-[11px] font-bold" style={{ color: C.inkFaint, ...num }}>
              #{String(index + 1).padStart(2, "0")} · {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[17px] font-extrabold leading-snug" style={{ color: C.ink }}>
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{ background: C.bgWarm, color: C.inkSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="shrink-0 text-[15px] font-extrabold" style={{ color: C.ink, ...num }}>
          {opdracht.tarief.replace(" / uur", "")}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-[12px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
          style={{ color: C.lavText, background: C.lavSoft }}
        >
          {open ? <X size={13} aria-hidden="true" /> : <Sparkles size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <PlayButton pal={strong ? P.mint : P.lav} onClick={onOpen}>
            Reageer <ArrowRight size={14} aria-hidden="true" />
          </PlayButton>
        </div>
      </div>

      <div
        className="duration-400 grid transition-all motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="In jouw voordeel"
              pal={P.mint}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Goed om te weten"
              pal={P.sun}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function RedenBlok({
  titel,
  pal,
  Icon,
  items,
}: {
  titel: string;
  pal: Palette;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div className="rounded-[20px] p-4" style={{ background: pal.soft }}>
      <p
        className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em]"
        style={{ color: pal.text }}
      >
        <Icon size={13} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[13px]" style={{ color: C.inkSoft }}>
            <span
              className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
              style={{ background: pal.base, color: "#fff" }}
              aria-hidden="true"
            >
              <Icon size={10} />
            </span>
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
  const pal = strong ? P.mint : P.lav;
  return (
    <div className="space-y-5">
      <PlayButton variant="outline" size="sm" onClick={onBack}>
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </PlayButton>

      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-[30px] p-7 md:p-8"
        style={{
          background: `linear-gradient(135deg, ${pal.base} 0%, ${pal.dark} 100%)`,
          color: "#fff",
          boxShadow: `0 20px 44px -22px ${pal.base}`,
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full"
          style={{ background: "rgba(255,255,255,0.14)" }}
        />
        <div className="relative flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
            style={{ background: "rgba(255,255,255,0.22)", ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
            style={{ background: "rgba(255,255,255,0.22)" }}
          >
            <Award size={12} aria-hidden="true" /> {strong ? "Sterke match" : "Goede match"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h1 className="relative mt-4 max-w-2xl text-[27px] font-extrabold leading-[1.1] tracking-[-0.02em] md:text-[34px]">
          {opdracht.titel}
        </h1>
        <p
          className="relative mt-2 flex items-center gap-1.5 text-[13.5px]"
          style={{ color: "rgba(255,255,255,0.92)" }}
        >
          <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="relative mt-6 flex flex-wrap gap-2.5">
          <button
            type="button"
            className="sk-btn inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-[13.5px] font-bold transition-all duration-100 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
            style={{ color: pal.text, boxShadow: "0 4px 0 rgba(0,0,0,0.15)" }}
          >
            <Heart size={15} aria-hidden="true" /> Reageer op opdracht
          </button>
          <button
            type="button"
            className="sk-btn inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-[13.5px] font-bold text-white transition-all duration-100 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
            style={{ background: "rgba(255,255,255,0.18)", boxShadow: "0 4px 0 rgba(0,0,0,0.14)" }}
          >
            Bewaren
          </button>
        </div>
      </div>

      {/* Feiten-tegels */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, p: P.mint, Icon: Wallet },
          { l: "Omvang", v: opdracht.uren, p: P.lav, Icon: Clock },
          { l: "Start", v: opdracht.start, p: P.sun, Icon: Sun },
          { l: "Match", v: `${opdracht.match}%`, p: P.coral, Icon: Sparkles },
        ].map((m) => (
          <Card key={m.l} className="p-5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: m.p.soft, color: m.p.text }}
              aria-hidden="true"
            >
              <m.Icon size={16} />
            </span>
            <p
              className="mt-3 text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute }}
            >
              {m.l}
            </p>
            <p
              className="mt-1 text-[18px] font-extrabold tracking-[-0.01em]"
              style={{ color: C.ink, ...num }}
            >
              {m.v}
            </p>
          </Card>
        ))}
      </div>

      {/* Verklaarbare match */}
      <section>
        <SectionHead pal={P.sun} Icon={Sparkles}>
          Waarom deze match bij je past
        </SectionHead>
        <p className="mb-4 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgezet tegen je geverifieerde profiel — open en eerlijk, zonder verborgen score. Wat in
          je voordeel spreekt én wat handig is om te weten.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-6">
            <p
              className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.08em]"
              style={{ color: C.mintText }}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-lg"
                style={{ background: C.mintSoft }}
                aria-hidden="true"
              >
                <Check size={13} />
              </span>
              In jouw voordeel
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.mint, color: "#fff" }}
                    aria-hidden="true"
                  >
                    <Check size={12} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-6">
            <p
              className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.08em]"
              style={{ color: C.sunText }}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-lg"
                style={{ background: C.sunSoft }}
                aria-hidden="true"
              >
                <AlertTriangle size={13} />
              </span>
              Goed om te weten
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.sun, color: "#fff" }}
                    aria-hidden="true"
                  >
                    <AlertTriangle size={12} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div
          className="mt-4 flex items-center gap-2 rounded-[20px] p-4"
          style={{ background: pal.soft }}
        >
          <PartyPopper size={17} aria-hidden="true" style={{ color: pal.text }} />
          <p className="text-[12.5px] font-bold" style={{ color: pal.text }}>
            Match {opdracht.match}% —{" "}
            {strong ? "dit is echt jouw opdracht!" : "een fijne kans die goed aansluit."}
          </p>
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
    <div className="space-y-5">
      {/* Vertrouwens-hero */}
      <div
        className="relative overflow-hidden rounded-[30px] p-7 md:p-8"
        style={{
          background: `linear-gradient(135deg, ${C.mint} 0%, ${C.mintDark} 100%)`,
          color: "#fff",
          boxShadow: "0 20px 44px -22px rgba(34,197,94,0.7)",
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full"
          style={{ background: "rgba(255,255,255,0.14)" }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <p
              className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em]"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> Vertrouwensniveau
            </p>
            <h1 className="mt-2 text-[26px] font-extrabold leading-tight tracking-[-0.02em]">
              {PROFIEL.trust} 🎉
            </h1>
            <p
              className="mt-2 text-[14px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.92)" }}
            >
              {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              bijna — dat pakken we samen op tijd op. Je documenten blijven veilig en privé.
            </p>
          </div>
          <span
            className="flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{ background: "rgba(255,255,255,0.2)" }}
            aria-hidden="true"
          >
            <span className="text-[30px] font-extrabold leading-none" style={{ ...num }}>
              {ratio}
            </span>
            <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em]">
              % in orde
            </span>
          </span>
        </div>
        <div
          className="relative mt-5 h-2.5 w-full overflow-hidden rounded-full"
          style={{ background: "rgba(255,255,255,0.25)" }}
          aria-hidden="true"
        >
          <span
            className="block h-full rounded-full"
            style={{
              width: `${ratio}%`,
              background: "#fff",
              transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        </div>
      </div>

      {/* Certificaten-accordeon */}
      <div>
        <SectionHead pal={P.mint} Icon={Award}>
          Jouw certificaten
        </SectionHead>
        <Card className="overflow-hidden">
          <ul>
            {CREDENTIALS.map((c, i) => {
              const cp = credPalette(c.status);
              const isOpen = open === c.naam;
              return (
                <li
                  key={c.naam}
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#fffbf5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#22c55e]"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                      style={{ background: cp.pal.soft, color: cp.pal.text }}
                      aria-hidden="true"
                    >
                      <cp.Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14.5px] font-extrabold"
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
                    <span className="flex items-center gap-3">
                      <span className="hidden sm:inline-flex">
                        <Chip pal={cp.pal} Icon={cp.Icon}>
                          {cp.label}
                          {cp.alarm && <span className="sr-only"> (let op)</span>}
                        </Chip>
                      </span>
                      <ChevronRight
                        size={18}
                        aria-hidden="true"
                        className="transition-transform motion-reduce:transition-none"
                        style={{ color: C.inkFaint, transform: isOpen ? "rotate(90deg)" : "none" }}
                      />
                    </span>
                  </button>
                  <div
                    className="duration-400 grid transition-all motion-reduce:transition-none"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 pb-4 sm:pl-[76px]">
                        <div
                          className="rounded-[20px] p-4"
                          style={{ background: C.bgWarm, border: `1px solid ${C.line}` }}
                        >
                          <p
                            className="max-w-xl text-[13px] leading-relaxed"
                            style={{ color: C.inkSoft }}
                          >
                            {c.detail}. Je document wordt versleuteld bewaard en alleen na jouw
                            toestemming gedeeld met een opdrachtgever.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <PlayButton
                              size="sm"
                              pal={
                                c.status === "EXPIRING"
                                  ? P.sun
                                  : c.status === "REJECTED"
                                    ? P.coral
                                    : P.mint
                              }
                            >
                              {c.status === "EXPIRING"
                                ? "Vernieuwen"
                                : c.status === "REJECTED"
                                  ? "Opnieuw indienen"
                                  : "Bekijken"}
                            </PlayButton>
                            <PlayButton size="sm" variant="outline">
                              Historie
                            </PlayButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* Documentenkast */}
      <div>
        <SectionHead pal={P.lav} Icon={FileText}>
          Documentenkast
        </SectionHead>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const cp = credPalette(d.status);
            return (
              <Card key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: C.bgWarm, color: C.inkSoft }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold" style={{ color: C.ink }}>
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <Chip pal={cp.pal} Icon={cp.Icon}>
                  {cp.label}
                </Chip>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// —————————————————————————————————— Acties ——————————————————————————————————
function Acties({ onMarkt }: { onMarkt: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <SectionHead pal={P.coral} Icon={Flame}>
          Acties · op volgorde van urgentie
        </SectionHead>
        <h1
          className="text-[28px] font-extrabold leading-tight tracking-[-0.02em]"
          style={{ color: C.ink }}
        >
          Wat vandaag je aandacht vraagt ✨
        </h1>
        <p className="mt-1 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Van boven naar beneden afvinken — één ding tegelijk, dan ben je zo weer bij!
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const pal = warn ? P.coral : P.lav;
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li key={a.titel}>
              <Card className="p-5">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-[15px] font-extrabold"
                    style={{ background: pal.soft, color: pal.text, ...num }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <Chip pal={pal} Icon={warn ? AlertTriangle : Rocket}>
                      {warn ? "Urgent" : "Aanbevolen"}
                    </Chip>
                    <h2
                      className="mt-2 text-[17px] font-extrabold leading-snug"
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
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <PlayButton pal={pal} onClick={goMarkt ? onMarkt : undefined}>
                      {a.cta} <ArrowRight size={14} aria-hidden="true" />
                    </PlayButton>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>

      <div
        className="flex items-center gap-3 rounded-[22px] p-5"
        style={{ background: C.mintSoft }}
      >
        <span
          className="flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{ background: C.mint, color: "#fff" }}
          aria-hidden="true"
        >
          <PartyPopper size={20} />
        </span>
        <div>
          <p className="text-[14px] font-extrabold" style={{ color: C.mintText }}>
            Nog {ACTIES.length} klusjes en je bent helemaal bij!
          </p>
          <p className="text-[12px]" style={{ color: C.inkSoft }}>
            Elke afgeronde actie maakt je profiel sterker en zichtbaarder.
          </p>
        </div>
      </div>
    </div>
  );
}

// —————————————————————————————————— Facturen ——————————————————————————————————
function factuurPalette(status: string): Palette {
  if (status === "Betaald") return P.mint;
  if (status === "Openstaand") return P.coral;
  return P.lav;
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionHead pal={P.lav} Icon={Wallet}>
            Facturen
          </SectionHead>
          <h1
            className="text-[28px] font-extrabold leading-tight tracking-[-0.02em]"
            style={{ color: C.ink }}
          >
            Jouw facturen 💸
          </h1>
        </div>
        <PlayButton pal={P.lav}>
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </PlayButton>
      </div>

      {/* Samenvattingstegels */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 5.552", sub: "2 facturen", p: P.mint, Icon: Check },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", p: P.coral, Icon: Clock },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", p: P.lav, Icon: FileText },
        ].map((s) => (
          <Card key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: s.p.soft, color: s.p.text }}
                aria-hidden="true"
              >
                <s.Icon size={16} />
              </span>
              <Chip pal={s.p}>{s.l}</Chip>
            </div>
            <p
              className="mt-3 text-[24px] font-extrabold tracking-[-0.01em]"
              style={{ color: C.ink, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-0.5 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Card>
        ))}
      </section>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <PlayButton
            key={s}
            size="sm"
            variant={sort === s ? "solid" : "outline"}
            pal={P.lav}
            onClick={() => setSort(s)}
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </PlayButton>
        ))}
      </div>

      {/* Facturenlijst als kaarten */}
      <ul className="space-y-3">
        {rows.map((f) => {
          const pal = factuurPalette(f.status);
          return (
            <li key={f.nr}>
              <Card className="flex items-center gap-4 p-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: pal.soft, color: pal.text }}
                  aria-hidden="true"
                >
                  <Wallet size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[14.5px] font-extrabold"
                    style={{ color: C.ink }}
                  >
                    {f.klant}
                  </span>
                  <span className="block text-[11px]" style={{ color: C.inkMute, ...num }}>
                    {f.nr} · {f.datum}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-[15px] font-extrabold" style={{ color: C.ink, ...num }}>
                    {f.bedrag}
                  </span>
                  <Chip pal={pal}>{f.status}</Chip>
                </span>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
