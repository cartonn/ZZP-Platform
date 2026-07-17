"use client";

// Concept 367 — "Blauwuur" · Blue-hour / schemer premium dark mode.
// Cinematische, kalme donkere modus in het blauwe uur: diep indigo-naar-pruim schemer-verloop, zachte
// gloed rond actieve elementen (geen neon), gedempt sterrenlicht-accent in koel goud/perzik (#e8b478)
// plus koel violet-blauw (#8a9bff). Glasachtige panelen, hoge leesbaarheid ondanks donker. Rustig, luxe,
// vertrouwenwekkend rond gevoelige documenten. Geen raster, geen felle neon — zacht, atmosferisch, filmisch.
// Fonts: Geist (tekst/cijfers) + Instrument Serif voor één elegant serif-displaymoment.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  ShieldCheck,
  Moon,
  Sparkles,
  ChevronRight,
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

// — Palet: blauwe-uur schemer, koel goud + violet-blauw accent, hoge tekstcontrast —
const C = {
  bg0: "#0b1020",
  bg1: "#141033",
  bg2: "#1a1330",
  panel: "rgba(255,255,255,0.04)",
  panelSolid: "#161230",
  ring: "rgba(255,255,255,0.10)",
  ringSoft: "rgba(255,255,255,0.06)",
  text: "#eef1fb", // hoog contrast op donker
  textSoft: "#c3c8e0",
  muted: "#9aa0c4",
  faint: "#727aa6",
  gold: "#e8b478", // sterrenlicht-perzik/goud
  goldSoft: "rgba(232,180,120,0.14)",
  violet: "#8a9bff", // koel violet-blauw
  violetSoft: "rgba(138,155,255,0.14)",
  green: "#6fe0b0", // geverifieerd — koel mint, leesbaar op donker
  greenSoft: "rgba(111,224,176,0.14)",
  amber: "#f2c66b",
  amberSoft: "rgba(242,198,107,0.14)",
  rose: "#ff9a8f", // afgewezen/openstaand — zacht, niet neon
  roseSoft: "rgba(255,154,143,0.14)",
};

const body = { fontFamily: "var(--font-lab-geist), system-ui, sans-serif" };
const serif = { fontFamily: "var(--font-lab-instrument-serif), Georgia, serif" };

const pageBg = `radial-gradient(1200px 620px at 78% -12%, ${C.bg2} 0%, rgba(26,19,48,0) 62%), radial-gradient(900px 520px at 8% 4%, ${C.bg1} 0%, rgba(20,16,51,0) 58%), linear-gradient(168deg, ${C.bg0} 0%, ${C.bg1} 100%)`;

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  fg: string;
  bg: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, fg: C.green, bg: C.greenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.violet, bg: C.violetSoft };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, fg: C.amber, bg: C.amberSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, fg: C.rose, bg: C.roseSoft };
  }
}

function StatusBadge({ status }: { status: CredStatus }) {
  const m = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none"
      style={{ color: m.fg, background: m.bg, border: `1px solid ${m.fg}33`, ...body }}
    >
      <m.Icon size={12} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// — Glasachtig schemerpaneel met optionele gloed —
function Glass({
  children,
  className = "",
  glow,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  as?: "div" | "section" | "article";
}) {
  const Comp = as;
  return (
    <Comp
      className={`rounded-2xl ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.ring}`,
        boxShadow: glow
          ? `0 0 0 1px ${C.violetSoft}, 0 18px 60px -28px rgba(138,155,255,0.5), inset 0 1px 0 rgba(255,255,255,0.05)`
          : "0 14px 44px -30px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {children}
    </Comp>
  );
}

function Overline({ children, tone = C.violet }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="text-[11px] font-medium uppercase tracking-[0.28em]"
      style={{ color: tone, ...body }}
    >
      {children}
    </p>
  );
}

// — Zachte sparkline, gloed via gradient-vulling (geen neon-lijn) —
function GlowSpark({ data, negative }: { data: number[]; negative?: boolean }) {
  const w = 150;
  const h = 40;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stroke = negative ? C.amber : C.violet;
  const coords = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 4 - ((v - min) / span) * (h - 10);
    return [x, y] as const;
  });
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${coords[0]?.[0] ?? 0},${h} ${line} ${coords[coords.length - 1]?.[0] ?? 0},${h}`;
  const gid = `spark-${negative ? "a" : "b"}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px]"
      style={{ color: C.textSoft, background: C.ringSoft, border: `1px solid ${C.ring}`, ...body }}
    >
      {children}
    </span>
  );
}

