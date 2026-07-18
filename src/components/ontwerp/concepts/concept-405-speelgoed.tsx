"use client";

// Concept 405 — "Speelgoed" · Soft-3D speels, consumer-dopamine (Family/Arc-niveau).
// Vrolijk maar strak: mollige zacht-3D vormen, ronde kaarten met zachte kleurschaduwen,
// dikke afgeronde knoppen, subtiele "spring"-hover. Toegankelijk en professioneel, nooit
// kinderachtig. Palet: bg #f6f1fb, fg #241a2e, accent magenta-roze #ff5da2 met violet/mint/
// amber accenten. Fonts: Plus Jakarta Sans + Space Grotesk-gevoel.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Heart,
  Bell,
  Zap,
  Star,
  Rocket,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: vrolijk-consumer, zacht-3D —
const C = {
  bg: "#f6f1fb",
  bgAlt: "#efe7f7",
  surface: "#ffffff",
  fg: "#241a2e",
  fgSoft: "#5b4d68",
  fgMute: "#8a7d96",
  line: "rgba(36,26,46,0.08)",
  lineSoft: "rgba(36,26,46,0.05)",
  accent: "#ff5da2",
  accentDark: "#e23f86",
  accentSoft: "#ffe3ef",
  violet: "#7c6bf5",
  violetDark: "#5f4de0",
  violetSoft: "#ece9fe",
  mint: "#2fc7a0",
  mintDark: "#159d7c",
  mintSoft: "#dcf7ef",
  amber: "#f7a83c",
  amberDark: "#d9861a",
  amberSoft: "#fdefd6",
  sky: "#3aa8f0",
  skySoft: "#dcefff",
  ok: "#2fc7a0",
  okInk: "#0f7a5f",
  okSoft: "#dcf7ef",
  warn: "#f7a83c",
  warnInk: "#b5720f",
  warnSoft: "#fdefd6",
  info: "#7c6bf5",
  infoInk: "#5340c4",
  infoSoft: "#ece9fe",
  bad: "#ff6b6b",
  badInk: "#c73b3b",
  badSoft: "#ffe2e2",
};

const display = {
  fontFamily:
    "'Space Grotesk', 'Plus Jakarta Sans', ui-rounded, 'SF Pro Rounded', system-ui, sans-serif",
};
const body = {
  fontFamily: "'Plus Jakarta Sans', ui-rounded, 'SF Pro Rounded', system-ui, sans-serif",
};
const num = {
  fontFamily: "'Space Grotesk', ui-monospace, SFMono-Regular, Menlo, monospace",
};

// zacht-3D schaduw met kleuraccent
function puff(tone: string, lift = 1): string {
  const y1 = 6 * lift;
  const y2 = 18 * lift;
  return `0 1px 0 rgba(255,255,255,0.9) inset, 0 ${y1}px ${y1 * 2}px -${y1}px ${tone}, 0 ${y2}px ${y2 * 1.6}px -${y2 * 0.7}px rgba(36,26,46,0.16)`;
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  ink: string;
  soft: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        tone: C.ok,
        ink: C.okInk,
        soft: C.okSoft,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        tone: C.info,
        ink: C.infoInk,
        soft: C.infoSoft,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.warn,
        ink: C.warnInk,
        soft: C.warnSoft,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.bad,
        ink: C.badInk,
        soft: C.badSoft,
      };
  }
}

// — Mollige kaart met zachte kleurschaduw —
function Blob({
  children,
  className = "",
  tone = "rgba(124,107,245,0.14)",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  return (
    <Tag
      className={`relative rounded-[26px] ${className}`}
      style={{
        background: C.surface,
        border: `1px solid ${C.line}`,
        boxShadow: puff(tone),
      }}
    >
      {children}
    </Tag>
  );
}

// — Dikke afgeronde primaire knop met spring-hover —
function ChunkyButton({
  children,
  onClick,
  className = "",
  tone = C.accent,
  toneDark = C.accentDark,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  tone?: string;
  toneDark?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[14px] font-bold text-white transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#241a2e]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f1fb] active:translate-y-0 motion-reduce:transition-none ${className}`}
      style={{
        background: `linear-gradient(180deg, ${tone}, ${toneDark})`,
        boxShadow: `0 1px 0 rgba(255,255,255,0.4) inset, 0 6px 0 ${toneDark}, 0 12px 22px -6px ${tone}`,
        ...display,
      }}
    >
      {children}
    </button>
  );
}

function SoftButton({
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
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-bold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7c6bf5]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f1fb] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? "#fff" : C.fgSoft,
        background: active ? `linear-gradient(180deg, ${C.violet}, ${C.violetDark})` : C.surface,
        border: `1px solid ${active ? "transparent" : C.line}`,
        boxShadow: active
          ? `0 4px 0 ${C.violetDark}, 0 10px 18px -6px ${C.violet}`
          : puff(C.lineSoft, 0.5),
        ...display,
      }}
    >
      {children}
    </button>
  );
}

