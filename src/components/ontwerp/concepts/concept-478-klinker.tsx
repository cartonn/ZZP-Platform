"use client";

// Concept 478 — "Klinker" · Verfijnd neo-brutalisme. Hoog contrast, dikke zwarte randen, harde
// blokvormige offset-slagschaduwen en gedurfde koppen — maar strak geordend, ruim en leesbaar.
// Kaarten en knoppen voelen fysiek "klikbaar": de schaduw verspringt bij hover en active. Twee
// stevige accenten (blauw + amber, met roze/violet-signaal) op een warm crème canvas.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Bell,
  Check,
  ChevronRight,
  Clock,
  FileText,
  LayoutGrid,
  MessageSquare,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  Square,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
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

// — Palet: neo-brutalisme — crème canvas, inktzwart, blauw + amber accenten, signaalkleuren —
const B = {
  paper: "#fefce8", // warm crème
  paperAlt: "#f8f4d4",
  card: "#ffffff",
  ink: "#0a0a0a",
  inkSoft: "#33332e",
  inkMute: "#5c5c54",
  blue: "#2563eb",
  blueSoft: "#dbe4ff",
  amber: "#f59e0b",
  amberSoft: "#fdecc4",
  pink: "#ec4899",
  pinkSoft: "#fbd6ea",
  green: "#16a34a",
  greenSoft: "#c3f0d0",
  red: "#dc2626",
  redSoft: "#fbd2d2",
  violet: "#7c3aed",
  violetSoft: "#e4d7fb",
};

const sans = {
  fontFamily:
    "'Inter', 'Helvetica Neue', 'Arial Black', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const mono = {
  fontFamily: "ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  ink: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        ink: B.green,
        wash: B.greenSoft,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        ink: B.violet,
        wash: B.violetSoft,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        ink: B.amber,
        wash: B.amberSoft,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: X, alarm: true, ink: B.red, wash: B.redSoft };
  }
}

// — Blok: witte kaart met dikke zwarte rand en harde offset-slagschaduw —
function Block({
  children,
  className = "",
  as: Tag = "div",
  interactive = false,
  tint = B.card,
  shadow = 5,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  interactive?: boolean;
  tint?: string;
  shadow?: number;
}) {
  return (
    <Tag
      className={`relative ${interactive ? "kl-int" : ""} ${className}`}
      style={{
        background: tint,
        border: "2.5px solid #0a0a0a",
        boxShadow: `${shadow}px ${shadow}px 0 0 #0a0a0a`,
        color: B.ink,
      }}
    >
      {children}
    </Tag>
  );
}

function Kicker({ children, tone = B.blue }: { children: React.ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em]"
      style={{ background: tone, color: "#ffffff", border: "2px solid #0a0a0a", ...sans }}
    >
      <Square size={9} aria-hidden="true" fill="#ffffff" strokeWidth={0} />
      {children}
    </span>
  );
}

function SolidButton({
  children,
  onClick,
  tone = B.blue,
  fg = "#ffffff",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: string;
  fg?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`kl-btn group inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12.5px] font-extrabold uppercase tracking-[0.05em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fefce8] ${className}`}
      style={{ background: tone, color: fg, border: "2.5px solid #0a0a0a", ...sans }}
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
  ariaExpanded,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  ariaPressed?: boolean;
  ariaExpanded?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      aria-expanded={ariaExpanded}
      className={`kl-btn inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-[12px] font-extrabold uppercase tracking-[0.05em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fefce8] ${className}`}
      style={{
        background: active ? B.ink : B.card,
        color: active ? "#ffffff" : B.ink,
        border: "2.5px solid #0a0a0a",
        ...sans,
      }}
    >
      {children}
    </button>
  );
}

// — Brutalistische bar-sparkline: chunky blokjes met zwarte rand —
function BarSpark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  return (
    <span className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((d, i) => {
        const h = 20 + ((d - min) / span) * 80;
        const isLast = i === data.length - 1;
        return (
          <span
            key={i}
            className="flex-1"
            style={{
              height: `${h}%`,
              background: isLast ? tone : B.paperAlt,
              border: "1.5px solid #0a0a0a",
            }}
          />
        );
      })}
    </span>
  );
}

