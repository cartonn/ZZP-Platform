"use client";

// Concept 460 — "Grootboek" · Dubbel-boekhouden ledger. Data-dicht, tabulair, professioneel.
// Groen-gelinieerd kolompapier (green-bar wisselrijen #e8f0e4), een rode kantlijn-lijn, hairline
// kolomscheiders en tabulaire cijfers overal (font-variant-numeric: tabular-nums). Debet/credit-
// gevoel: inkt-zwart #1a1a17 op crème, één ledger-rood #b02a2a voor debet en ledger-groen voor
// credit. Compact en hoog van informatiedichtheid — een boekhoud-terminal op grootboekpapier.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Minus,
  Plus,
  Scale,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
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

// — Palet: inkt op crème grootboekpapier, ledger-rood + ledger-groen —
const C = {
  paper: "#f6f3e8", // crème grootboekpapier
  paperAlt: "#e8f0e4", // green-bar wisselrij
  card: "#fbf9f0",
  ink: "#1a1a17", // schrijfinkt-zwart
  inkSoft: "#3d3c34",
  inkMute: "#6f6d5e",
  inkFaint: "#9c9a86",
  line: "#cfcbb4", // hairline kolomscheider
  lineStrong: "#b8b39a",
  rule: "#c9c4ab", // gelinieerde regel
  red: "#b02a2a", // ledger-rood (debet / kantlijn)
  redSoft: "#f0dcd8",
  green: "#2f6b46", // ledger-groen (credit)
  greenSoft: "#dcecdf",
  amber: "#9a6b12", // let-op / verloopt
  amberSoft: "#f0e6cf",
  blue: "#274b7a", // neutrale info-inkt
  blueSoft: "#dde6f0",
};

const bodyFont = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums" as const,
};
const serif = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
};

// Grootboekpapier: fijne horizontale liniëring + een dubbele rode kantlijn links.
function ledgerPaper(base: string): React.CSSProperties {
  return {
    backgroundColor: base,
    backgroundImage: `repeating-linear-gradient(180deg, transparent 0px, transparent 27px, ${C.rule} 27px, ${C.rule} 28px)`,
  };
}

function eur(bedrag: string) {
  return bedrag;
}

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
        ink: C.green,
        wash: C.greenSoft,
      };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, alarm: false, ink: C.blue, wash: C.blueSoft };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.amber,
        wash: C.amberSoft,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, alarm: true, ink: C.red, wash: C.redSoft };
  }
}

// — Grootboek-blad: crème kaart met inkt-hairline en een rode kantlijn —
function Ledger({
  children,
  className = "",
  as: Tag = "div",
  margin = true,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
  margin?: boolean;
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-[2px] ${className}`}
      style={{
        background: C.card,
        border: `1px solid ${C.lineStrong}`,
        boxShadow: "0 1px 2px rgba(26,26,23,0.06)",
        color: C.ink,
      }}
    >
      {margin && (
        <>
          <span
            className="pointer-events-none absolute inset-y-0 left-[10px] w-px"
            style={{ background: C.red, opacity: 0.5 }}
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute inset-y-0 left-[13px] w-px"
            style={{ background: C.red, opacity: 0.28 }}
            aria-hidden="true"
          />
        </>
      )}
      {children}
    </Tag>
  );
}

function Eyebrow({ children, tone = C.red }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.24em]"
      style={{ color: tone, ...bodyFont }}
    >
      <span className="inline-block h-2.5 w-2.5" style={{ background: tone }} aria-hidden="true" />
      {children}
    </p>
  );
}

function InkButton({
  children,
  onClick,
  tone = C.ink,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-[2px] px-4 py-2 text-[12.5px] font-bold transition-all duration-150 hover:brightness-[1.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1a17] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f3e8] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{ color: "#faf7ec", background: tone, border: `1px solid ${C.ink}`, ...bodyFont }}
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
      className={`inline-flex items-center justify-center gap-2 rounded-[2px] px-3.5 py-2 text-[12px] font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1a17] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f3e8] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? "#faf7ec" : C.ink,
        background: active ? C.ink : "transparent",
        border: `1px solid ${active ? C.ink : C.lineStrong}`,
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

