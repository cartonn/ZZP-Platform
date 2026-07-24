"use client";

// Concept 454 — "Apotheek" · Receptuur-etiketten & amberglas.
// Apotheek/receptuur-esthetiek als metafoor voor certificaat-verificatie en vertrouwen:
// amberglas-bruin #7c4a1e, kraft-etiket crème, apotheker-groen #1f6b4f, gestempelde
// "geverifieerd"-zegels en receptuur-etiketten met hairline-kaders en klassieke seriftitels.
// Warm papier als grond; credentials ogen als potjes/etiketten met zegel. Klassiek-clean.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Clock,
  FileText,
  FlaskConical,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  Stamp,
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
  DOCUMENTEN,
  BERICHTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: warm apotheekpapier, amberglas, apotheker-groen —
const C = {
  paper: "#f4ecdd",
  paperDeep: "#ede1cc",
  label: "#fbf6ec",
  labelEdge: "#e4d6bd",
  amber: "#7c4a1e",
  amberDeep: "#5e3612",
  amberHi: "#a9702f",
  amberGlass: "rgba(124,74,30,0.10)",
  green: "#1f6b4f",
  greenDeep: "#164e39",
  greenHi: "#2f8a68",
  greenWash: "rgba(31,107,79,0.12)",
  ink: "#33240f",
  inkSoft: "#5a4325",
  inkMute: "#8a6f4c",
  inkFaint: "#a89066",
  line: "rgba(124,74,30,0.28)",
  lineSoft: "rgba(124,74,30,0.14)",
  // status
  ok: "#1f6b4f",
  okInk: "#164e39",
  okWash: "rgba(31,107,79,0.13)",
  warn: "#b5731a",
  warnInk: "#8a5610",
  warnWash: "rgba(181,115,26,0.15)",
  info: "#5a4325",
  infoInk: "#5a4325",
  infoWash: "rgba(90,67,37,0.10)",
  bad: "#a33921",
  badInk: "#822b17",
  badWash: "rgba(163,57,33,0.13)",
};

const serif = {
  fontFamily: "'Fraunces', 'Spectral', 'Iowan Old Style', Georgia, 'Times New Roman', serif",
};
const body = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Inter', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

// Fijne apotheek-papierkorrel op de grond.
function paperGrain(color: string): React.CSSProperties {
  return {
    backgroundColor: color,
    backgroundImage:
      "radial-gradient(rgba(124,74,30,0.05) 0.5px, transparent 0.5px)," +
      "radial-gradient(rgba(124,74,30,0.035) 0.5px, transparent 0.5px)",
    backgroundSize: "7px 7px, 13px 13px",
    backgroundPosition: "0 0, 4px 6px",
  };
}

// — Gestempeld "geverifieerd"-zegel: ronde apotheekstempel met dubbele ring —
function VerifiedStamp({
  size = 62,
  tone = C.green,
  id,
}: {
  size?: number;
  tone?: string;
  id: string;
}) {
  const r = size / 2;
  const inner = r - 6;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <defs>
        <path
          id={`ring-${id}`}
          d={`M ${r} ${r} m -${inner} 0 a ${inner} ${inner} 0 1 1 ${inner * 2} 0 a ${inner} ${inner} 0 1 1 -${inner * 2} 0`}
          fill="none"
        />
      </defs>
      <circle
        cx={r}
        cy={r}
        r={r - 1.5}
        fill="none"
        stroke={tone}
        strokeWidth="1.4"
        opacity="0.75"
      />
      <circle cx={r} cy={r} r={r - 4} fill="none" stroke={tone} strokeWidth="0.7" opacity="0.5" />
      <text
        fill={tone}
        style={{ ...body, fontSize: 6.4, fontWeight: 700, letterSpacing: "0.18em" }}
      >
        <textPath href={`#ring-${id}`} startOffset="2%">
          · GEVERIFIEERD · APOTHEEK · ZZP ·
        </textPath>
      </text>
      <g transform={`translate(${r} ${r})`}>
        <ShieldCheck x={-9} y={-9} width={18} height={18} color={tone} />
      </g>
    </svg>
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  ink: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        tone: C.ok,
        ink: C.okInk,
        wash: C.okWash,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        tone: C.info,
        ink: C.infoInk,
        wash: C.infoWash,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.warn,
        ink: C.warnInk,
        wash: C.warnWash,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.bad,
        ink: C.badInk,
        wash: C.badWash,
      };
  }
}