export function Concept367() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ background: pageBg, color: C.text, ...body }}
    >
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pb-20 pt-8">
          {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
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
  return (
    <header className="flex items-center justify-between py-6">
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{
            background: `linear-gradient(150deg, ${C.violet} 0%, #5f6bd8 100%)`,
            color: C.bg0,
            boxShadow: `0 0 26px -6px ${C.violet}`,
          }}
          aria-hidden="true"
        >
          <Moon size={20} />
        </span>
        <div>
          <p className="text-[27px] font-normal leading-none tracking-[0.01em]" style={serif}>
            Blauwuur
          </p>
          <p
            className="mt-1 text-[10.5px] uppercase leading-none tracking-[0.24em]"
            style={{ color: C.faint }}
          >
            rustig · veilig · verifieerbaar
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium sm:inline-flex"
          style={{ color: C.green, background: C.greenSoft, border: `1px solid ${C.green}33` }}
        >
          <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span className="hidden text-right leading-tight sm:block">
          <span className="block text-[13px] font-medium">{PROFIEL.naam}</span>
          <span className="block text-[10.5px]" style={{ color: C.faint }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold"
          style={{ background: C.violetSoft, color: C.violet, border: `1px solid ${C.violet}44` }}
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
    <nav
      className="flex items-center gap-1 overflow-x-auto rounded-full p-1"
      style={{ background: C.panel, border: `1px solid ${C.ring}` }}
      aria-label="Hoofdnavigatie"
    >
      {SCREENS.map((s) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="relative shrink-0 rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a9bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]"
            style={
              on
                ? {
                    color: C.text,
                    background: C.violetSoft,
                    boxShadow: `0 0 22px -8px ${C.violet}, inset 0 0 0 1px ${C.violet}55`,
                  }
                : { color: C.muted }
            }
          >
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Glass className="relative overflow-hidden p-7">
          <span
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full"
            style={{ background: `radial-gradient(circle, ${C.violetSoft} 0%, rgba(0,0,0,0) 70%)` }}
            aria-hidden="true"
          />
          <Overline>Het blauwe uur · vandaag</Overline>
          <h1
            className="mt-4 text-[40px] font-normal leading-[1.05] tracking-[0.01em] md:text-[52px]"
            style={serif}
          >
            Goedenavond,
            <br />
            {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-4 max-w-md text-[14.5px] leading-relaxed" style={{ color: C.textSoft }}>
            De dag komt tot rust. Eén ding vraagt nog om aandacht — de rest kan wachten tot het
            licht wordt.
          </p>
          <div className="mt-6 flex items-center gap-2 text-[12px]" style={{ color: C.faint }}>
            <Sparkles size={14} aria-hidden="true" style={{ color: C.gold }} />3 nieuwe matches
            boven 85% klaar om te bekijken
          </div>
        </Glass>

        <Glass glow className="flex flex-col justify-between p-6">
          <div>
            <p
              className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em]"
              style={{ color: C.gold }}
            >
              <Sparkles size={13} aria-hidden="true" /> Aanbevolen actie
            </p>
            <h2 className="mt-3 text-[19px] font-semibold leading-snug">{primair.titel}</h2>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.muted }}>
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onOpen}
            className="group mt-6 inline-flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-[13.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a9bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]"
            style={{
              background: `linear-gradient(150deg, ${C.violet} 0%, #5f6bd8 100%)`,
              color: C.bg0,
              boxShadow: `0 0 30px -8px ${C.violet}`,
            }}
          >
            {primair.cta}
            <ArrowRight
              size={16}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </button>
        </Glass>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Glass key={k.label} className="p-5">
            <div className="flex items-baseline justify-between">
              <p className="text-[11px] uppercase tracking-[0.12em]" style={{ color: C.muted }}>
                {k.label}
              </p>
              <span
                className="text-[11px] font-semibold tabular-nums"
                style={{ color: k.up ? C.green : C.amber }}
              >
                {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
              </span>
            </div>
            <p className="mt-2 text-[28px] font-semibold tabular-nums leading-none tracking-[-0.01em]">
              {k.value}
            </p>
            <div className="mt-3">
              <GlowSpark data={k.spark} negative={!k.up} />
            </div>
          </Glass>
        ))}
      </section>

      <Glass as="section" className="p-2">
        <div className="flex items-center justify-between px-4 pb-2 pt-3">
          <Overline>Opdrachten voor jou</Overline>
          <button
            onClick={onOpen}
            className="text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a9bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]"
            style={{ color: C.violet }}
          >
            Alle bekijken
          </button>
        </div>
        <ul className="space-y-1">
          {OPDRACHTEN.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group grid w-full grid-cols-[1fr_auto] items-center gap-4 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a9bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-medium">{o.titel}</span>
                  <span className="mt-0.5 block truncate text-[12.5px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <MatchOrb value={o.match} />
                  <ChevronRight
                    size={16}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                    style={{ color: C.faint }}
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Glass>
    </div>
  );
}