function Bar({ value, tone = B.green }: { value: number; tone?: string }) {
  return (
    <span className="flex items-center gap-2" aria-hidden="true">
      <span
        className="relative h-3.5 w-28 overflow-hidden"
        style={{ background: B.card, border: "2.5px solid #0a0a0a" }}
      >
        <span
          className="block h-full"
          style={{
            width: `${value}%`,
            background: tone,
            transition: "width 0.7s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </span>
      <span className="text-[13px] font-extrabold" style={{ color: B.ink, ...mono }}>
        {value}%
      </span>
    </span>
  );
}

function matchTone(match: number): { ink: string; wash: string; label: string } {
  if (match >= 90) return { ink: B.green, wash: B.greenSoft, label: "Sterke match" };
  if (match >= 85) return { ink: B.blue, wash: B.blueSoft, label: "Goede match" };
  return { ink: B.amber, wash: B.amberSoft, label: "Redelijke match" };
}

export function Concept478() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [actief, setActief] = useState<Opdracht>(OPDRACHTEN[0] as Opdracht);

  const openOpdracht = (o?: Opdracht) => {
    if (o) setActief(o);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...sans, color: B.ink, background: B.paper }}
    >
      <style>{`
        @keyframes klIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .kl-in { animation: klIn 0.38s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .kl-int { transition: transform 0.12s ease, box-shadow 0.12s ease; }
        .kl-int:hover { transform: translate(2px, 2px); box-shadow: 3px 3px 0 0 #0a0a0a; }
        .kl-btn { transition: transform 0.1s ease, box-shadow 0.1s ease; box-shadow: 3px 3px 0 0 #0a0a0a; }
        .kl-btn:hover { transform: translate(1.5px, 1.5px); box-shadow: 1.5px 1.5px 0 0 #0a0a0a; }
        .kl-btn:active { transform: translate(3px, 3px); box-shadow: 0 0 0 0 #0a0a0a; }
        @media (prefers-reduced-motion: reduce) {
          .kl-in { animation: none !important; }
          .kl-int, .kl-btn { transition: none !important; }
          .kl-int:hover, .kl-btn:hover, .kl-btn:active { transform: none !important; }
        }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="kl-in pt-6">
          {screen === "dashboard" && (
            <Dashboard
              onOpen={openOpdracht}
              onActies={() => setScreen("acties")}
              onMarkt={() => setScreen("marktplaats")}
            />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={openOpdracht} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={actief} onBack={() => setScreen("marktplaats")} />
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
    <header className="flex items-center justify-between gap-4 py-5">
      <div className="flex items-center gap-3.5">
        <span
          className="inline-flex h-12 w-12 items-center justify-center"
          style={{
            background: B.amber,
            color: B.ink,
            border: "2.5px solid #0a0a0a",
            boxShadow: "4px 4px 0 0 #0a0a0a",
          }}
          aria-hidden="true"
        >
          <Zap size={22} strokeWidth={2.5} fill={B.ink} />
        </span>
        <div>
          <p
            className="text-[20px] font-extrabold uppercase leading-none tracking-tight"
            style={{ color: B.ink }}
          >
            Klinker
          </p>
          <p
            className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.1em]"
            style={{ color: B.inkMute }}
          >
            {PROFIEL.plaats} · werkbank
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 px-3 py-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.08em] sm:inline-flex"
          style={{
            color: B.ink,
            background: B.greenSoft,
            border: "2.5px solid #0a0a0a",
            boxShadow: "2px 2px 0 0 #0a0a0a",
          }}
        >
          <ShieldCheck size={13} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center"
          style={{ background: B.card, border: "2.5px solid #0a0a0a", color: B.ink }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center text-[10px] font-extrabold"
              style={{ background: B.pink, color: "#ffffff", border: "2px solid #0a0a0a", ...mono }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13.5px] font-extrabold" style={{ color: B.ink }}>
            {PROFIEL.naam}
          </span>
          <span
            className="block text-[10.5px] font-bold uppercase tracking-[0.06em]"
            style={{ color: B.inkMute }}
          >
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center text-[13px] font-extrabold"
          style={{
            background: B.blue,
            color: "#ffffff",
            border: "2.5px solid #0a0a0a",
            boxShadow: "3px 3px 0 0 #0a0a0a",
            ...mono,
          }}
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
    <nav aria-label="Hoofdnavigatie" className="mt-1">
      <div className="flex flex-wrap gap-2">
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="kl-btn shrink-0 px-3.5 py-2 text-[12px] font-extrabold uppercase tracking-[0.05em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fefce8]"
              style={{
                background: on ? B.ink : B.card,
                color: on ? "#ffffff" : B.ink,
                border: "2.5px solid #0a0a0a",
                ...sans,
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

function Dashboard({
  onOpen,
  onActies,
  onMarkt,
}: {
  onOpen: (o: Opdracht) => void;
  onActies: () => void;
  onMarkt: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Block className="overflow-hidden p-7 md:p-8" interactive tint={B.blue}>
          <Kicker tone={B.amber}>Werkbank · overzicht</Kicker>
          <h1
            className="mt-4 text-[32px] font-extrabold uppercase leading-[0.95] tracking-[-0.01em] md:text-[46px]"
            style={{ color: "#ffffff" }}
          >
            Goedemorgen,
            <br />
            {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p
            className="mt-4 max-w-md text-[13.5px] font-medium leading-relaxed"
            style={{ color: "#eef2ff" }}
          >
            Alles staat scherp. Je certificaten zijn op orde, er liggen verse matches klaar en één
            klus vraagt vandaag om actie. Pak hem beet.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <SolidButton onClick={onActies} tone={B.amber} fg={B.ink}>
              Volgende actie
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </SolidButton>
            <SolidButton onClick={onMarkt} tone={B.card} fg={B.ink}>
              <LayoutGrid size={14} aria-hidden="true" /> Marktplaats
            </SolidButton>
          </div>
        </Block>

        <Block className="p-6" interactive tint={B.amberSoft}>
          <div className="flex items-center justify-between">
            <Kicker tone={B.amber}>Nu aandacht</Kicker>
            <AlertTriangle size={18} aria-hidden="true" style={{ color: B.ink }} />
          </div>
          <h2 className="mt-3 text-[19px] font-extrabold leading-snug" style={{ color: B.ink }}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] font-medium leading-relaxed" style={{ color: B.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <SolidButton onClick={onActies} tone={B.ink} fg="#ffffff" className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </SolidButton>
          </div>
          <p
            className="mt-5 flex items-center gap-2 pt-4 text-[12px] font-bold"
            style={{ color: B.inkSoft, borderTop: "2.5px solid #0a0a0a" }}
          >
            <Check size={14} aria-hidden="true" style={{ color: B.green }} />
            {verified}/{CREDENTIALS.length} certificaten in orde · 7 open reacties
          </p>
        </Block>
      </section>

      <section>
        <div className="mb-3">
          <Kicker tone={B.violet}>Cijfers · deze maand</Kicker>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => {
            const tone = k.up ? B.green : B.red;
            const Trend = k.up ? TrendingUp : TrendingDown;
            return (
              <Block key={k.label} className="p-5" interactive>
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[10px] font-extrabold uppercase tracking-[0.1em]"
                    style={{ color: B.inkMute, ...sans }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-extrabold"
                    style={{
                      color: B.ink,
                      background: k.up ? B.greenSoft : B.redSoft,
                      border: "2px solid #0a0a0a",
                      ...mono,
                    }}
                  >
                    <Trend size={11} aria-hidden="true" /> {k.trend.replace(/^\+/, "")}
                  </span>
                </div>
                <p
                  className="mt-3 text-[28px] font-extrabold leading-none tracking-[-0.02em]"
                  style={{ color: B.ink, ...mono }}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <BarSpark data={k.spark} tone={tone} />
                </div>
              </Block>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <Kicker>Matches voor jou</Kicker>
            <button
              type="button"
              onClick={onMarkt}
              className="text-[11px] font-extrabold uppercase tracking-[0.12em] transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fefce8]"
              style={{ color: B.blue }}
            >
              Alle →
            </button>
          </div>
          <ul className="space-y-4">
            {OPDRACHTEN.map((o) => {
              const mt = matchTone(o.match);
              return (
                <li key={o.id}>
                  <Block className="p-4" interactive as="article">
                    <button
                      type="button"
                      onClick={() => onOpen(o)}
                      className="group flex w-full items-center gap-4 text-left focus-visible:outline-none"
                    >
                      <span
                        className="inline-flex h-14 w-14 shrink-0 flex-col items-center justify-center"
                        style={{ background: mt.wash, border: "2.5px solid #0a0a0a" }}
                        aria-hidden="true"
                      >
                        <span
                          className="text-[17px] font-extrabold leading-none"
                          style={{ color: B.ink, ...mono }}
                        >
                          {o.match}
                        </span>
                        <span
                          className="text-[7px] font-extrabold uppercase tracking-[0.08em]"
                          style={{ color: B.ink }}
                        >
                          match
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-[15px] font-extrabold"
                          style={{ color: B.ink }}
                        >
                          {o.titel}
                        </span>
                        <span
                          className="block truncate text-[11.5px] font-medium"
                          style={{ color: B.inkMute }}
                        >
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </span>
                      </span>
                      <ChevronRight
                        size={18}
                        aria-hidden="true"
                        className="shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: B.ink }}
                      />
                    </button>
                  </Block>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-5">
          <div>
            <div className="mb-3">
              <Kicker tone={B.green}>Certificaten</Kicker>
            </div>
            <Block className="p-2">
              <ul>
                {CREDENTIALS.map((c, i) => {
                  const st = statusMeta(c.status);
                  return (
                    <li
                      key={c.naam}
                      className="flex items-center gap-3 px-2 py-2.5"
                      style={{ borderTop: i === 0 ? "none" : "2px solid #0a0a0a" }}
                    >
                      <span
                        className="inline-flex h-9 w-9 items-center justify-center"
                        style={{ background: st.wash, border: "2.5px solid #0a0a0a", color: B.ink }}
                        aria-hidden="true"
                      >
                        <st.Icon size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-[12.5px] font-extrabold"
                          style={{ color: B.ink }}
                        >
                          {c.naam}
                        </span>
                        <span
                          className="block truncate text-[10.5px] font-bold uppercase tracking-[0.04em]"
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
            </Block>
          </div>

          <div>
            <div className="mb-3">
              <Kicker tone={B.pink}>Berichten</Kicker>
            </div>
            <Block className="p-2">
              <ul>
                {BERICHTEN.map((b, i) => (
                  <li
                    key={b.van}
                    className="flex items-center gap-3 px-2 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : "2px solid #0a0a0a" }}
                  >
                    <span
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-[10px] font-extrabold"
                      style={{
                        background: B.paperAlt,
                        border: "2.5px solid #0a0a0a",
                        color: B.ink,
                        ...mono,
                      }}
                      aria-hidden="true"
                    >
                      {b.initialen}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span
                          className="truncate text-[12px] font-extrabold"
                          style={{ color: B.ink }}
                        >
                          {b.van}
                        </span>
                        {b.ongelezen && (
                          <span
                            className="h-2 w-2 shrink-0"
                            style={{ background: B.pink, border: "1.5px solid #0a0a0a" }}
                            aria-label="ongelezen"
                          />
                        )}
                      </span>
                      <span
                        className="block truncate text-[10.5px] font-medium"
                        style={{ color: B.inkMute }}
                      >
                        {b.preview}
                      </span>
                    </span>
                    <span
                      className="shrink-0 text-[9.5px] font-extrabold"
                      style={{ color: B.inkMute, ...mono }}
                    >
                      {b.tijd}
                    </span>
                  </li>
                ))}
              </ul>
            </Block>
          </div>
        </div>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>Marktplaats</Kicker>
          <h1
            className="mt-3 text-[32px] font-extrabold uppercase leading-none tracking-[-0.01em]"
            style={{ color: B.ink }}
          >
            Opdrachten voor jou
          </h1>
          <p className="mt-2 text-[13px] font-bold" style={{ color: B.inkMute }}>
            {filtered.length} van {OPDRACHTEN.length} opdrachten passen bij jouw profiel
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-4 py-3"
          style={{
            background: B.card,
            border: "2.5px solid #0a0a0a",
            boxShadow: "3px 3px 0 0 #0a0a0a",
          }}
        >
          <Search size={17} aria-hidden="true" style={{ color: B.ink }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] font-medium outline-none placeholder:text-[#5c5c54]"
            style={{ color: B.ink, ...sans }}
          />
        </div>
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Sorteren en laden"
        >
          {(["match", "tarief"] as const).map((s) => (
            <GhostButton
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "match" ? "Match" : "Tarief"}
            </GhostButton>
          ))}
          <GhostButton
            onClick={() => {
              setLoading((v) => !v);
              setError(false);
            }}
            active={loading}
            ariaPressed={loading}
          >
            {loading ? "Stop" : "Herladen"}
          </GhostButton>
          <GhostButton
            onClick={() => {
              setError((v) => !v);
              setLoading(false);
            }}
            active={error}
            ariaPressed={error}
          >
            {error ? "Herstel" : "Toon storing"}
          </GhostButton>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Block className="p-5">
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div
                    className="h-3 w-24"
                    style={{ background: B.paperAlt, border: "2px solid #0a0a0a" }}
                  />
                  <div
                    className="h-6 w-2/3"
                    style={{ background: B.paperAlt, border: "2px solid #0a0a0a" }}
                  />
                  <div
                    className="h-3 w-1/2"
                    style={{ background: B.paperAlt, border: "2px solid #0a0a0a" }}
                  />
                </div>
              </Block>
            </li>
          ))}
        </ul>
      ) : error ? (
        <Block className="p-6" tint={B.redSoft}>
          <div className="flex flex-col items-center py-12 text-center" role="alert">
            <span
              className="inline-flex h-16 w-16 items-center justify-center"
              style={{
                background: B.red,
                color: "#ffffff",
                border: "2.5px solid #0a0a0a",
                boxShadow: "4px 4px 0 0 #0a0a0a",
              }}
              aria-hidden="true"
            >
              <AlertTriangle size={26} />
            </span>
            <p className="mt-5 text-[22px] font-extrabold uppercase" style={{ color: B.ink }}>
              Er ging iets mis
            </p>
            <p
              className="mx-auto mt-2 max-w-xs text-[13px] font-medium"
              style={{ color: B.inkSoft }}
            >
              De opdrachten konden niet worden geladen. Controleer je verbinding en probeer het
              opnieuw.
            </p>
            <div className="mt-6">
              <SolidButton onClick={() => setError(false)} tone={B.ink} fg="#ffffff">
                Opnieuw proberen <ArrowRight size={14} aria-hidden="true" />
              </SolidButton>
            </div>
          </div>
        </Block>
      ) : filtered.length === 0 ? (
        <Block className="p-6">
          <div className="flex flex-col items-center py-12 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center"
              style={{
                background: B.amberSoft,
                color: B.ink,
                border: "2.5px solid #0a0a0a",
                boxShadow: "4px 4px 0 0 #0a0a0a",
              }}
              aria-hidden="true"
            >
              <Search size={26} />
            </span>
            <p className="mt-5 text-[22px] font-extrabold uppercase" style={{ color: B.ink }}>
              Niets gevonden
            </p>
            <p
              className="mx-auto mt-2 max-w-xs text-[13px] font-medium"
              style={{ color: B.inkSoft }}
            >
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Pas de zoekterm aan of wis het
              filter.
            </p>
            <div className="mt-6">
              <SolidButton onClick={() => setQ("")} tone={B.amber} fg={B.ink}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </SolidButton>
            </div>
          </div>
        </Block>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
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
  onOpen: (o: Opdracht) => void;
}) {
  const [open, setOpen] = useState(false);
  const mt = matchTone(opdracht.match);
  return (
    <Block className="p-5" interactive as="article">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-[0.08em]"
              style={{ color: B.ink, background: B.paperAlt, border: "2px solid #0a0a0a", ...mono }}
            >
              #{String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[10.5px] font-extrabold" style={{ color: B.inkMute, ...mono }}>
              {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[19px] font-extrabold leading-snug" style={{ color: B.ink }}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px] font-bold" style={{ color: B.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-bold"
                style={{ color: B.ink, background: B.card, border: "2px solid #0a0a0a", ...sans }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="inline-flex h-16 w-16 flex-col items-center justify-center"
            style={{
              background: mt.wash,
              border: "2.5px solid #0a0a0a",
              boxShadow: "3px 3px 0 0 #0a0a0a",
            }}
            aria-hidden="true"
          >
            <span
              className="text-[20px] font-extrabold leading-none"
              style={{ color: B.ink, ...mono }}
            >
              {opdracht.match}
            </span>
            <span
              className="text-[7.5px] font-extrabold uppercase tracking-[0.08em]"
              style={{ color: B.ink }}
            >
              match
            </span>
          </span>
          <span className="text-[14px] font-extrabold" style={{ color: B.ink, ...mono }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <GhostButton onClick={() => setOpen((v) => !v)} ariaExpanded={open}>
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
        </GhostButton>
        <div className="ml-auto">
          <SolidButton onClick={() => onOpen(opdracht)} tone={B.blue}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </SolidButton>
        </div>
      </div>

      <div
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="In jouw voordeel"
              tone={B.green}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Goed om te weten"
              tone={B.amber}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Block>
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
    <div className="p-4" style={{ background: B.card, border: "2.5px solid #0a0a0a" }}>
      <p
        className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em]"
        style={{ color: B.ink, background: tone, border: "2px solid #0a0a0a", ...sans }}
      >
        <Icon size={12} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2 text-[12.5px] font-medium"
            style={{ color: B.inkSoft }}
          >
            <Icon
              size={14}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: tone === B.amber ? B.amber : B.green }}
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const mt = matchTone(opdracht.match);
  return (
    <div className="space-y-5">
      <GhostButton onClick={onBack}>
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </GhostButton>

      <Block className="p-7 md:p-8" tint={mt.wash}>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.08em]"
            style={{ color: B.ink, background: B.card, border: "2px solid #0a0a0a", ...mono }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.05em]"
            style={{ color: "#ffffff", background: B.ink, border: "2px solid #0a0a0a" }}
          >
            <Zap size={11} aria-hidden="true" /> {mt.label} · {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[30px] font-extrabold uppercase leading-[0.98] tracking-[-0.01em] md:text-[40px]"
          style={{ color: B.ink }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[13.5px] font-bold" style={{ color: B.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <SolidButton tone={B.ink} fg="#ffffff">
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </SolidButton>
          <SolidButton tone={B.card} fg={B.ink}>
            <FileText size={13} aria-hidden="true" /> Bewaren
          </SolidButton>
        </div>
      </Block>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Block key={m.l} className="p-5" interactive>
            <p
              className="text-[9.5px] font-extrabold uppercase tracking-[0.14em]"
              style={{ color: B.inkMute, ...sans }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[20px] font-extrabold tracking-[-0.01em]"
              style={{ color: B.ink, ...mono }}
            >
              {m.v}
            </p>
          </Block>
        ))}
      </div>

      <section>
        <Kicker>Waarom deze match</Kicker>
        <p
          className="mt-3 max-w-xl text-[13.5px] font-medium leading-relaxed"
          style={{ color: B.inkSoft }}
        >
          Afgezet tegen je geverifieerde profiel — wat in je voordeel spreekt én wat goed is om te
          weten. Open en zonder verborgen score.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Block className="p-6" tint={B.greenSoft}>
            <p
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em]"
              style={{
                color: "#ffffff",
                background: B.green,
                border: "2px solid #0a0a0a",
                ...sans,
              }}
            >
              <Check size={13} aria-hidden="true" /> In jouw voordeel
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px] font-medium"
                  style={{ color: B.inkSoft }}
                >
                  <Check
                    size={16}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: B.green }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Block>
          <Block className="p-6" tint={B.amberSoft}>
            <p
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em]"
              style={{ color: B.ink, background: B.amber, border: "2px solid #0a0a0a", ...sans }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Goed om te weten
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px] font-medium"
                  style={{ color: B.inkSoft }}
                >
                  <AlertTriangle
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: B.amber }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Block>
        </div>
        <div className="mt-4">
          <Block className="flex items-center gap-3 p-4" tint={B.ink}>
            <Zap size={16} aria-hidden="true" style={{ color: B.amber }} fill={B.amber} />
            <span
              className="text-[12.5px] font-extrabold uppercase tracking-[0.06em]"
              style={{ color: "#ffffff" }}
            >
              Match {opdracht.match}% — {mt.label.toLowerCase()} op jouw profiel
            </span>
          </Block>
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
    <div className="space-y-5">
      <Block className="p-7 md:p-8" tint={B.greenSoft}>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Kicker tone={B.green}>Verificatie</Kicker>
            <h1
              className="mt-3 text-[28px] font-extrabold uppercase leading-tight tracking-[-0.01em]"
              style={{ color: B.ink }}
            >
              Jouw certificaten
            </h1>
            <p
              className="mt-3 text-[13.5px] font-medium leading-relaxed"
              style={{ color: B.inkSoft }}
            >
              <span className="font-extrabold" style={{ color: B.green }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort — dat pakken we op tijd op. Je documenten blijven versleuteld en privé.
            </p>
            <div className="mt-4 max-w-xs">
              <Bar value={ratio} tone={B.green} />
            </div>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center"
            style={{
              background: B.card,
              border: "2.5px solid #0a0a0a",
              boxShadow: "5px 5px 0 0 #0a0a0a",
            }}
          >
            <span
              className="text-[28px] font-extrabold leading-none"
              style={{ color: B.green, ...mono }}
            >
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] font-extrabold uppercase tracking-[0.14em]"
              style={{ color: B.ink }}
            >
              % in orde
            </span>
          </span>
        </div>
      </Block>

      <Block>
        <ul>
          {CREDENTIALS.map((c, idx) => {
            const st = statusMeta(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam} style={{ borderTop: idx === 0 ? "none" : "2.5px solid #0a0a0a" }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f8f4d4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0a0a0a] motion-reduce:transition-none"
                >
                  <span
                    className="inline-flex h-11 w-11 items-center justify-center"
                    style={{ background: st.wash, border: "2.5px solid #0a0a0a", color: B.ink }}
                    aria-hidden="true"
                  >
                    <st.Icon size={17} />
                  </span>
                  <span className="min-w-0">
                    <span
                      className="block truncate text-[14.5px] font-extrabold"
                      style={{ color: B.ink }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[11.5px] font-medium"
                      style={{ color: B.inkMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span
                      className="hidden w-max items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.05em] sm:inline-flex"
                      style={{
                        color: B.ink,
                        background: st.wash,
                        border: "2px solid #0a0a0a",
                        ...sans,
                      }}
                    >
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </span>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{ color: B.ink, transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                      aria-hidden="true"
                    >
                      <Plus size={17} />
                    </span>
                  </span>
                </button>
                <div
                  className="grid transition-all duration-500 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-4 sm:pl-[80px]">
                      <div
                        className="p-4"
                        style={{ background: B.paperAlt, border: "2.5px solid #0a0a0a" }}
                      >
                        <p
                          className="max-w-xl text-[13px] font-medium leading-relaxed"
                          style={{ color: B.inkSoft }}
                        >
                          {c.detail}. Je document wordt versleuteld bewaard en alleen na jouw
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <SolidButton
                            tone={c.status === "EXPIRING" ? B.amber : B.blue}
                            fg={c.status === "EXPIRING" ? B.ink : "#ffffff"}
                          >
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </SolidButton>
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
      </Block>

      <div>
        <div className="mb-3">
          <Kicker tone={B.violet}>Documentenkast</Kicker>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Block key={d.naam} className="flex items-center gap-3 p-4" interactive>
                <span
                  className="inline-flex h-10 w-10 items-center justify-center"
                  style={{ background: B.paperAlt, border: "2.5px solid #0a0a0a", color: B.ink }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13px] font-extrabold"
                    style={{ color: B.ink }}
                  >
                    {d.naam}
                  </span>
                  <span
                    className="block text-[10.5px] font-bold"
                    style={{ color: B.inkMute, ...mono }}
                  >
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 text-[9.5px] font-extrabold uppercase tracking-[0.04em]"
                  style={{ color: B.ink, background: st.wash, border: "2px solid #0a0a0a" }}
                >
                  <st.Icon size={10} aria-hidden="true" />
                  {st.label}
                </span>
              </Block>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-5">
      <div>
        <Kicker tone={B.amber}>Acties · op urgentie</Kicker>
        <h1
          className="mt-3 text-[32px] font-extrabold uppercase leading-none tracking-[-0.01em]"
          style={{ color: B.ink }}
        >
          Wat vandaag telt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px] font-medium" style={{ color: B.inkSoft }}>
          Van boven naar beneden: het meest dringende eerst. Pak ze één voor één beet.
        </p>
      </div>

      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? B.amber : B.blue;
          const fg = warn ? B.ink : "#ffffff";
          return (
            <li key={a.titel}>
              <Block className="p-5" interactive tint={warn ? B.amberSoft : B.card}>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-12 w-12 items-center justify-center text-[16px] font-extrabold"
                    style={{ background: tone, color: fg, border: "2.5px solid #0a0a0a", ...mono }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-[0.1em]"
                      style={{ color: fg, background: tone, border: "2px solid #0a0a0a", ...sans }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <MessageSquare size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[19px] font-extrabold leading-snug"
                      style={{ color: B.ink }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13.5px] font-medium leading-relaxed"
                      style={{ color: B.inkSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <SolidButton tone={tone} fg={fg}>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </SolidButton>
                  </div>
                </div>
              </Block>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTone(status: string): { wash: string; Icon: LucideIcon | null } {
  if (status === "Openstaand") return { wash: B.amberSoft, Icon: AlertTriangle };
  if (status === "Betaald") return { wash: B.greenSoft, Icon: Check };
  return { wash: B.paperAlt, Icon: FileText };
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
          <Kicker>Facturen</Kicker>
          <h1
            className="mt-3 text-[32px] font-extrabold uppercase leading-none tracking-[-0.01em]"
            style={{ color: B.ink }}
          >
            Jouw facturen
          </h1>
        </div>
        <SolidButton tone={B.blue}>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </SolidButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 8.622", sub: "3 facturen", alarm: false, tint: B.greenSoft },
          {
            l: "Openstaand",
            v: "€ 1.350",
            sub: "1 factuur · 9 dagen",
            alarm: true,
            tint: B.amberSoft,
          },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false, tint: B.card },
        ].map((s) => (
          <Block key={s.l} className="p-5" interactive tint={s.tint}>
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-extrabold uppercase tracking-[0.1em]"
                style={{ color: B.inkMute, ...sans }}
              >
                {s.l}
              </p>
              {s.alarm && <AlertTriangle size={15} aria-hidden="true" style={{ color: B.ink }} />}
            </div>
            <p
              className="mt-2 text-[26px] font-extrabold tracking-[-0.01em]"
              style={{ color: B.ink, ...mono }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px] font-bold" style={{ color: B.inkMute }}>
              {s.sub}
            </p>
          </Block>
        ))}
      </section>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <GhostButton
            key={s}
            onClick={() => setSort(s)}
            active={sort === s}
            ariaPressed={sort === s}
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </GhostButton>
        ))}
      </div>

      <Block>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <caption className="sr-only">Facturen met status en bedrag</caption>
            <thead>
              <tr style={{ background: B.ink }}>
                {[
                  { h: "Nummer", a: "left" },
                  { h: "Klant", a: "left" },
                  { h: "Datum", a: "left" },
                  { h: "Status", a: "left" },
                  { h: "Bedrag", a: "right" },
                ].map((c) => (
                  <th
                    key={c.h}
                    scope="col"
                    className={`px-4 py-3 text-[9.5px] font-extrabold uppercase tracking-[0.14em] ${c.a === "right" ? "text-right" : ""}`}
                    style={{ color: "#ffffff", ...sans }}
                  >
                    {c.h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => {
                const ft = factuurTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#f8f4d4]"
                    style={{ borderTop: "2px solid #0a0a0a" }}
                  >
                    <td
                      className="px-4 py-3 text-[11.5px] font-extrabold"
                      style={{ color: B.inkMute, ...mono }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13.5px] font-extrabold" style={{ color: B.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-4 py-3 text-[11.5px] font-bold"
                      style={{ color: B.inkMute, ...mono }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.05em]"
                        style={{
                          color: B.ink,
                          background: ft.wash,
                          border: "2px solid #0a0a0a",
                          ...sans,
                        }}
                      >
                        {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                        {f.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[13.5px] font-extrabold"
                      style={{ color: B.ink, ...mono }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Block>
    </div>
  );
}