// — Kraft-etiket: crème kaart met hairline-dubbelkader, als receptuur-etiket —
function Label({
  children,
  className = "",
  as: Tag = "div",
  tint = "label",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
  tint?: "label" | "amber" | "green";
}) {
  const bg = { label: C.label, amber: "#f0e2c8", green: "#e8efe6" }[tint];
  const edge = { label: C.line, amber: C.amber, green: C.green }[tint];
  return (
    <Tag
      className={`relative rounded-[6px] ${className}`}
      style={{
        background: bg,
        border: `1px solid ${edge}`,
        boxShadow: `0 0 0 3px ${bg}, 0 0 0 3.7px ${C.lineSoft}, 0 6px 16px rgba(94,54,18,0.10)`,
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

function Rx({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em]"
      style={{ color: C.amberHi, ...body }}
    >
      <span style={{ ...serif, fontStyle: "italic", fontSize: 15, lineHeight: 0 }}>℞</span>
      {children}
    </p>
  );
}

function PrimaryButton({
  children,
  onClick,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-[5px] px-5 py-2.5 text-[13px] font-semibold transition-all duration-200 hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6b4f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4ecdd] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: C.label,
        backgroundImage: `linear-gradient(180deg, ${C.greenHi}, ${C.green} 55%, ${C.greenDeep})`,
        border: `1px solid ${C.greenDeep}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.18) inset, 0 2px 5px rgba(22,78,57,0.28)",
        ...body,
      }}
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
      className={`inline-flex items-center justify-center gap-2 rounded-[5px] px-4 py-2.5 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6b4f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4ecdd] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.label : C.inkSoft,
        background: active ? C.amber : C.label,
        border: `1px solid ${active ? C.amberDeep : C.line}`,
        ...body,
      }}
    >
      {children}
    </button>
  );
}