function MatchOrb({ value }: { value: number }) {
  const strong = value >= 90;
  const tone = strong ? C.green : C.violet;
  return (
    <span className="flex items-center gap-2" aria-hidden="true">
      <span className="text-[14px] font-semibold tabular-nums" style={{ color: tone }}>
        {value}%
      </span>
      <span
        className="hidden h-1.5 w-16 overflow-hidden rounded-full sm:block"
        style={{ background: C.ringSoft }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: tone, boxShadow: `0 0 10px -2px ${tone}` }}
        />
      </span>
    </span>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline>Marktplaats</Overline>
          <h1 className="mt-2 text-[34px] font-normal leading-none tracking-[0.01em]" style={serif}>
            Open opdrachten
          </h1>
        </div>
        <span className="text-[12px]" style={{ color: C.faint }}>
          {filtered.length} van {OPDRACHTEN.length} zichtbaar
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Glass className="flex flex-1 items-center gap-2.5 px-4 py-3">
          <Search size={16} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#727aa6]"
            style={{ color: C.text }}
          />
        </Glass>
        <div className="flex items-center gap-1" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className="rounded-full px-4 py-2.5 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a9bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]"
                style={
                  on
                    ? { background: C.violetSoft, color: C.text, border: `1px solid ${C.violet}55` }
                    : { color: C.muted, border: `1px solid ${C.ring}` }
                }
              >
                {s === "match" ? "Match" : "Tarief"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Glass className="flex flex-col items-center py-16 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.violetSoft }}
            aria-hidden="true"
          >
            <Moon size={26} style={{ color: C.violet }} />
          </span>
          <p className="mt-4 text-[22px] font-normal" style={serif}>
            Stil in het schemer
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.muted }}>
            Geen opdracht past bij {q ? `“${q}”` : "je zoekopdracht"}. Verruim je zoekterm om meer
            te zien.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a9bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]"
            style={{ background: C.violetSoft, color: C.text, border: `1px solid ${C.violet}55` }}
          >
            Zoekopdracht wissen <ArrowRight size={14} aria-hidden="true" />
          </button>
        </Glass>
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => (
            <OpdrachtKaart key={o.id} opdracht={o} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

function OpdrachtKaart({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  return (
    <Glass as="article" className="overflow-hidden">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4 p-5">
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold leading-snug">{opdracht.titel}</h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren} · {opdracht.start}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className="text-[20px] font-semibold tabular-nums leading-none"
            style={{ color: strong ? C.green : C.violet }}
          >
            {opdracht.match}%
          </span>
          <span className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.faint }}>
            match
          </span>
          <span
            className="mt-1.5 text-[13.5px] font-semibold tabular-nums"
            style={{ color: C.gold }}
          >
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div
        className="flex items-center gap-4 border-t px-5 py-3"
        style={{ borderColor: C.ringSoft }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a9bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]"
          style={{ color: C.muted }}
        >
          <Plus
            size={13}
            aria-hidden="true"
            className="transition-transform motion-reduce:transition-none"
            style={{ transform: open ? "rotate(45deg)" : "none" }}
          />
          Waarom deze match
        </button>
        <button
          onClick={onOpen}
          className="ml-auto inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a9bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]"
          style={{ color: C.violet }}
        >
          Bekijk <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <Redenen opdracht={opdracht} />
        </div>
      </div>
    </Glass>
  );
}