// — Kolom-sparkline: strak ledger-staafje —
function LedgerBars({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 32;
  const bw = w / data.length;
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line x1="0" y1={h - 0.5} x2={w} y2={h - 0.5} stroke={C.line} strokeWidth="1" />
      {data.map((d, i) => {
        const bh = 4 + ((d - min) / span) * (h - 8);
        const x = i * bw + bw * 0.2;
        return (
          <rect
            key={`${id}-${i}`}
            x={x}
            y={h - bh}
            width={bw * 0.6}
            height={bh}
            fill={tone}
            opacity={i === data.length - 1 ? 1 : 0.45}
          />
        );
      })}
    </svg>
  );
}

function Meter({ value, tone = C.green }: { value: number; tone?: string }) {
  return (
    <span className="hidden items-center gap-2 sm:flex" aria-hidden="true">
      <span
        className="relative h-2 w-20 overflow-hidden rounded-[1px]"
        style={{ background: C.paperAlt, border: `1px solid ${C.line}` }}
      >
        <span
          className="block h-full"
          style={{
            width: `${value}%`,
            background: tone,
            transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </span>
      <span className="text-[12px] font-bold" style={{ color: tone, ...num }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept460() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...bodyFont, color: C.ink, ...ledgerPaper(C.paper) }}
    >
      <style>{`
        @keyframes ledgerRise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .ledger-rise { animation: ledgerRise 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .ledger-rise { animation: none !important; } }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="ledger-rise pt-6">
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
    <header
      className="flex items-center justify-between gap-4 border-b-2 py-5"
      style={{ borderColor: C.ink }}
    >
      <div className="flex items-center gap-3.5">
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-[2px]"
          style={{ background: C.ink, color: C.paper }}
          aria-hidden="true"
        >
          <BookOpen size={20} strokeWidth={2} />
        </span>
        <div>
          <p
            className="text-[19px] font-bold leading-none tracking-tight"
            style={{ color: C.ink, ...serif }}
          >
            Grootboek
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute, ...num }}>
            {PROFIEL.plaats} · boekjaar 2026
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-[2px] px-3 py-1.5 text-[11px] font-bold sm:inline-flex"
          style={{
            color: C.green,
            background: C.greenSoft,
            border: `1px solid ${C.green}`,
            ...bodyFont,
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-[2px]"
          style={{ background: C.card, border: `1px solid ${C.lineStrong}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={15} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.red, color: "#faf7ec", ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13.5px] font-bold" style={{ color: C.ink, ...bodyFont }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.inkMute, ...bodyFont }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-[2px] text-[12.5px] font-bold"
          style={{ background: C.card, border: `1px solid ${C.ink}`, color: C.ink, ...num }}
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
    <nav aria-label="Hoofdnavigatie" className="mt-4">
      <div
        className="flex items-stretch gap-0 overflow-x-auto border-b"
        style={{ borderColor: C.lineStrong }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 px-4 py-2.5 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a1a17] motion-reduce:transition-none"
              style={{
                color: on ? C.ink : C.inkMute,
                borderBottom: on ? `3px solid ${C.red}` : "3px solid transparent",
                background: on ? C.card : "transparent",
                ...bodyFont,
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
  return (
    <div className="space-y-6 pt-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Ledger className="p-7 md:p-8">
          <Eyebrow>Balans · vandaag</Eyebrow>
          <h1
            className="mt-4 text-[30px] font-bold leading-[1.08] tracking-[-0.01em] md:text-[40px]"
            style={{ color: C.ink, ...serif }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Je praktijk sluitend geboekt: elke post gedekt, elke verificatie in het register. Loop
            de openstaande posten langs — debet en credit lopen gelijk.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <InkButton onClick={onActies} tone={C.red}>
              Volgende actie
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </InkButton>
            <GhostButton onClick={onOpen}>Marktplaats</GhostButton>
          </div>
        </Ledger>

        <Ledger className="p-6" margin={false}>
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.amber}>Vraagt aandacht</Eyebrow>
            <AlertTriangle size={17} aria-hidden="true" style={{ color: C.amber }} />
          </div>
          <h2
            className="mt-3 text-[18px] font-bold leading-snug"
            style={{ color: C.ink, ...serif }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <InkButton onClick={onActies} tone={C.amber} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </InkButton>
          </div>
          <p
            className="mt-5 flex items-center gap-2 border-t pt-4 text-[12px]"
            style={{ color: C.inkMute, borderColor: C.line, ...num }}
          >
            <Check size={13} aria-hidden="true" style={{ color: C.green }} />
            {verified}/{CREDENTIALS.length} certificaten geboekt · 7 open reacties
          </p>
        </Ledger>
      </section>

      <section>
        <div className="mb-3">
          <Eyebrow tone={C.green}>Grootboekrekeningen · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = k.up ? C.green : C.red;
            const Trend = k.up ? TrendingUp : TrendingDown;
            return (
              <Ledger key={k.label} className="p-5" margin={false}>
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: C.inkMute, ...bodyFont }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] font-bold"
                    style={{ color: tone, ...num }}
                  >
                    <Trend size={11} aria-hidden="true" /> {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <p
                  className="mt-3 text-[26px] font-bold leading-none tracking-[-0.01em]"
                  style={{ color: C.ink, ...num }}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <LedgerBars data={k.spark} tone={tone} id={`k460-${i}`} />
                </div>
              </Ledger>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow>Open opdrachten · debiteuren in wording</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="text-[11px] font-bold uppercase tracking-[0.14em] transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1a17] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f3e8]"
              style={{ color: C.red, ...bodyFont }}
            >
              Alle →
            </button>
          </div>
          <Ledger margin={false}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[440px] border-collapse text-left">
                <thead>
                  <tr style={{ borderBottom: `1.5px solid ${C.ink}` }}>
                    {["Match", "Opdracht", "Tarief", ""].map((h, i) => (
                      <th
                        key={h || i}
                        className={`px-4 py-2.5 text-[9.5px] font-bold uppercase tracking-[0.14em] ${i === 2 ? "text-right" : ""}`}
                        style={{ color: C.inkMute, ...bodyFont }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {OPDRACHTEN.map((o, i) => {
                    const tone = o.match >= 90 ? C.green : C.blue;
                    return (
                      <tr
                        key={o.id}
                        onClick={onOpen}
                        className="group cursor-pointer transition-colors hover:bg-[#e8f0e4]"
                        style={{ background: i % 2 === 1 ? C.paperAlt : "transparent" }}
                      >
                        <td className="px-4 py-3" style={{ borderRight: `1px solid ${C.line}` }}>
                          <span
                            className="inline-flex items-center gap-1 text-[13px] font-bold"
                            style={{ color: tone, ...num }}
                          >
                            {o.match}
                          </span>
                        </td>
                        <td className="px-4 py-3" style={{ borderRight: `1px solid ${C.line}` }}>
                          <span className="block text-[13.5px] font-bold" style={{ color: C.ink }}>
                            {o.titel}
                          </span>
                          <span className="block text-[11px]" style={{ color: C.inkMute }}>
                            {o.opdrachtgever} · {o.plaats}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3 text-right text-[12.5px] font-bold"
                          style={{ color: C.ink, borderRight: `1px solid ${C.line}`, ...num }}
                        >
                          {o.tarief}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <ChevronRight
                            size={16}
                            aria-hidden="true"
                            className="inline transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                            style={{ color: C.inkFaint }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Ledger>
        </div>

        <div>
          <div className="mb-3">
            <Eyebrow tone={C.green}>Certificaten-register</Eyebrow>
          </div>
          <Ledger className="p-4" margin={false}>
            <ul>
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 px-1 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[2px]"
                      style={{ background: st.wash, border: `1px solid ${st.ink}`, color: st.ink }}
                      aria-hidden="true"
                    >
                      <st.Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-bold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span className="block truncate text-[10.5px]" style={{ color: C.inkMute }}>
                        {st.label}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Ledger>
        </div>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [loading, setLoading] = useState(false);

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
    <div className="space-y-6 pt-6">
      <div>
        <Eyebrow>Marktplaats</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
          style={{ color: C.ink, ...serif }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkMute, ...num }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} posten op de rol
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[2px] px-4 py-2.5"
          style={{ background: C.card, border: `1px solid ${C.lineStrong}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9c9a86]"
            style={{ color: C.ink, ...bodyFont }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <GhostButton
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              {s === "match" ? "Beste match" : "Tarief"}
            </GhostButton>
          ))}
          <GhostButton onClick={() => setLoading((v) => !v)} active={loading} ariaPressed={loading}>
            {loading ? "Stop" : "Laden…"}
          </GhostButton>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Ledger className="p-5" margin={false}>
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24 rounded-[1px]" style={{ background: C.paperAlt }} />
                  <div className="h-5 w-2/3 rounded-[1px]" style={{ background: C.paperAlt }} />
                  <div className="h-3 w-1/2 rounded-[1px]" style={{ background: C.paperAlt }} />
                </div>
              </Ledger>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Ledger className="p-6" margin={false}>
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-[2px]"
              style={{
                background: C.paperAlt,
                border: `1px solid ${C.lineStrong}`,
                color: C.inkMute,
              }}
              aria-hidden="true"
            >
              <Search size={24} />
            </span>
            <p className="mt-5 text-[21px] font-bold" style={{ color: C.ink, ...serif }}>
              Lege regel in het grootboek
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
              Geen post bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm en boek opnieuw.
            </p>
            <div className="mt-6">
              <InkButton onClick={() => setQ("")} tone={C.red}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </InkButton>
            </div>
          </div>
        </Ledger>
      ) : (
        <ul className="space-y-3">
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
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  const tone = strong ? C.green : C.blue;
  return (
    <Ledger className="p-5">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4 pl-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-[1px] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
            >
              Post {String(index + 1).padStart(3, "0")}
            </span>
            <span className="text-[11px] font-bold" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[18px] font-bold leading-snug"
            style={{ color: C.ink, ...serif }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-[1px] px-2 py-0.5 text-[10.5px] font-semibold"
                style={{
                  color: C.inkSoft,
                  background: C.paperAlt,
                  border: `1px solid ${C.line}`,
                  ...bodyFont,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="inline-flex items-baseline gap-1 rounded-[2px] px-2.5 py-1.5"
            style={{ background: strong ? C.greenSoft : C.blueSoft, border: `1px solid ${tone}` }}
          >
            <span className="text-[18px] font-bold leading-none" style={{ color: tone, ...num }}>
              {opdracht.match}
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-[0.1em]"
              style={{ color: tone, ...bodyFont }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-bold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3 pl-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-[2px] px-3 py-1.5 text-[11.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1a17] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf9f0]"
          style={{ color: C.ink, border: `1px solid ${C.lineStrong}`, ...bodyFont }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <InkButton onClick={onOpen} tone={C.ink}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </InkButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 pl-4 sm:grid-cols-2">
            <RedenBlok
              titel="Credit — voor jou"
              tone={C.green}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Debet — let op"
              tone={C.red}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Ledger>
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
    <div
      className="rounded-[2px] p-4"
      style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        borderLeft: `3px solid ${tone}`,
      }}
    >
      <p
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
        style={{ color: tone, ...bodyFont }}
      >
        <Icon size={12} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.inkSoft }}>
            <Icon
              size={13}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: tone }}
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
  const tone = strong ? C.green : C.blue;
  return (
    <div className="space-y-5 pt-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-[2px] px-3.5 py-2 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1a17] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f3e8]"
        style={{
          color: C.ink,
          border: `1px solid ${C.lineStrong}`,
          background: C.card,
          ...bodyFont,
        }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Ledger className="p-7 md:p-8">
        <div className="flex flex-wrap items-center gap-2 pl-4">
          <span
            className="inline-flex items-center rounded-[1px] px-2 py-0.5 text-[10.5px] font-bold"
            style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-[1px] px-2 py-0.5 text-[11px] font-bold"
            style={{ color: "#faf7ec", background: tone, ...bodyFont }}
          >
            <Scale size={11} aria-hidden="true" /> {strong ? "Sterke match" : "Goede match"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl pl-4 text-[28px] font-bold leading-[1.1] tracking-[-0.01em] md:text-[38px]"
          style={{ color: C.ink, ...serif }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 pl-4 text-[13.5px]" style={{ color: C.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5 pl-4">
          <InkButton tone={C.red}>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </InkButton>
          <GhostButton>Bewaren</GhostButton>
        </div>
      </Ledger>

      <Ledger margin={false}>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m, i) => (
            <div
              key={m.l}
              className="p-5"
              style={{
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.line}`,
                borderTop: i >= 2 ? `1px solid ${C.line}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-bold tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Ledger>

      <section>
        <Eyebrow>Verklaarbare matching · debet & credit</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgeboekt tegen je geverifieerde profiel — wat je meebrengt (credit) én waar de aandacht
          ligt (debet), transparant en zonder verborgen score.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Ledger className="p-6" margin={false}>
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.green, ...bodyFont }}
            >
              <Check size={13} aria-hidden="true" /> Credit — voor jou
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
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
          </Ledger>
          <Ledger className="p-6" margin={false}>
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.red, ...bodyFont }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Debet — let op
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.red }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Ledger>
        </div>
        <p className="mt-4 text-[12px] font-bold" style={{ color: tone, ...bodyFont }}>
          Match {opdracht.match}% —{" "}
          {strong ? "sterk afgestemd op jouw profiel." : "goed afgestemd op jouw profiel."}
        </p>
      </section>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-5 pt-6">
      <Ledger className="p-7 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6 pl-4">
          <div className="max-w-md">
            <Eyebrow>Verificatie · register</Eyebrow>
            <h1
              className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.01em]"
              style={{ color: C.ink, ...serif }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-bold" style={{ color: C.green }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geboekt en geverifieerd. Eén
              verloopt binnenkort en vraagt om vernieuwing. Documenten blijven versleuteld en privé.
            </p>
            <div className="mt-4 max-w-xs">
              <Meter value={ratio} tone={C.green} />
            </div>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-[2px]"
            style={{ background: C.greenSoft, border: `1px solid ${C.green}` }}
          >
            <span className="text-[28px] font-bold leading-none" style={{ color: C.green, ...num }}>
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.green, ...bodyFont }}
            >
              % op orde
            </span>
          </span>
        </div>
      </Ledger>

      <Ledger margin={false}>
        <div className="overflow-x-auto">
          <div className="min-w-[520px]">
            <div
              className="grid grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-6 py-3"
              style={{ borderBottom: `1.5px solid ${C.ink}` }}
            >
              {["Certificaat", "Status", ""].map((h, i) => (
                <span
                  key={h || i}
                  className="text-[9.5px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: C.inkMute, ...bodyFont }}
                >
                  {h}
                </span>
              ))}
            </div>
            <ul>
              {CREDENTIALS.map((c, idx) => {
                const st = statusMeta(c.status);
                const isOpen = open === c.naam;
                return (
                  <li
                    key={c.naam}
                    style={{
                      borderTop: idx === 0 ? "none" : `1px solid ${C.line}`,
                      background: idx % 2 === 1 ? C.paperAlt : "transparent",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : c.naam)}
                      aria-expanded={isOpen}
                      className="grid w-full grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-6 py-3.5 text-left transition-colors hover:bg-[#e8f0e4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a1a17] motion-reduce:transition-none"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className="inline-flex h-9 w-9 items-center justify-center rounded-[2px]"
                          style={{
                            background: st.wash,
                            border: `1px solid ${st.ink}`,
                            color: st.ink,
                          }}
                          aria-hidden="true"
                        >
                          <st.Icon size={15} />
                        </span>
                        <span className="min-w-0">
                          <span
                            className="block truncate text-[14px] font-bold"
                            style={{ color: C.ink, ...bodyFont }}
                          >
                            {c.naam}
                          </span>
                          <span
                            className="mt-0.5 block truncate text-[11.5px]"
                            style={{ color: C.inkMute }}
                          >
                            {c.detail}
                          </span>
                        </span>
                      </span>
                      <span
                        className="inline-flex w-max items-center gap-1.5 rounded-[1px] px-2 py-1 text-[11px] font-bold"
                        style={{
                          color: st.ink,
                          background: st.wash,
                          border: `1px solid ${st.ink}`,
                          ...bodyFont,
                        }}
                      >
                        <st.Icon size={11} aria-hidden="true" />
                        {st.label}
                        {st.alarm && <span className="sr-only"> (let op)</span>}
                      </span>
                      <span
                        className="justify-self-end transition-transform motion-reduce:transition-none"
                        style={{
                          color: C.inkFaint,
                          transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                        }}
                        aria-hidden="true"
                      >
                        <Plus size={15} />
                      </span>
                    </button>
                    <div
                      className="grid transition-all duration-500 motion-reduce:transition-none"
                      style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                    >
                      <div className="overflow-hidden">
                        <div className="px-6 pb-4 sm:pl-[76px]">
                          <div
                            className="rounded-[2px] p-4"
                            style={{ background: C.card, border: `1px solid ${C.line}` }}
                          >
                            <p
                              className="max-w-xl text-[13px] leading-relaxed"
                              style={{ color: C.inkSoft }}
                            >
                              {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                              expliciete toestemming gedeeld met een opdrachtgever.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <InkButton tone={c.status === "EXPIRING" ? C.amber : C.ink}>
                                {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                              </InkButton>
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
          </div>
        </div>
      </Ledger>

      <div>
        <div className="mb-3">
          <Eyebrow tone={C.blue}>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Ledger key={d.naam} className="flex items-center gap-3 p-4" margin={false}>
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[2px]"
                  style={{
                    background: C.paperAlt,
                    border: `1px solid ${C.lineStrong}`,
                    color: C.inkSoft,
                  }}
                  aria-hidden="true"
                >
                  <FileText size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold" style={{ color: C.ink }}>
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-[1px] px-2 py-1 text-[10px] font-bold"
                  style={{ color: st.ink, background: st.wash, border: `1px solid ${st.ink}` }}
                >
                  <st.Icon size={10} aria-hidden="true" />
                  {st.label}
                </span>
              </Ledger>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-5 pt-6">
      <div>
        <Eyebrow>Acties · op volgorde van urgentie</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
          style={{ color: C.ink, ...serif }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Rustig van boven naar beneden afboeken — zo blijft je register sluitend en betaald.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.blue;
          return (
            <li key={a.titel}>
              <Ledger className="p-5">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 pl-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-[2px] text-[14px] font-bold"
                    style={{ background: C.card, border: `1px solid ${tone}`, color: tone, ...num }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-[1px] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em]"
                      style={{
                        color: tone,
                        background: warn ? C.amberSoft : C.blueSoft,
                        border: `1px solid ${tone}`,
                        ...bodyFont,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <BookOpen size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[18px] font-bold leading-snug"
                      style={{ color: C.ink, ...serif }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <InkButton tone={warn ? C.amber : C.ink}>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </InkButton>
                  </div>
                </div>
              </Ledger>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTone(status: string): { ink: string; wash: string; Icon: LucideIcon | null } {
  if (status === "Openstaand") return { ink: C.red, wash: C.redSoft, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.green, wash: C.greenSoft, Icon: Check };
  return { ink: C.inkMute, wash: C.paperAlt, Icon: FileText };
}

// Facturen — het paradepaardje van dit concept: een echt debet/credit-grootboekblad.
function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-5 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Grootboek · debiteuren</Eyebrow>
          <h1
            className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
            style={{ color: C.ink, ...serif }}
          >
            Facturenboek
          </h1>
        </div>
        <InkButton tone={C.red}>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </InkButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Credit — voldaan", v: totaalBetaald, sub: "3 posten", alarm: false, tone: C.green },
          {
            l: "Debet — openstaand",
            v: "€ 1.350",
            sub: "1 post · 9 dagen",
            alarm: true,
            tone: C.red,
          },
          { l: "Concept", v: "€ 880", sub: "klaar om te boeken", alarm: false, tone: C.inkMute },
        ].map((s) => (
          <Ledger key={s.l} className="p-5" margin={false}>
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {s.l}
              </p>
              {s.alarm && <AlertTriangle size={14} aria-hidden="true" style={{ color: C.red }} />}
            </div>
            <p
              className="mt-2 text-[26px] font-bold tracking-[-0.01em]"
              style={{ color: s.tone, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Ledger>
        ))}
      </section>

      <Ledger margin={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left">
            <caption className="sr-only">Facturen met debet- en credit-boekingen</caption>
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${C.ink}` }}>
                {[
                  { h: "Nummer", a: "left" },
                  { h: "Debiteur", a: "left" },
                  { h: "Datum", a: "left" },
                  { h: "Status", a: "left" },
                  { h: "Debet", a: "right" },
                  { h: "Credit", a: "right" },
                ].map((c) => (
                  <th
                    key={c.h}
                    className={`px-4 py-2.5 text-[9.5px] font-bold uppercase tracking-[0.14em] ${c.a === "right" ? "text-right" : ""}`}
                    style={{
                      color: C.inkMute,
                      borderRight: c.h === "Debet" ? `1px solid ${C.line}` : "none",
                      ...bodyFont,
                    }}
                    scope="col"
                  >
                    {c.h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const ft = factuurTone(f.status);
                const debet = f.status === "Openstaand";
                const credit = f.status === "Betaald";
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#e8f0e4]"
                    style={{
                      background: i % 2 === 1 ? C.paperAlt : "transparent",
                      borderBottom: `1px solid ${C.line}`,
                    }}
                  >
                    <td
                      className="px-4 py-3 text-[11.5px] font-bold"
                      style={{ color: C.inkMute, ...num }}
                    >
                      {f.nr}
                    </td>
                    <td
                      className="px-4 py-3 text-[13.5px] font-bold"
                      style={{ color: C.ink, ...bodyFont }}
                    >
                      {f.klant}
                    </td>
                    <td className="px-4 py-3 text-[11.5px]" style={{ color: C.inkMute, ...num }}>
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[1px] px-2 py-1 text-[10.5px] font-bold"
                        style={{
                          color: ft.ink,
                          background: ft.wash,
                          border: `1px solid ${ft.ink}`,
                          ...bodyFont,
                        }}
                      >
                        {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                        {f.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[13.5px] font-bold"
                      style={{
                        color: debet ? C.red : C.inkFaint,
                        borderRight: `1px solid ${C.line}`,
                        borderLeft: `1px solid ${C.line}`,
                        ...num,
                      }}
                    >
                      {debet ? eur(f.bedrag) : "—"}
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[13.5px] font-bold"
                      style={{ color: credit ? C.green : C.inkFaint, ...num }}
                    >
                      {credit ? eur(f.bedrag) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `2px solid ${C.ink}` }}>
                <td
                  className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.18em]"
                  colSpan={4}
                  style={{ color: C.inkMute, ...bodyFont }}
                >
                  <span className="inline-flex items-center gap-2">
                    <Scale size={13} aria-hidden="true" style={{ color: C.ink }} /> Saldo per
                    rekening
                  </span>
                </td>
                <td
                  className="px-4 py-3.5 text-right text-[15px] font-bold"
                  style={{
                    color: C.red,
                    borderRight: `1px solid ${C.line}`,
                    borderLeft: `1px solid ${C.line}`,
                    ...num,
                  }}
                >
                  € 1.350
                </td>
                <td
                  className="px-4 py-3.5 text-right text-[15px] font-bold"
                  style={{ color: C.green, ...num }}
                >
                  {totaalBetaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Ledger>
    </div>
  );
}