function Chip({
  children,
  tone,
  ink,
  soft,
}: {
  children: React.ReactNode;
  tone: string;
  ink: string;
  soft: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold"
      style={{ color: ink, background: soft, border: `1.5px solid ${tone}55`, ...body }}
    >
      {children}
    </span>
  );
}

function Eyebrow({ children, tone = C.accentDark }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-[0.14em]"
      style={{ color: tone, ...display }}
    >
      <Sparkles size={13} aria-hidden="true" />
      {children}
    </p>
  );
}

// — Bolle sparkline met eind-node —
function Bubbleline({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 34;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 8) - 4;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1]!;
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`bl-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.28" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#bl-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="4" fill="#fff" stroke={tone} strokeWidth="2.6" />
    </svg>
  );
}

function MatchDonut({ value, tone }: { value: number; tone: string }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <span className="relative inline-flex h-14 w-14 items-center justify-center">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90" aria-hidden="true">
        <circle cx="28" cy="28" r={r} fill="none" stroke={C.bgAlt} strokeWidth="7" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <span
        className="absolute text-[14px] font-extrabold tabular-nums"
        style={{ color: tone, ...num }}
      >
        {value}
      </span>
    </span>
  );
}

export function Concept405() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{
        ...body,
        color: C.fg,
        background: `radial-gradient(120% 80% at 15% -5%, ${C.violetSoft}, transparent 55%), radial-gradient(120% 80% at 100% 0%, ${C.accentSoft}, transparent 50%), ${C.bg}`,
      }}
    >
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pt-6">
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
    <header className="flex items-center justify-between gap-4 pt-7">
      <div className="flex items-center gap-3.5">
        <span
          className="inline-flex h-12 w-12 items-center justify-center rounded-[18px] text-white"
          style={{
            background: `linear-gradient(150deg, ${C.accent}, ${C.violet})`,
            boxShadow: puff("rgba(124,107,245,0.4)"),
          }}
          aria-hidden="true"
        >
          <Rocket size={22} />
        </span>
        <div>
          <p
            className="text-[20px] font-extrabold leading-none"
            style={{ color: C.fg, ...display }}
          >
            Speelgoed
          </p>
          <p
            className="mt-1.5 text-[11.5px] font-semibold leading-none"
            style={{ color: C.fgMute }}
          >
            Werkplezier voor {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-bold sm:inline-flex"
          style={{ color: C.okInk, background: C.okSoft, border: `1.5px solid ${C.ok}55`, ...body }}
        >
          <ShieldCheck size={13} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-[16px]"
          style={{
            background: C.surface,
            border: `1px solid ${C.line}`,
            color: C.fgSoft,
            boxShadow: puff(C.lineSoft, 0.5),
          }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={17} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold text-white"
              style={{ background: C.accent, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] text-[13px] font-extrabold text-white"
          style={{ background: `linear-gradient(150deg, ${C.violet}, ${C.mint})`, ...display }}
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
    <nav aria-label="Hoofdnavigatie" className="mt-6">
      <div
        className="flex items-center gap-1.5 overflow-x-auto rounded-full p-1.5"
        style={{
          background: C.surface,
          border: `1px solid ${C.line}`,
          boxShadow: puff(C.lineSoft, 0.6),
        }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-full px-4 py-2.5 text-[13px] font-bold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ff5da2]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f1fb] motion-reduce:transition-none"
              style={{
                color: on ? "#fff" : C.fgSoft,
                background: on
                  ? `linear-gradient(180deg, ${C.accent}, ${C.accentDark})`
                  : "transparent",
                boxShadow: on ? `0 4px 0 ${C.accentDark}, 0 10px 18px -6px ${C.accent}` : "none",
                ...display,
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
  const kpiTones = [C.accent, C.violet, C.mint, C.amber];
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Blob className="overflow-hidden p-6 md:p-8" tone="rgba(255,93,162,0.22)">
          <span
            className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full opacity-40"
            style={{ background: `radial-gradient(circle, ${C.accentSoft}, transparent 70%)` }}
            aria-hidden="true"
          />
          <Eyebrow>Fijne dag, {PROFIEL.naam.split(" ")[0]}</Eyebrow>
          <h1
            className="mt-3 text-[30px] font-extrabold leading-[1.05] tracking-[-0.02em] md:text-[40px]"
            style={{ color: C.fg, ...display }}
          >
            Alles staat
            <br />
            klaar om te
            <span
              className="ml-2 inline-block rounded-2xl px-2.5 py-0.5 text-white"
              style={{ background: `linear-gradient(150deg, ${C.accent}, ${C.violet})` }}
            >
              stralen.
            </span>
          </h1>
          <p
            className="mt-4 max-w-md text-[14px] font-medium leading-relaxed"
            style={{ color: C.fgSoft }}
          >
            Je profiel is fris, je matches zijn warm en je facturen lopen op rolletjes. Pak de
            volgende stap wanneer jij er zin in hebt.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ChunkyButton onClick={onActies}>
              Volgende stap
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </ChunkyButton>
            <SoftButton onClick={onOpen}>Bekijk matches</SoftButton>
          </div>
        </Blob>

        <Blob className="flex flex-col p-6" tone="rgba(247,168,60,0.24)">
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.warnInk}>Even doen</Eyebrow>
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-[13px]"
              style={{ background: C.warnSoft, color: C.warnInk }}
              aria-hidden="true"
            >
              <Zap size={17} />
            </span>
          </div>
          <h2
            className="mt-4 text-[19px] font-extrabold leading-snug"
            style={{ color: C.fg, ...display }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13.5px] font-medium leading-relaxed" style={{ color: C.fgSoft }}>
            {primair.detail}
          </p>
          <div className="mt-auto pt-5">
            <ChunkyButton
              onClick={onActies}
              className="w-full"
              tone={C.amber}
              toneDark={C.amberDark}
            >
              {primair.cta}
              <ArrowRight size={15} aria-hidden="true" />
            </ChunkyButton>
            <p className="mt-3 text-center text-[12px] font-semibold" style={{ color: C.fgMute }}>
              {verified}/{CREDENTIALS.length} certificaten geverifieerd · 7 open reacties
            </p>
          </div>
        </Blob>
      </section>

      <section>
        <div className="mb-3">
          <Eyebrow tone={C.violetDark}>Jouw cijfers deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = kpiTones[i % kpiTones.length]!;
            return (
              <Blob key={k.label} className="p-5" tone={`${tone}33`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] font-bold" style={{ color: C.fgMute, ...body }}>
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-extrabold tabular-nums"
                    style={{
                      color: k.up ? C.okInk : C.warnInk,
                      background: k.up ? C.okSoft : C.warnSoft,
                      ...num,
                    }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend.replace(/^\+/, "")}
                  </span>
                </div>
                <p
                  className="mt-2 text-[28px] font-extrabold tabular-nums leading-none tracking-[-0.02em]"
                  style={{ color: C.fg, ...display }}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <Bubbleline data={k.spark} tone={tone} id={`kpi-${i}`} />
                </div>
              </Blob>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow>Matches voor jou</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="rounded-full text-[12px] font-extrabold transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ff5da2]/30"
              style={{ color: C.accentDark, ...display }}
            >
              Alles zien →
            </button>
          </div>
          <div className="space-y-3">
            {OPDRACHTEN.map((o, i) => {
              const tone = o.match >= 90 ? C.accent : o.match >= 85 ? C.violet : C.sky;
              return (
                <Blob key={o.id} tone={`${tone}2e`}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[26px] p-4 text-left transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7c6bf5]/25 motion-reduce:transition-none"
                  >
                    <MatchDonut value={o.match} tone={tone} />
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-extrabold"
                        style={{ color: C.fg, ...display }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12.5px] font-medium"
                        style={{ color: C.fgMute }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        {o.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                            style={{ color: C.fgSoft, background: C.bgAlt, ...body }}
                          >
                            {t}
                          </span>
                        ))}
                      </span>
                    </span>
                    <ChevronRight
                      size={20}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                      style={{ color: tone }}
                    />
                    {i === 0 && <span className="sr-only">Beste match</span>}
                  </button>
                </Blob>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-3">
            <Eyebrow tone={C.mintDark}>Certificaten</Eyebrow>
          </div>
          <Blob className="p-4" tone="rgba(47,199,160,0.22)">
            <ul className="space-y-1.5">
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 rounded-[16px] px-2 py-2.5"
                    style={{ background: i % 2 === 0 ? C.bgAlt : "transparent" }}
                  >
                    <span
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px]"
                      style={{ color: st.ink, background: st.soft }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13px] font-bold"
                        style={{ color: C.fg }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="block truncate text-[11.5px] font-semibold"
                        style={{ color: st.ink }}
                      >
                        {st.label}
                        {st.alarm && <span className="sr-only"> (let op)</span>}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Blob>
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
        <h1
          className="mt-3 text-[30px] font-extrabold leading-none tracking-[-0.02em]"
          style={{ color: C.fg, ...display }}
        >
          Vind je volgende klus
        </h1>
        <p className="mt-2 text-[13.5px] font-semibold" style={{ color: C.fgMute }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten passen bij jou
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-4 py-3"
          style={{
            background: C.surface,
            border: `1px solid ${C.line}`,
            boxShadow: puff(C.lineSoft, 0.5),
          }}
        >
          <Search size={17} aria-hidden="true" style={{ color: C.fgMute }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] font-medium outline-none placeholder:text-[#8a7d96]"
            style={{ color: C.fg, ...body }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <SoftButton
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </SoftButton>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Blob className="p-0" tone="rgba(124,107,245,0.18)">
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span
              className="inline-flex h-20 w-20 items-center justify-center rounded-[26px]"
              style={{
                background: C.violetSoft,
                color: C.violet,
                boxShadow: puff("rgba(124,107,245,0.3)"),
              }}
              aria-hidden="true"
            >
              <Heart size={32} />
            </span>
            <p className="mt-5 text-[20px] font-extrabold" style={{ color: C.fg, ...display }}>
              Nog even geduld
            </p>
            <p
              className="mx-auto mt-2 max-w-xs text-[13.5px] font-medium"
              style={{ color: C.fgSoft }}
            >
              Geen opdracht past bij {q ? `“${q}”` : "je zoekterm"}. Wis de zoekterm om alle matches
              weer te zien.
            </p>
            <div className="mt-6">
              <ChunkyButton onClick={() => setQ("")} tone={C.violet} toneDark={C.violetDark}>
                Toon alles <ArrowRight size={15} aria-hidden="true" />
              </ChunkyButton>
            </div>
          </div>
        </Blob>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MarktKaart({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  const tone = strong ? C.accent : opdracht.match >= 85 ? C.violet : C.sky;
  const toneDark = strong ? C.accentDark : opdracht.match >= 85 ? C.violetDark : "#2b86c4";
  const soft = strong ? C.accentSoft : opdracht.match >= 85 ? C.violetSoft : C.skySoft;
  return (
    <Blob className="p-5" tone={`${tone}2e`}>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={tone} ink={toneDark} soft={soft}>
              <Star size={11} aria-hidden="true" /> {opdracht.match}% match
            </Chip>
            <span className="text-[12px] font-bold" style={{ color: C.fgMute, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2.5 text-[18px] font-extrabold leading-snug"
            style={{ color: C.fg, ...display }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[13px] font-semibold" style={{ color: C.fgMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold"
                style={{ color: C.fgSoft, background: C.bgAlt, ...body }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <MatchDonut value={opdracht.match} tone={tone} />
          <span
            className="text-[14px] font-extrabold tabular-nums"
            style={{ color: toneDark, ...num }}
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
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-bold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7c6bf5]/25 motion-reduce:transition-none"
          style={{ color: C.fgSoft, background: C.bgAlt, ...display }}
        >
          <Sparkles size={13} aria-hidden="true" />
          {open ? "Verberg waarom" : "Waarom deze?"}
        </button>
        <div className="ml-auto">
          <ChunkyButton onClick={onOpen}>
            Reageer <ArrowRight size={14} aria-hidden="true" />
          </ChunkyButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="Sterk punt"
              tone={C.okInk}
              soft={C.okSoft}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Let op"
              tone={C.warnInk}
              soft={C.warnSoft}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Blob>
  );
}

function RedenBlok({
  titel,
  tone,
  soft,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  soft: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div className="rounded-[20px] p-4" style={{ background: soft }}>
      <p
        className="flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-[0.1em]"
        style={{ color: tone, ...display }}
      >
        <Icon size={13} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2 text-[13px] font-medium"
            style={{ color: C.fgSoft }}
          >
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
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

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  const tone = strong ? C.accent : C.violet;
  const toneDark = strong ? C.accentDark : C.violetDark;
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-bold transition-all hover:-translate-x-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7c6bf5]/25 motion-reduce:transition-none"
        style={{
          color: C.fgSoft,
          background: C.surface,
          border: `1px solid ${C.line}`,
          ...display,
        }}
      >
        <ArrowLeft size={15} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Blob className="overflow-hidden p-6 md:p-8" tone={`${tone}30`}>
        <span
          className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-40"
          style={{
            background: `radial-gradient(circle, ${strong ? C.accentSoft : C.violetSoft}, transparent 70%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-bold" style={{ color: C.fgMute, ...num }}>
            {opdracht.id}
          </span>
          <Chip tone={tone} ink={toneDark} soft={strong ? C.accentSoft : C.violetSoft}>
            <Star size={11} aria-hidden="true" /> {opdracht.match}% match
          </Chip>
        </div>
        <h1
          className="relative mt-4 max-w-2xl text-[28px] font-extrabold leading-[1.08] tracking-[-0.02em] md:text-[38px]"
          style={{ color: C.fg, ...display }}
        >
          {opdracht.titel}
        </h1>
        <p className="relative mt-2 text-[14.5px] font-semibold" style={{ color: C.fgSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="relative mt-6 flex flex-wrap gap-3">
          <ChunkyButton tone={tone} toneDark={toneDark}>
            Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
          </ChunkyButton>
          <SoftButton>Bewaar voor later</SoftButton>
        </div>
      </Blob>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, t: C.accent },
          { l: "Omvang", v: opdracht.uren, t: C.violet },
          { l: "Start", v: opdracht.start, t: C.mint },
          { l: "Match", v: `${opdracht.match}%`, t: C.amber },
        ].map((m) => (
          <Blob key={m.l} className="p-4" tone={`${m.t}26`}>
            <p
              className="text-[11.5px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.fgMute, ...body }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[19px] font-extrabold tabular-nums tracking-[-0.01em]"
              style={{ color: C.fg, ...display }}
            >
              {m.v}
            </p>
          </Blob>
        ))}
      </div>

      <section>
        <Eyebrow>Waarom deze match</Eyebrow>
        <p
          className="mt-3 max-w-xl text-[14px] font-medium leading-relaxed"
          style={{ color: C.fgSoft }}
        >
          Helder afgeleid van je geverifieerde profiel — welke punten sterk staan én waar je op moet
          letten, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Blob className="p-5" tone="rgba(47,199,160,0.22)">
            <p
              className="flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.1em]"
              style={{ color: C.okInk, ...display }}
            >
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-[12px]"
                style={{ background: C.okSoft }}
                aria-hidden="true"
              >
                <Check size={16} />
              </span>
              Sterke punten
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] font-medium"
                  style={{ color: C.fgSoft }}
                >
                  <Check
                    size={16}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.okInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Blob>
          <Blob className="p-5" tone="rgba(247,168,60,0.24)">
            <p
              className="flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.1em]"
              style={{ color: C.warnInk, ...display }}
            >
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-[12px]"
                style={{ background: C.warnSoft }}
                aria-hidden="true"
              >
                <AlertTriangle size={16} />
              </span>
              Let op
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] font-medium"
                  style={{ color: C.fgSoft }}
                >
                  <AlertTriangle
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.warnInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Blob>
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
    <div className="space-y-6">
      <Blob className="overflow-hidden p-6 md:p-7" tone="rgba(47,199,160,0.24)">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow tone={C.mintDark}>Verificatie</Eyebrow>
            <h1
              className="mt-3 text-[26px] font-extrabold leading-tight tracking-[-0.02em]"
              style={{ color: C.fg, ...display }}
            >
              Jouw vertrouwen groeit
            </h1>
            <p className="mt-3 text-[14px] font-medium leading-relaxed" style={{ color: C.fgSoft }}>
              <span className="font-extrabold" style={{ color: C.fg }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort — vernieuw het om in beeld te blijven.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="relative inline-flex h-24 w-24 items-center justify-center">
              <svg viewBox="0 0 96 96" className="h-24 w-24 -rotate-90" aria-hidden="true">
                <circle cx="48" cy="48" r="40" fill="none" stroke={C.mintSoft} strokeWidth="11" />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke={C.mint}
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeDasharray={`${(ratio / 100) * 2 * Math.PI * 40} ${2 * Math.PI * 40}`}
                />
              </svg>
              <span
                className="absolute text-[24px] font-extrabold tabular-nums"
                style={{ color: C.mintDark, ...num }}
              >
                {ratio}%
              </span>
            </span>
            <span className="text-[12px] font-bold" style={{ color: C.fgMute }}>
              vertrouwensscore
            </span>
          </div>
        </div>
      </Blob>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Blob tone={`${st.tone}2e`}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[26px] p-4 text-left transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7c6bf5]/25 motion-reduce:transition-none"
                >
                  <span
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px]"
                    style={{ color: st.ink, background: st.soft }}
                    aria-hidden="true"
                  >
                    <st.Icon size={20} />
                  </span>
                  <span className="min-w-0">
                    <span
                      className="block truncate text-[15px] font-extrabold"
                      style={{ color: C.fg, ...display }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[12.5px] font-semibold"
                      style={{ color: C.fgMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <Chip tone={st.tone} ink={st.ink} soft={st.soft}>
                    <st.Icon size={12} aria-hidden="true" />
                    <span className="hidden sm:inline">{st.label}</span>
                    {st.alarm && <span className="sr-only"> (let op)</span>}
                  </Chip>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4 sm:pl-[72px]">
                      <div className="rounded-[20px] p-4" style={{ background: C.bgAlt }}>
                        <p
                          className="max-w-xl text-[13.5px] font-medium leading-relaxed"
                          style={{ color: C.fgSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na jouw
                          toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <ChunkyButton
                            tone={st.tone === C.warn ? C.amber : C.violet}
                            toneDark={st.tone === C.warn ? C.amberDark : C.violetDark}
                          >
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </ChunkyButton>
                          <SoftButton>Historie</SoftButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Blob>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  const tones = [C.amber, C.violet, C.sky];
  const darks = [C.amberDark, C.violetDark, "#2b86c4"];
  const softs = [C.warnSoft, C.violetSoft, C.skySoft];
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Volgende acties</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-extrabold leading-none tracking-[-0.02em]"
          style={{ color: C.fg, ...display }}
        >
          Eén ding tegelijk
        </h1>
        <p className="mt-2 max-w-md text-[13.5px] font-medium" style={{ color: C.fgMute }}>
          Werk van boven naar beneden — zo blijf je verifieerbaar en betaald, zonder gedoe.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const idx = warn ? 0 : i;
          const tone = tones[idx % tones.length]!;
          const dark = darks[idx % darks.length]!;
          const soft = softs[idx % softs.length]!;
          return (
            <li key={a.titel}>
              <Blob className="p-5" tone={`${tone}2e`}>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-[16px] text-[16px] font-extrabold tabular-nums text-white"
                    style={{ background: `linear-gradient(180deg, ${tone}, ${dark})`, ...num }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <Chip tone={tone} ink={dark} soft={soft}>
                      {warn ? (
                        <AlertTriangle size={11} aria-hidden="true" />
                      ) : (
                        <Sparkles size={11} aria-hidden="true" />
                      )}
                      {warn ? "Belangrijk" : "Kans"}
                    </Chip>
                    <h2
                      className="mt-2 text-[16.5px] font-extrabold leading-snug"
                      style={{ color: C.fg, ...display }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13.5px] font-medium leading-relaxed"
                      style={{ color: C.fgSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <ChunkyButton tone={tone} toneDark={dark}>
                      {a.cta}
                      <ArrowRight size={14} aria-hidden="true" />
                    </ChunkyButton>
                  </div>
                </div>
              </Blob>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurMeta(status: string): {
  ink: string;
  soft: string;
  tone: string;
  Icon: LucideIcon;
} {
  if (status === "Openstaand")
    return { ink: C.warnInk, soft: C.warnSoft, tone: C.warn, Icon: Clock };
  if (status === "Betaald") return { ink: C.okInk, soft: C.okSoft, tone: C.ok, Icon: Check };
  return { ink: C.infoInk, soft: C.infoSoft, tone: C.info, Icon: Star };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen</Eyebrow>
          <h1
            className="mt-3 text-[30px] font-extrabold leading-none tracking-[-0.02em]"
            style={{ color: C.fg, ...display }}
          >
            Je geld op orde
          </h1>
        </div>
        <ChunkyButton>
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </ChunkyButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            l: "Betaald (mnd)",
            v: totaalBetaald,
            sub: "3 voldaan",
            tone: C.mint,
            ink: C.okInk,
            soft: C.mintSoft,
            alarm: false,
          },
          {
            l: "Openstaand",
            v: "€ 1.350",
            sub: "1 factuur · 9 dagen",
            tone: C.amber,
            ink: C.warnInk,
            soft: C.amberSoft,
            alarm: true,
          },
          {
            l: "Concept",
            v: "€ 880",
            sub: "klaar om te versturen",
            tone: C.violet,
            ink: C.infoInk,
            soft: C.violetSoft,
            alarm: false,
          },
        ].map((s) => (
          <Blob key={s.l} className="p-5" tone={`${s.tone}2e`}>
            <div className="flex items-center justify-between">
              <p
                className="text-[12px] font-bold uppercase tracking-[0.08em]"
                style={{ color: C.fgMute, ...body }}
              >
                {s.l}
              </p>
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-[12px]"
                style={{ background: s.soft, color: s.ink }}
                aria-hidden="true"
              >
                {s.alarm ? <AlertTriangle size={15} /> : <Check size={15} />}
              </span>
            </div>
            <p
              className="mt-2 text-[28px] font-extrabold tabular-nums tracking-[-0.02em]"
              style={{ color: s.alarm ? C.warnInk : C.fg, ...display }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12.5px] font-semibold" style={{ color: C.fgMute }}>
              {s.sub}
            </p>
          </Blob>
        ))}
      </section>

      <Blob className="overflow-hidden p-2" tone="rgba(124,107,245,0.18)">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-4 pb-2 pt-3 sm:grid"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[11px] font-extrabold uppercase tracking-[0.1em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.fgMute, ...body }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const ft = factuurMeta(f.status);
            const acc = f.status === "Openstaand";
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-[18px] px-4 py-3.5 transition-colors hover:bg-[#efe7f7] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
              >
                <span
                  className="order-1 text-[12px] font-bold tabular-nums"
                  style={{ color: C.fgMute, ...num }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-extrabold sm:order-2"
                  style={{ color: C.fg, ...display }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12px] font-semibold tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.fgMute, ...num }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <Chip tone={ft.tone} ink={ft.ink} soft={ft.soft}>
                    <ft.Icon size={12} aria-hidden="true" />
                    {f.status}
                  </Chip>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-extrabold tabular-nums sm:order-5"
                  style={{ color: acc ? C.warnInk : C.fg, ...num }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between rounded-[18px] px-4 py-4"
          style={{ background: C.bgAlt }}
        >
          <span
            className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.12em]"
            style={{ color: C.fgMute, ...display }}
          >
            <Sparkles size={14} aria-hidden="true" style={{ color: C.accent }} /> Totaal betaald
          </span>
          <span className="text-[22px] font-extrabold tabular-nums" style={{ color: C.fg, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </Blob>
    </div>
  );
}