function Redenen({ opdracht }: { opdracht: Opdracht }) {
  return (
    <div
      className="grid grid-cols-1 gap-6 border-t px-5 py-5 sm:grid-cols-2"
      style={{ borderColor: C.ringSoft }}
    >
      <div>
        <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: C.green }}>
          Wat past
        </p>
        <ul className="mt-3 space-y-2.5">
          {opdracht.redenen.plus.map((r) => (
            <li
              key={r}
              className="flex items-start gap-2.5 text-[13.5px]"
              style={{ color: C.textSoft }}
            >
              <Check
                size={15}
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                style={{ color: C.green }}
              />
              {r}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: C.amber }}>
          Aandacht
        </p>
        <ul className="mt-3 space-y-2.5">
          {opdracht.redenen.min.map((r) => (
            <li
              key={r}
              className="flex items-start gap-2.5 text-[13.5px]"
              style={{ color: C.muted }}
            >
              <AlertTriangle
                size={14}
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                style={{ color: C.amber }}
              />
              {r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a9bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]"
        style={{ color: C.muted }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug
      </button>

      <Glass glow className="relative overflow-hidden p-7">
        <span
          className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full"
          style={{ background: `radial-gradient(circle, ${C.goldSoft} 0%, rgba(0,0,0,0) 70%)` }}
          aria-hidden="true"
        />
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[12px] font-medium tracking-[0.08em]" style={{ color: C.violet }}>
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold tabular-nums"
            style={{
              color: opdracht.match >= 90 ? C.green : C.violet,
              background: C.greenSoft,
              border: `1px solid ${C.green}33`,
            }}
          >
            {opdracht.match}% match
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[38px] font-normal leading-[1.08] tracking-[0.01em] md:text-[46px]"
          style={serif}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[14.5px]" style={{ color: C.textSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a9bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]"
            style={{
              background: `linear-gradient(150deg, ${C.violet} 0%, #5f6bd8 100%)`,
              color: C.bg0,
              boxShadow: `0 0 30px -8px ${C.violet}`,
            }}
          >
            Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a9bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]"
            style={{ color: C.text, border: `1px solid ${C.ring}` }}
          >
            Bewaar
          </button>
        </div>
      </Glass>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), sub: "per uur" },
          { l: "Omvang", v: opdracht.uren.replace(" u/week", ""), sub: "uur / week" },
          { l: "Start", v: opdracht.start, sub: "ingang" },
          { l: "Match", v: `${opdracht.match}%`, sub: "geverifieerd" },
        ].map((m) => (
          <Glass key={m.l} className="p-5">
            <p className="text-[10.5px] uppercase tracking-[0.14em]" style={{ color: C.faint }}>
              {m.l}
            </p>
            <p className="mt-1.5 text-[22px] font-semibold tabular-nums tracking-[-0.01em]">
              {m.v}
            </p>
            <p className="mt-0.5 text-[11px]" style={{ color: C.faint }}>
              {m.sub}
            </p>
          </Glass>
        ))}
      </section>

      <Glass as="section" className="p-6">
        <Overline>Waarom deze match</Overline>
        <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed" style={{ color: C.textSoft }}>
          Transparant onderbouwd op je geverifieerde profiel — de pluspunten én de aandacht, zonder
          verborgen score.
        </p>
        <Redenen opdracht={opdracht} />
      </Glass>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-6">
      <Glass glow className="flex flex-wrap items-end justify-between gap-6 p-7">
        <div className="max-w-md">
          <Overline tone={C.green}>Vertrouwen</Overline>
          <h1 className="mt-2 text-[34px] font-normal leading-none tracking-[0.01em]" style={serif}>
            Verificatie
          </h1>
          <p className="mt-4 text-[14.5px] leading-relaxed" style={{ color: C.textSoft }}>
            <span className="font-semibold" style={{ color: C.green }}>
              {PROFIEL.trust}.
            </span>{" "}
            {verified} van {CREDENTIALS.length} certificaten volledig geverifieerd. Eén vraagt
            binnenkort om actie. Documenten blijven versleuteld en privé.
          </p>
        </div>
        <div className="flex items-end gap-4">
          <div className="text-right">
            <p
              className="text-[46px] font-semibold tabular-nums leading-none tracking-[-0.01em]"
              style={{ color: C.green }}
            >
              {ratio}
              <span className="text-[22px]" style={{ color: C.muted }}>
                %
              </span>
            </p>
            <p
              className="mt-1 text-[10.5px] uppercase tracking-[0.14em]"
              style={{ color: C.faint }}
            >
              compleet
            </p>
          </div>
          <div className="flex items-end gap-1.5 pb-1" aria-hidden="true">
            {CREDENTIALS.map((c) => {
              const m = statusMeta(c.status);
              return (
                <span
                  key={c.naam}
                  className="w-2.5 rounded-full"
                  style={{
                    height: c.status === "VERIFIED" ? 42 : c.status === "EXPIRING" ? 24 : 32,
                    background: m.fg,
                    boxShadow: `0 0 12px -3px ${m.fg}`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </Glass>

      <Glass as="section" className="p-2">
        <ul className="space-y-1">
          {CREDENTIALS.map((c) => {
            const st = statusMeta(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam}>
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl px-4 py-4 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a9bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]"
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ background: st.bg }}
                    aria-hidden="true"
                  >
                    <st.Icon size={17} style={{ color: st.fg }} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15.5px] font-medium">{c.naam}</span>
                    <span className="mt-0.5 block text-[12.5px]" style={{ color: C.muted }}>
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="hidden sm:inline">
                      <StatusBadge status={c.status} />
                    </span>
                    <Plus
                      size={15}
                      aria-hidden="true"
                      className="transition-transform motion-reduce:transition-none"
                      style={{ color: C.muted, transform: isOpen ? "rotate(45deg)" : "none" }}
                    />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4 pl-14">
                      <p
                        className="max-w-xl text-[13.5px] leading-relaxed"
                        style={{ color: C.textSoft }}
                      >
                        {c.detail}. Documenten worden versleuteld bewaard en alleen na jouw
                        expliciete toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="rounded-xl px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a9bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]"
                          style={{
                            background: C.violetSoft,
                            color: C.text,
                            border: `1px solid ${C.violet}55`,
                          }}
                        >
                          {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                        </button>
                        <button
                          className="rounded-xl px-4 py-2 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a9bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]"
                          style={{ color: C.textSoft, border: `1px solid ${C.ring}` }}
                        >
                          Logboek
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Glass>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <header>
        <Overline tone={C.gold}>Aandacht</Overline>
        <h1 className="mt-2 text-[34px] font-normal leading-none tracking-[0.01em]" style={serif}>
          Volgende acties
        </h1>
        <p className="mt-3 max-w-md text-[14.5px]" style={{ color: C.textSoft }}>
          Rond deze rustig af, één voor één. Het meest urgente staat bovenaan.
        </p>
      </header>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.violet;
          return (
            <li key={a.titel}>
              <Glass
                glow={warn}
                className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums"
                  style={{
                    background: warn ? C.amberSoft : C.violetSoft,
                    color: tone,
                    border: `1px solid ${tone}44`,
                  }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle size={15} aria-hidden="true" style={{ color: C.amber }} />
                    ) : (
                      <Sparkles size={14} aria-hidden="true" style={{ color: C.violet }} />
                    )}
                    <h2 className="text-[16.5px] font-semibold leading-snug">{a.titel}</h2>
                  </div>
                  <p
                    className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                    style={{ color: C.muted }}
                  >
                    {a.detail}
                  </p>
                </div>
                <button
                  className="justify-self-start rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a9bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020] sm:justify-self-end"
                  style={
                    warn
                      ? {
                          background: C.amberSoft,
                          color: C.amber,
                          border: `1px solid ${C.amber}55`,
                        }
                      : { color: C.text, border: `1px solid ${C.ring}` }
                  }
                >
                  {a.cta}
                </button>
              </Glass>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTint(status: string): { fg: string; open: boolean } {
  if (status === "Openstaand") return { fg: C.rose, open: true };
  if (status === "Concept") return { fg: C.muted, open: false };
  return { fg: C.green, open: false };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline tone={C.gold}>Omzet</Overline>
          <h1 className="mt-2 text-[34px] font-normal leading-none tracking-[0.01em]" style={serif}>
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a9bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]"
          style={{
            background: `linear-gradient(150deg, ${C.violet} 0%, #5f6bd8 100%)`,
            color: C.bg0,
            boxShadow: `0 0 26px -10px ${C.violet}`,
          }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", fg: C.green },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", fg: C.rose },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", fg: C.gold },
        ].map((s) => (
          <Glass key={s.l} className="p-5">
            <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color: C.muted }}>
              {s.l}
            </p>
            <p
              className="mt-2 text-[27px] font-semibold tabular-nums tracking-[-0.01em]"
              style={{ color: s.fg }}
            >
              {s.v}
            </p>
            <p className="mt-0.5 text-[12px]" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </Glass>
        ))}
      </section>

      <Glass as="section" className="overflow-hidden">
        <div
          className="hidden grid-cols-[7rem_1fr_4.5rem_7rem_6.5rem] gap-4 px-5 py-3 sm:grid"
          style={{ borderBottom: `1px solid ${C.ring}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[10.5px] uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const t = factuurTint(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-t px-5 py-4 transition-colors hover:bg-white/[0.03] sm:grid-cols-[7rem_1fr_4.5rem_7rem_6.5rem] sm:gap-4"
                style={{ borderColor: C.ringSoft }}
              >
                <span className="order-1 text-[12px] tabular-nums" style={{ color: C.faint }}>
                  {f.nr}
                </span>
                <span className="order-3 min-w-0 truncate text-[14.5px] font-medium sm:order-2">
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12.5px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11.5px] font-medium"
                    style={{ color: t.fg }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: t.fg, boxShadow: `0 0 8px -1px ${t.fg}` }}
                      aria-hidden="true"
                    />
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-semibold tabular-nums sm:order-5"
                  style={{ color: t.open ? C.rose : C.text }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between border-t px-5 py-4"
          style={{ borderColor: C.ring, background: C.ringSoft }}
        >
          <span className="text-[11px] uppercase tracking-[0.16em]" style={{ color: C.faint }}>
            Totaal betaald
          </span>
          <span className="text-[24px] font-semibold tabular-nums" style={{ color: C.green }}>
            {totaalBetaald}
          </span>
        </div>
      </Glass>
    </div>
  );
}