// — Amber-sparkline: apothekersgroene lijn onder amberwash —
function AmberLine({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 32;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 9) - 4;
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
        <linearGradient id={`ap-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.22" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#ap-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={C.label} stroke={tone} strokeWidth="1.6" />
    </svg>
  );
}

function Dose({ value, tone = C.green }: { value: number; tone?: string }) {
  return (
    <span className="hidden items-center gap-2.5 sm:flex" aria-hidden="true">
      <span
        className="relative h-2 w-24 overflow-hidden rounded-full"
        style={{ background: C.paperDeep, border: `1px solid ${C.lineSoft}` }}
      >
        <span
          className="block h-full rounded-full"
          style={{
            width: `${value}%`,
            background: tone,
            transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </span>
      <span className="text-[12.5px] font-semibold" style={{ color: tone, ...num }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept454() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...body, color: C.ink, ...paperGrain(C.paper) }}
    >
      <style>{`
        @keyframes apRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .ap-rise { animation: apRise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .ap-rise { animation: none !important; } }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="ap-rise pt-7">
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
    <header className="flex items-center justify-between gap-4 pt-8">
      <div className="flex items-center gap-3.5">
        <span
          className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-[8px]"
          style={{ background: "#efe0c4", border: `1px solid ${C.amber}` }}
          aria-hidden="true"
        >
          <FlaskConical size={22} color={C.amber} />
        </span>
        <div>
          <p className="text-[20px] font-semibold leading-none" style={{ color: C.ink, ...serif }}>
            Apotheek
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute, ...body }}>
            {PROFIEL.plaats} · receptuur &amp; verificatie
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{
            color: C.okInk,
            border: `1px solid ${C.green}`,
            background: C.greenWash,
            ...body,
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-[7px]"
          style={{ background: C.label, border: `1px solid ${C.line}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.amber, color: C.label, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[14px] font-semibold" style={{ color: C.ink, ...body }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.inkMute, ...body }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-[8px] text-[13px] font-semibold"
          style={{
            background: C.amberGlass,
            border: `1px solid ${C.amber}`,
            color: C.amber,
            ...body,
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
    <nav aria-label="Hoofdnavigatie" className="mt-7">
      <div
        className="flex items-center gap-1 overflow-x-auto rounded-[7px] p-1.5"
        style={{ background: C.label, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="flex shrink-0 items-center gap-2 rounded-[5px] px-4 py-2 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6b4f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf6ec] motion-reduce:transition-none"
              style={{
                color: on ? C.label : C.inkMute,
                backgroundImage: on ? `linear-gradient(180deg, ${C.amberHi}, ${C.amber})` : "none",
                ...body,
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
    <div className="space-y-7">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Label className="p-7 md:p-9" tint="amber">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Rx>Vandaag · aangemaakt</Rx>
              <h1
                className="mt-4 text-[32px] font-semibold leading-[1.06] tracking-[-0.01em] md:text-[44px]"
                style={{ color: C.ink, ...serif }}
              >
                Goedemorgen,
                <br />
                {PROFIEL.naam.split(" ")[0]}.
              </h1>
            </div>
            <VerifiedStamp size={62} tone={C.amber} id="d1" />
          </div>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            Jouw praktijk als zorgvuldig samengestelde receptuur: elk certificaat geverifieerd, elk
            potje gezegeld, alles op orde bewaard. Loop rustig langs je acties van vandaag.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <PrimaryButton onClick={onActies}>
              Volgende actie
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </PrimaryButton>
            <GhostButton onClick={onOpen}>Marktplaats</GhostButton>
          </div>
        </Label>

        <Label className="p-7" tint="green">
          <div className="flex items-center justify-between">
            <Rx>Vraagt aandacht</Rx>
            <AlertTriangle size={18} aria-hidden="true" style={{ color: C.warn }} />
          </div>
          <h2
            className="mt-4 text-[20px] font-semibold leading-snug"
            style={{ color: C.ink, ...serif }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-6">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <div className="my-4 h-px" style={{ background: C.line }} />
          <p className="flex items-center gap-2 text-[12px]" style={{ color: C.inkMute, ...num }}>
            <Check size={13} aria-hidden="true" style={{ color: C.green }} />
            {verified}/{CREDENTIALS.length} certificaten gezegeld · 7 open reacties
          </p>
        </Label>
      </section>

      <section>
        <div className="mb-4">
          <Rx>Meetwaarden · deze maand</Rx>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Label key={k.label} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: C.inkMute, ...body }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded-[4px] px-1.5 py-0.5 text-[9.5px] font-bold"
                  style={{
                    color: k.up ? C.okInk : C.warnInk,
                    background: k.up ? C.okWash : C.warnWash,
                    ...num,
                  }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-3 text-[27px] font-semibold leading-none tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <AmberLine data={k.spark} tone={k.up ? C.green : C.amber} id={`k454-${i}`} />
              </div>
            </Label>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <Rx>Op de toonbank · opdrachten</Rx>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6b4f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4ecdd]"
              style={{ color: C.green, ...body }}
            >
              Alle →
            </button>
          </div>
          <Label>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f4ead4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1f6b4f] motion-reduce:transition-none"
                  >
                    <span
                      className="inline-flex h-11 w-11 items-center justify-center rounded-[6px]"
                      style={{
                        background: i === 0 ? C.greenWash : C.paperDeep,
                        border: `1px solid ${i === 0 ? C.green : C.line}`,
                      }}
                    >
                      <span
                        className="text-[12px] font-bold leading-none"
                        style={{ color: i === 0 ? C.green : C.inkMute, ...num }}
                      >
                        {o.match}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.ink, ...body }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12px]"
                        style={{ color: C.inkMute }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <Dose value={o.match} tone={o.match >= 90 ? C.green : C.amber} />
                      <ChevronRight
                        size={17}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: C.inkFaint }}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Label>
        </div>

        <div>
          <div className="mb-4">
            <Rx>Etikettenkast · certificaten</Rx>
          </div>
          <Label className="p-5">
            <ul className="space-y-1">
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-[6px]"
                      style={{ background: st.wash, border: `1px solid ${st.tone}`, color: st.ink }}
                      aria-hidden="true"
                    >
                      <st.Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span className="block truncate text-[10.5px]" style={{ color: C.inkMute }}>
                        {st.label}
                      </span>
                    </span>
                    {c.status === "VERIFIED" && (
                      <Stamp size={15} aria-hidden="true" style={{ color: C.green }} />
                    )}
                  </li>
                );
              })}
            </ul>
          </Label>
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
    <div className="space-y-7">
      <div>
        <Rx>Marktplaats</Rx>
        <h1
          className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.01em]"
          style={{ color: C.ink, ...serif }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkMute, ...num }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten beschikbaar
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[6px] px-5 py-3"
          style={{ background: C.label, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a89066]"
            style={{ color: C.ink, ...body }}
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
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Label className="p-6">
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24 rounded-full" style={{ background: C.paperDeep }} />
                  <div className="h-5 w-2/3 rounded-full" style={{ background: C.labelEdge }} />
                  <div className="h-3 w-1/2 rounded-full" style={{ background: C.paperDeep }} />
                  <div className="h-2 w-full rounded-full" style={{ background: C.paperDeep }} />
                </div>
              </Label>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Label className="p-6" tint="amber">
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: C.label, border: `1px solid ${C.amber}`, color: C.amber }}
              aria-hidden="true"
            >
              <FlaskConical size={26} />
            </span>
            <p className="mt-5 text-[22px] font-semibold" style={{ color: C.ink, ...serif }}>
              Lege receptuur
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.inkSoft }}>
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm en probeer
              opnieuw.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Label>
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
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  const tone = strong ? C.green : C.amber;
  return (
    <Label className="p-6">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
            >
              № {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[19px] font-semibold leading-snug"
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
                className="inline-flex items-center rounded-[4px] px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{
                  color: C.inkSoft,
                  background: C.paperDeep,
                  border: `1px solid ${C.lineSoft}`,
                  ...body,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="relative inline-flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.label, border: `1.5px solid ${tone}` }}
          >
            <span className="absolute inset-0 flex items-center justify-center opacity-40">
              <VerifiedStamp size={58} tone={tone} id={`m${index}`} />
            </span>
            <span className="relative flex flex-col items-center">
              <span className="text-[16px] font-bold leading-none" style={{ color: tone, ...num }}>
                {opdracht.match}
              </span>
              <span
                className="mt-0.5 text-[7.5px] uppercase tracking-[0.12em]"
                style={{ color: C.inkFaint, ...body }}
              >
                match
              </span>
            </span>
          </span>
          <span className="text-[13px] font-bold" style={{ color: tone, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-[5px] px-3.5 py-1.5 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6b4f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf6ec]"
          style={{ color: tone, border: `1px solid ${C.line}`, ...body }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Bijsluiter: waarom deze match
        </button>
        <div className="ml-auto">
          <PrimaryButton onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </PrimaryButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="Werkt goed"
              tone={C.okInk}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Let op"
              tone={C.warnInk}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Label>
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
      className="rounded-[5px] p-4"
      style={{ background: C.paperDeep, border: `1px solid ${C.lineSoft}` }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: tone, ...body }}
      >
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
  const tone = strong ? C.green : C.amber;
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-[5px] px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6b4f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4ecdd]"
        style={{ color: C.inkSoft, border: `1px solid ${C.line}`, background: C.label, ...body }}
      >
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Label className="p-7 md:p-9" tint="amber">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-[4px] px-2.5 py-0.5 text-[10.5px] font-semibold"
            style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-[4px] px-2.5 py-0.5 text-[11px] font-bold"
            style={{
              color: C.label,
              backgroundImage: `linear-gradient(180deg, ${C.amberHi}, ${C.amber})`,
              ...body,
            }}
          >
            <Stamp size={11} aria-hidden="true" /> {strong ? "Sterke match" : "Goede match"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[30px] font-semibold leading-[1.08] tracking-[-0.01em] md:text-[42px]"
          style={{ color: C.ink, ...serif }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: C.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <PrimaryButton>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </PrimaryButton>
          <GhostButton>Bewaren</GhostButton>
        </div>
      </Label>

      <Label>
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
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.lineSoft}`,
                borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...body }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-semibold tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Label>

      <section>
        <Rx>Bijsluiter · verklaarbare matching</Rx>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgelezen van je geverifieerde profiel — wat je meebrengt én waar de aandacht ligt,
          transparant en zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Label className="p-6" tint="green">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-[6px]"
                style={{ color: C.okInk, background: C.okWash, border: `1px solid ${C.ok}` }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.okInk, ...body }}
              >
                Werkt goed
              </p>
            </div>
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
                    style={{ color: C.okInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Label>
          <Label className="p-6">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-[6px]"
                style={{ color: C.warnInk, background: C.warnWash, border: `1px solid ${C.warn}` }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.warnInk, ...body }}
              >
                Let op
              </p>
            </div>
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
                    style={{ color: C.warnInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Label>
        </div>
        <div className="mt-4">
          <span className="text-[12px]" style={{ color: tone, ...body }}>
            Match {opdracht.match}% —{" "}
            {strong ? "sterk afgestemd op jouw profiel." : "goed afgestemd op jouw profiel."}
          </span>
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
      <Label className="p-7 md:p-9" tint="amber">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Rx>Verificatie · veilig bewaard</Rx>
            <h1
              className="mt-3 text-[28px] font-semibold leading-tight tracking-[-0.01em]"
              style={{ color: C.ink, ...serif }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-semibold" style={{ color: C.green }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn gezegeld. Eén verloopt
              binnenkort en vraagt om vernieuwing. Documenten blijven versleuteld en privé bewaard,
              als achter amberglas.
            </p>
            <div className="mt-4 max-w-xs">
              <Dose value={ratio} tone={C.green} />
            </div>
          </div>
          <span
            className="relative inline-flex h-24 w-24 items-center justify-center rounded-full"
            style={{ background: C.label, border: `1.5px solid ${C.green}` }}
          >
            <span className="absolute inset-0 flex items-center justify-center opacity-50">
              <VerifiedStamp size={90} tone={C.green} id="vratio" />
            </span>
            <span className="relative flex flex-col items-center">
              <span
                className="text-[26px] font-semibold leading-none"
                style={{ color: C.green, ...num }}
              >
                {ratio}
              </span>
              <span
                className="mt-1 text-[8px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...body }}
              >
                % op orde
              </span>
            </span>
          </span>
        </div>
      </Label>

      <Label>
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-6 py-3.5 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9.5px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: C.inkMute, ...body }}
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
                style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[#f4ead4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1f6b4f] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-[6px]"
                      style={{ background: st.wash, border: `1px solid ${st.tone}`, color: st.ink }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.ink, ...body }}
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
                  <span className="hidden sm:flex">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[11px] font-semibold"
                      style={{
                        color: st.ink,
                        background: st.wash,
                        border: `1px solid ${st.tone}`,
                        ...body,
                      }}
                    >
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </span>
                  </span>
                  <span
                    className="hidden justify-self-end transition-transform motion-reduce:transition-none sm:block"
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
                    <div className="px-6 pb-5 sm:pl-[76px]">
                      <div
                        className="rounded-[5px] p-4"
                        style={{ background: C.paperDeep, border: `1px solid ${C.lineSoft}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <PrimaryButton>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </PrimaryButton>
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
      </Label>

      <div>
        <div className="mb-4">
          <Rx>Documentenkast · amberglas</Rx>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Label key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-[6px]"
                  style={{
                    background: C.paperDeep,
                    border: `1px solid ${C.line}`,
                    color: C.inkSoft,
                  }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13px] font-semibold"
                    style={{ color: C.ink }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-[4px] px-2 py-1 text-[10px] font-semibold"
                  style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}` }}
                >
                  <st.Icon size={10} aria-hidden="true" />
                  {st.label}
                </span>
              </Label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <div>
        <Rx>Acties · op volgorde van urgentie</Rx>
        <h1
          className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.01em]"
          style={{ color: C.ink, ...serif }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Rustig van boven naar beneden — zo blijf je verifieerbaar en betaald, keurig op orde.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.green;
          const ink = warn ? C.warnInk : C.okInk;
          const wash = warn ? C.warnWash : C.greenWash;
          return (
            <li key={a.titel}>
              <Label className="p-6">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-[7px] text-[15px] font-bold"
                    style={{ background: wash, border: `1.5px solid ${tone}`, color: ink, ...num }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: ink, background: wash, border: `1px solid ${tone}`, ...body }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <FlaskConical size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[19px] font-semibold leading-snug"
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
                    <PrimaryButton>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </PrimaryButton>
                  </div>
                </div>
              </Label>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTone(status: string): {
  ink: string;
  wash: string;
  tone: string;
  Icon: LucideIcon | null;
} {
  if (status === "Openstaand")
    return { ink: C.warnInk, wash: C.warnWash, tone: C.warn, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.okInk, wash: C.okWash, tone: C.ok, Icon: Check };
  return { ink: C.inkMute, wash: C.paperDeep, tone: C.line, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Rx>Facturen · kasboek</Rx>
          <h1
            className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.01em]"
            style={{ color: C.ink, ...serif }}
          >
            Facturen
          </h1>
        </div>
        <PrimaryButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false },
        ].map((s) => (
          <Label key={s.l} className="p-6">
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute, ...body }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: C.warnWash, color: C.warnInk }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[27px] font-semibold tracking-[-0.01em]"
              style={{ color: s.alarm ? C.warnInk : C.ink, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Label>
        ))}
      </section>

      <Label>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-6 pb-3 pt-5 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-semibold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.inkMute, ...body }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f, i) => {
            const ft = factuurTone(f.status);
            const acc = f.status === "Openstaand";
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-6 py-4 transition-colors hover:bg-[#f4ead4] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="order-1 text-[11.5px] font-semibold"
                  style={{ color: C.inkMute, ...num }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-semibold sm:order-2"
                  style={{ color: C.ink, ...body }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11.5px] sm:order-3 sm:inline"
                  style={{ color: C.inkMute, ...num }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[10.5px] font-semibold"
                    style={{
                      color: ft.ink,
                      background: ft.wash,
                      border: `1px solid ${ft.tone}`,
                      ...body,
                    }}
                  >
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-bold sm:order-5"
                  style={{ color: acc ? C.warnInk : C.ink, ...num }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-6 py-4"
          style={{ borderTop: `1px solid ${C.lineSoft}` }}
        >
          <span
            className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: C.inkMute, ...body }}
          >
            <Check size={12} aria-hidden="true" style={{ color: C.green }} /> Totaal betaald
          </span>
          <span className="text-[20px] font-semibold" style={{ color: C.ink, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </Label>
    </div>
  );
}
