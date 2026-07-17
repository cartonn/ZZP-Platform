"use client";

// Concept 378 — "Seismograaf" · Analoge registratiestrook / trommelregistratie.
// Analoge trommelregistratie op papier: een continue inktlijn-registratie op een crème/lichtgele
// papierstrook met roodbruine inkt, fijne tijd-/schaalverdeling en amplitude = activiteit. De
// next-actions verschijnen als seismogram-uitslagen op een tijdstrook, credential-historie als
// registratielijn en pieken markeren belangrijke gebeurtenissen. Palet: papier-crème (#f4efe0),
// roodbruine inkt (#7a2f22), warme sepia (#a56a4a), dof groen-zegel (#3f6d4e). Warm, wetenschappelijk.
// Fonts: Special Elite (machinaal), Inter (body), IBM Plex Mono (schaal).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Plus,
  Minus,
  Waves,
  Radio,
  Gauge,
  ChevronRight,
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
  BERICHTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: warm papier-crème met roodbruine inkt, sepia en dof zegel-groen —
const C = {
  paper: "#f4efe0",
  paperDeep: "#ece4cf",
  card: "#faf6ec",
  cardSoft: "#f0e9d6",
  ink: "#3a2c22",
  inkSoft: "#5c4636",
  muted: "#7d6550",
  faint: "#a08a72",
  rust: "#7a2f22",
  rustSoft: "#a5533f",
  sepia: "#a56a4a",
  seal: "#3f6d4e",
  amber: "#b8862f",
  line: "rgba(58,44,34,0.16)",
  lineSoft: "rgba(58,44,34,0.09)",
  rule: "rgba(122,47,34,0.14)",
};

const stamp = {
  fontFamily: "var(--font-lab-special-elite), var(--font-lab-architects), Georgia, serif",
};
const body = { fontFamily: "var(--font-lab-inter), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

// Status → registratie-conditie op de strook.
function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  color: string;
  code: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Vastgelegd", Icon: Check, alarm: false, color: C.seal, code: "REG" };
    case "SUBMITTED":
      return {
        label: "Wordt geregistreerd",
        Icon: Clock,
        alarm: false,
        color: C.sepia,
        code: "REC",
      };
    case "EXPIRING":
      return {
        label: "Uitslag zakt",
        Icon: AlertTriangle,
        alarm: true,
        color: C.amber,
        code: "LOW",
      };
    case "REJECTED":
      return {
        label: "Registratie gestopt",
        Icon: XCircle,
        alarm: true,
        color: C.rust,
        code: "END",
      };
  }
}

// Pseudo-tijdstempel afgeleid van een string — registratie-referentie.
function tijdstip(seed: string): string {
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n * 31 + seed.charCodeAt(i)) % 9999;
  const h = String(n % 24).padStart(2, "0");
  const m = String(n % 60).padStart(2, "0");
  return `${h}:${m} UT`;
}

// — Seismogram-registratielijn: continue inktlijn met bevingen op de piek-indices —
function Seismogram({
  data,
  color = C.rust,
  w = 300,
  h = 64,
  peaks = [],
}: {
  data: number[];
  color?: string;
  w?: number;
  h?: number;
  peaks?: number[];
}) {
  const mid = h / 2;
  // Bouw een dichte, trillende registratielijn; op piek-indices grotere amplitude.
  const samples = 120;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    const idx = t * (data.length - 1);
    const base = data[Math.round(idx)] ?? 0;
    const nearPeak = peaks.some((p) => Math.abs(idx - p) < 0.6);
    const jitterAmp = nearPeak ? 0.9 : 0.18 + (base / 12) * 0.4;
    const wobble = Math.sin(i * 1.7) * 0.5 + Math.sin(i * 0.6) * 0.5;
    const spike = nearPeak ? Math.sin(i * 4.3) : 0;
    const y = mid - (wobble * jitterAmp + spike * 0.7) * (h * 0.38);
    pts.push({ x: t * (w - 8) + 4, y });
  }
  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="block"
    >
      {/* fine time ruling */}
      {Array.from({ length: 13 }, (_, i) => (
        <line
          key={i}
          x1={(w / 12) * i}
          y1={0}
          x2={(w / 12) * i}
          y2={h}
          stroke={C.rule}
          strokeWidth={i % 6 === 0 ? 0.9 : 0.5}
        />
      ))}
      <line x1={0} y1={mid} x2={w} y2={mid} stroke={C.rule} strokeWidth="0.7" />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.92"
      />
      {peaks.map((p, i) => {
        const x = (p / (data.length - 1)) * (w - 8) + 4;
        return (
          <line
            key={i}
            x1={x}
            y1={4}
            x2={x}
            y2={h - 4}
            stroke={C.rust}
            strokeWidth="0.7"
            strokeDasharray="2 3"
            opacity="0.5"
          />
        );
      })}
    </svg>
  );
}

// — Amplitude-schaal (dichte tick-liniaal) —
function ScaleRule({ n = 40 }: { n?: number }) {
  return (
    <div className="flex items-end gap-[4px]" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => {
        const major = i % 5 === 0;
        return (
          <span
            key={i}
            className="w-px"
            style={{ height: major ? 11 : 6, background: major ? C.line : C.lineSoft }}
          />
        );
      })}
    </div>
  );
}

// — Uitslag-meter (Richter-achtige magnitude-balk) —
function Magnitude({ pct, color = C.rust }: { pct: number; color?: string }) {
  const cells = 20;
  const on = Math.round((pct / 100) * cells);
  return (
    <div className="flex items-center gap-[3px]" aria-hidden="true">
      {Array.from({ length: cells }, (_, i) => (
        <span
          key={i}
          className="w-1.5 rounded-[1px]"
          style={{
            height: 6 + (i / cells) * 10,
            background: i < on ? (i > cells - 4 ? C.amber : color) : C.lineSoft,
          }}
        />
      ))}
    </div>
  );
}

// Papiervezel-textuur + horizontale registratie-liniatuur.
const paperTexture: React.CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(0deg, rgba(122,47,34,0.035) 0 1px, transparent 1px 28px), radial-gradient(circle at 20% 10%, rgba(165,106,74,0.06), transparent 45%), radial-gradient(circle at 90% 80%, rgba(58,44,34,0.05), transparent 40%)",
};

function Label({ children, color = C.rust }: { children: React.ReactNode; color?: string }) {
  return (
    <p
      className="inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.24em]"
      style={{ color, ...mono }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden="true" />
      {children}
    </p>
  );
}

function Stempel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10.5px] tabular-nums"
      style={{ color: C.faint, ...mono }}
    >
      <Radio size={11} aria-hidden="true" style={{ color: C.sepia }} />
      {children}
    </span>
  );
}

function Chip({ children, color = C.sepia }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]"
      style={{ color, border: `1px solid ${color}`, ...mono }}
    >
      {children}
    </span>
  );
}

function Sheet({
  children,
  className = "",
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        borderLeft: accent ? `3px solid ${accent}` : `1px solid ${C.line}`,
        boxShadow: "0 1px 0 rgba(58,44,34,0.05)",
      }}
    >
      {children}
    </div>
  );
}

export function Concept378() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ ...body, background: C.paper, color: C.ink, ...paperTexture }}
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pb-20 pt-8">
          {screen === "dashboard" && (
            <Dashboard onOpen={() => setScreen("opdracht")} goActies={() => setScreen("acties")} />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties />}
          {screen === "facturen" && <Facturen />}
        </main>
        <FooterRail />
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <header
      className="flex items-center justify-between border-b py-6"
      style={{ borderColor: C.ink }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-sm"
          style={{ border: `1.5px solid ${C.rust}`, background: C.cardSoft }}
          aria-hidden="true"
        >
          <Waves size={20} color={C.rust} />
        </span>
        <div>
          <p
            className="text-[20px] font-semibold leading-none tracking-[0.01em]"
            style={{ ...stamp, color: C.rust }}
          >
            SEISMOGRAAF
          </p>
          <p
            className="mt-1.5 text-[10px] uppercase leading-none tracking-[0.26em]"
            style={{ color: C.muted, ...mono }}
          >
            Station {PROFIEL.plaats} · {tijdstip(PROFIEL.naam)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span
          className="hidden items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] sm:inline-flex"
          style={{ color: C.seal, border: `1px solid ${C.seal}`, ...mono }}
        >
          <Stamp size={11} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span className="hidden text-right sm:block">
          <span
            className="block text-[12px] font-medium leading-tight"
            style={{ color: C.ink, ...body }}
          >
            {PROFIEL.naam}
          </span>
          <span className="block text-[10px] leading-tight" style={{ color: C.faint, ...mono }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-sm text-[11px]"
          style={{ border: `1px solid ${C.rust}`, color: C.rust, ...mono }}
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
      className="flex items-center gap-0 overflow-x-auto border-b"
      style={{ borderColor: C.line }}
      aria-label="Hoofdnavigatie"
    >
      {SCREENS.map((s, i) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="relative shrink-0 px-4 py-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              color: on ? C.rust : C.muted,
              ...stamp,
              ["--tw-ring-color" as string]: C.rust,
            }}
          >
            <span
              className="mr-2 text-[10px] tabular-nums"
              style={{ color: on ? C.sepia : C.faint, ...mono }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            {s.label}
            {on && (
              <span
                className="absolute inset-x-3 -bottom-px h-0.5"
                style={{ background: C.rust }}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function Dashboard({ onOpen, goActies }: { onOpen: () => void; goActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const reg = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-12">
      <section className="grid grid-cols-1 gap-8 md:grid-cols-[1.4fr_1fr]">
        <div className="self-center">
          <Label color={C.sepia}>Registratie · vandaag</Label>
          <h1
            className="mt-5 text-[36px] font-semibold leading-[1.06] tracking-[-0.01em] md:text-[46px]"
            style={{ ...stamp, color: C.ink }}
          >
            Goedemorgen,
            <br />
            <span style={{ color: C.rust }}>{PROFIEL.naam.split(" ")[0]}</span>.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
            De strook loopt rustig door. Eén uitslag vraagt aandacht — handel hem af en de lijn
            registreert vandaag weer vlak verder.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Magnitude pct={reg} />
            <span className="text-[12px] tabular-nums" style={{ color: C.rust, ...mono }}>
              {reg}% vastgelegd
            </span>
          </div>
          <div className="mt-5">
            <ScaleRule />
          </div>
        </div>

        <Sheet className="relative overflow-hidden p-5" accent={C.rust}>
          <div className="mb-3 flex items-center justify-between">
            <Label color={C.rust}>Registratie-piek</Label>
            <Stempel>{tijdstip(primair.titel)}</Stempel>
          </div>
          <div className="overflow-hidden rounded-sm" style={{ background: C.paperDeep }}>
            <Seismogram data={[4, 6, 5, 9, 5, 7]} peaks={[3]} color={C.rust} h={68} />
          </div>
          <h2
            className="mt-4 text-[18px] font-semibold leading-snug"
            style={{ ...stamp, color: C.ink }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.muted }}>
            {primair.detail}
          </p>
          <button
            onClick={goActies}
            className="group mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold transition-all hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.rust,
              color: C.paper,
              ...stamp,
              ["--tw-ring-color" as string]: C.sepia,
            }}
          >
            {primair.cta}
            <ArrowRight
              size={15}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </button>
        </Sheet>
      </section>

      <section>
        <div
          className="mb-5 flex items-baseline justify-between border-b pb-2"
          style={{ borderColor: C.line }}
        >
          <Label>Meetkanalen · registratie</Label>
          <Stempel>tijdbasis 1 mm/s</Stempel>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {KPIS.map((k, idx) => {
            const col = k.up ? C.seal : C.amber;
            return (
              <Sheet key={k.label} className="p-5" accent={col}>
                <div className="flex items-start justify-between">
                  <div>
                    <p
                      className="text-[10px] uppercase tracking-[0.12em]"
                      style={{ color: C.muted, ...mono }}
                    >
                      Kanaal {idx + 1} · {k.label}
                    </p>
                    <p
                      className="mt-1.5 text-[30px] font-semibold tabular-nums leading-none tracking-[-0.01em]"
                      style={{ ...stamp, color: C.ink }}
                    >
                      {k.value}
                    </p>
                  </div>
                  <span
                    className="text-[11px] tabular-nums"
                    style={{ color: k.up ? C.seal : C.rust, ...mono }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <div
                  className="mt-3 overflow-hidden rounded-sm"
                  style={{ background: C.paperDeep }}
                >
                  <Seismogram data={k.spark} peaks={[k.spark.length - 1]} color={col} h={58} />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className="text-[9.5px] uppercase tracking-[0.12em]"
                    style={{ color: C.faint, ...mono }}
                  >
                    piek {Math.max(...k.spark).toFixed(0)} · dal {Math.min(...k.spark).toFixed(0)}
                  </span>
                  <Magnitude
                    pct={Math.min(100, (k.spark[k.spark.length - 1] ?? 0) * (k.up ? 10 : 12))}
                    color={col}
                  />
                </div>
              </Sheet>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div
            className="mb-5 flex items-baseline justify-between border-b pb-2"
            style={{ borderColor: C.line }}
          >
            <Label>Geregistreerde matches</Label>
            <button
              onClick={onOpen}
              className="text-[10px] uppercase tracking-[0.14em] transition-colors hover:text-[#7a2f22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: C.muted, ...mono }}
            >
              Volledige strook
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o) => {
              const col = o.match >= 90 ? C.seal : C.sepia;
              return (
                <li key={o.id}>
                  <button
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 p-3.5 text-left transition-colors hover:bg-[#f0e9d6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      border: `1px solid ${C.lineSoft}`,
                      background: C.cardSoft,
                      ["--tw-ring-color" as string]: C.rust,
                    }}
                  >
                    <span
                      className="h-10 w-24 overflow-hidden rounded-sm"
                      style={{ background: C.paperDeep }}
                    >
                      <Seismogram
                        data={[3, 5, 4, o.match / 10, 5, 6]}
                        peaks={[3]}
                        color={col}
                        w={96}
                        h={40}
                      />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ ...stamp, color: C.ink }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.muted, ...mono }}
                      >
                        {o.opdrachtgever} · {tijdstip(o.id)}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span
                        className="text-[15px] font-semibold tabular-nums"
                        style={{ color: col, ...mono }}
                      >
                        {o.match}%
                      </span>
                      <ChevronRight
                        size={16}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: C.faint }}
                      />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <div
            className="mb-5 flex items-baseline justify-between border-b pb-2"
            style={{ borderColor: C.line }}
          >
            <Label color={C.sepia}>Meldingen</Label>
            <Radio size={13} aria-hidden="true" style={{ color: C.sepia }} />
          </div>
          <ul className="space-y-2">
            {BERICHTEN.map((b) => (
              <li key={b.van}>
                <div
                  className="flex items-start gap-3 p-3"
                  style={{ border: `1px solid ${C.lineSoft}`, background: C.cardSoft }}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-[10px]"
                    style={{
                      border: `1px solid ${b.ongelezen ? C.rust : C.faint}`,
                      color: b.ongelezen ? C.rust : C.muted,
                      ...mono,
                    }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className="truncate text-[12.5px] font-semibold"
                        style={{ ...body, color: C.ink }}
                      >
                        {b.van}
                      </span>
                      <span
                        className="shrink-0 text-[10px] tabular-nums"
                        style={{ color: C.faint, ...mono }}
                      >
                        {b.tijd}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11.5px]" style={{ color: C.muted }}>
                      {b.preview}
                    </p>
                  </div>
                  {b.ongelezen && (
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: C.rust }}
                      aria-hidden="true"
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
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
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-4 border-b pb-6"
        style={{ borderColor: C.ink }}
      >
        <div>
          <Label>Registratieboek</Label>
          <h1
            className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.01em]"
            style={{ ...stamp, color: C.ink }}
          >
            Open opdrachten
          </h1>
        </div>
        <Stempel>
          {String(filtered.length).padStart(2, "0")} / {String(OPDRACHTEN.length).padStart(2, "0")}{" "}
          uitslagen
        </Stempel>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-3 py-2.5"
          style={{ border: `1px solid ${C.ink}`, background: C.cardSoft }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#a08a72]"
            style={{ color: C.ink, ...body }}
          />
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className="px-3 py-2 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  on
                    ? { background: C.rust, color: C.paper, ...mono }
                    : { color: C.muted, border: `1px solid ${C.line}`, ...mono }
                }
              >
                {s === "match" ? "Amplitude" : "Tarief"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Sheet className="p-0">
          <div className="flex flex-col items-center py-14 text-center">
            <Waves size={56} color={C.faint} aria-hidden="true" />
            <p className="mt-5 text-[22px] font-semibold" style={{ ...stamp, color: C.ink }}>
              Vlakke lijn
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.muted }}>
              Geen uitslag op {q ? `"${q}"` : "je filter"}. Verruim de zoekterm om de strook opnieuw
              te vullen.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.rust, color: C.paper, ...stamp }}
            >
              Filter wissen <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </Sheet>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <OpdrachtCard opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtCard({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const col = opdracht.match >= 90 ? C.seal : C.sepia;
  return (
    <Sheet className="p-5" accent={col}>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div
            className="flex items-center gap-2 text-[10.5px] tabular-nums"
            style={{ color: C.faint, ...mono }}
          >
            <span>REG-{String(index + 1).padStart(2, "0")}</span>
            <span style={{ color: C.sepia }}>·</span>
            <Stempel>{tijdstip(opdracht.id)}</Stempel>
          </div>
          <h3
            className="mt-1 text-[17px] font-semibold leading-snug"
            style={{ ...stamp, color: C.ink }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12px]" style={{ color: C.muted, ...mono }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-[20px] font-semibold tabular-nums" style={{ color: col, ...mono }}>
            {opdracht.match}%
          </span>
          <span className="text-[13px] font-medium" style={{ color: C.amber, ...mono }}>
            {opdracht.tarief}
          </span>
          <Magnitude pct={opdracht.match} color={col} />
        </div>
      </div>
      <div className="mt-3 overflow-hidden rounded-sm" style={{ background: C.paperDeep }}>
        <Seismogram data={[3, 5, 4, opdracht.match / 10, 5, 7, 4]} peaks={[3]} color={col} h={50} />
      </div>
      <div
        className="mt-3 flex items-center gap-4 border-t pt-3"
        style={{ borderColor: C.lineSoft }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors hover:text-[#7a2f22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.muted, ...mono }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Uitslag-analyse
        </button>
        <button
          onClick={onOpen}
          className="ml-auto inline-flex items-center gap-1.5 text-[12px] font-semibold transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.rust, ...stamp }}
        >
          Leg vast <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: C.seal, ...mono }}
              >
                Sterke uitslag
              </p>
              <ul className="mt-2 space-y-1.5">
                {opdracht.redenen.plus.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[12.5px]"
                    style={{ color: C.inkSoft }}
                  >
                    <Check
                      size={13}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      style={{ color: C.seal }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: C.rust, ...mono }}
              >
                Demping
              </p>
              <ul className="mt-2 space-y-1.5">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[12.5px]"
                    style={{ color: C.muted }}
                  >
                    <AlertTriangle
                      size={12}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      style={{ color: C.rust }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Sheet>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[10.5px] uppercase tracking-[0.12em] transition-colors hover:text-[#7a2f22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted, ...mono }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar de strook
      </button>

      <Sheet className="relative overflow-hidden p-6 md:p-8" accent={C.rust}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] tracking-[0.1em]" style={{ color: C.sepia, ...mono }}>
            {opdracht.id}
          </span>
          <Chip color={C.seal}>{opdracht.match}% uitslag</Chip>
          <Stempel>{tijdstip(opdracht.id)}</Stempel>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[32px] font-semibold leading-[1.08] tracking-[-0.01em] md:text-[42px]"
          style={{ ...stamp, color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[15px]" style={{ color: C.muted, ...mono }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-5 overflow-hidden rounded-sm" style={{ background: C.paperDeep }}>
          <Seismogram
            data={[4, 6, 5, opdracht.match / 9, 6, 8, 5, 7]}
            peaks={[3, 6]}
            color={C.rust}
            h={90}
          />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="inline-flex items-center gap-2 px-5 py-3 text-[13.5px] font-semibold transition-all hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.rust, color: C.paper, ...stamp }}
          >
            Reageer op uitslag <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button
            className="inline-flex items-center gap-2 px-5 py-3 text-[13.5px] font-semibold transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.ink, border: `1px solid ${C.ink}`, ...stamp }}
          >
            Bewaar registratie
          </button>
        </div>
      </Sheet>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Uitslag", v: `${opdracht.match}%` },
        ].map((m) => (
          <Sheet key={m.l} className="p-4">
            <p
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{ color: C.faint, ...mono }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[20px] font-semibold tabular-nums tracking-[-0.01em]"
              style={{ ...stamp, color: C.ink }}
            >
              {m.v}
            </p>
          </Sheet>
        ))}
      </section>

      <section>
        <div className="border-b pb-3" style={{ borderColor: C.line }}>
          <Label>Uitslag-analyse · waarom deze registratie</Label>
        </div>
        <p className="mt-5 max-w-xl text-[14.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Transparant afgeleid van je geverifieerde profiel — de sterke uitslag én de demping,
          zonder verborgen score.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Sheet className="p-5" accent={C.seal}>
            <div className="flex items-center gap-2">
              <Check size={15} aria-hidden="true" style={{ color: C.seal }} />
              <Label color={C.seal}>Sterke uitslag</Label>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[13.5px]"
                  style={{ borderColor: C.lineSoft, color: C.inkSoft }}
                >
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: C.seal }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Sheet>
          <Sheet className="p-5" accent={C.rust}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} aria-hidden="true" style={{ color: C.rust }} />
              <p
                className="text-[10px] uppercase tracking-[0.3em]"
                style={{ color: C.rust, ...mono }}
              >
                Demping
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[13.5px]"
                  style={{ borderColor: C.lineSoft, color: C.muted }}
                >
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: C.rust }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Sheet>
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
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-6 border-b pb-8"
        style={{ borderColor: C.ink }}
      >
        <div className="max-w-md">
          <Label>Registratie-historie</Label>
          <h1
            className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.01em]"
            style={{ ...stamp, color: C.ink }}
          >
            Certificaten
          </h1>
          <p className="mt-4 text-[14.5px] leading-relaxed" style={{ color: C.muted }}>
            <span className="font-medium" style={{ color: C.seal }}>
              {PROFIEL.trust}.
            </span>{" "}
            {verified} van {CREDENTIALS.length} uitslagen vastgelegd en doorgemeten. Eén registratie
            zakt binnenkort onder de drempel.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-2">
            <Magnitude pct={ratio} />
            <span
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{ color: C.faint, ...mono }}
            >
              vastgelegd
            </span>
          </div>
          <p
            className="text-[40px] font-semibold tabular-nums leading-none tracking-[-0.01em]"
            style={{ ...stamp, color: C.seal }}
          >
            {ratio}
            <span className="text-[20px]" style={{ color: C.muted }}>
              %
            </span>
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Sheet className="p-5" accent={st.color}>
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <span
                    className="h-10 w-20 overflow-hidden rounded-sm"
                    style={{ background: C.paperDeep }}
                    aria-hidden="true"
                  >
                    <Seismogram
                      data={
                        st.alarm
                          ? [5, 3, 6, 2, 5, 3]
                          : c.status === "SUBMITTED"
                            ? [4, 5, 4, 6, 4, 5]
                            : [5, 5, 5, 5, 5, 5]
                      }
                      peaks={st.alarm ? [2] : []}
                      color={st.color}
                      w={80}
                      h={40}
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <st.Icon size={15} aria-hidden="true" style={{ color: st.color }} />
                      <span
                        className="truncate text-[15px] font-semibold"
                        style={{ ...stamp, color: C.ink }}
                      >
                        {c.naam}
                      </span>
                    </span>
                    <span className="mt-1 block text-[12px]" style={{ color: C.muted, ...mono }}>
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span
                      className="hidden items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] sm:inline-flex"
                      style={{ color: st.color, border: `1px solid ${st.color}`, ...mono }}
                    >
                      <span className="tabular-nums">{st.code}</span> {st.label}
                    </span>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{
                        color: C.muted,
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      }}
                      aria-hidden="true"
                    >
                      <Plus size={15} />
                    </span>
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="mt-3 border-t pt-3" style={{ borderColor: C.lineSoft }}>
                      <p
                        className="max-w-xl text-[13px] leading-relaxed"
                        style={{ color: C.inkSoft }}
                      >
                        {c.detail}. Documenten worden versleuteld bewaard en pas na jouw expliciete
                        toestemming doorgemeten voor een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="px-3.5 py-2 text-[12px] font-semibold transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{
                            background: st.alarm ? C.rust : C.seal,
                            color: C.paper,
                            ...stamp,
                          }}
                        >
                          {c.status === "EXPIRING"
                            ? "Opnieuw registreren"
                            : c.status === "REJECTED"
                              ? "Opnieuw indienen"
                              : "Bekijken"}
                        </button>
                        <button
                          className="px-3.5 py-2 text-[12px] font-medium transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{ color: C.inkSoft, border: `1px solid ${C.line}`, ...mono }}
                        >
                          Logboek
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Sheet>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-8">
      <div className="border-b pb-6" style={{ borderColor: C.ink }}>
        <Label color={C.rust}>Uitslag-log · volgende taken</Label>
        <h1
          className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.01em]"
          style={{ ...stamp, color: C.ink }}
        >
          Acties
        </h1>
        <p className="mt-3 max-w-md text-[14px]" style={{ color: C.muted }}>
          Werk de uitslagen op volgorde af — elke afgehandelde piek houdt je registratie vlak.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const col = warn ? C.rust : C.seal;
          return (
            <li key={a.titel}>
              <div
                className="grid grid-cols-1 items-center gap-4 p-5 sm:grid-cols-[auto_1fr_auto]"
                style={{
                  background: C.card,
                  border: `1px solid ${C.line}`,
                  borderLeft: `3px solid ${col}`,
                }}
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-sm text-[13px] font-semibold tabular-nums"
                  style={
                    warn
                      ? { background: C.rust, color: C.paper, ...mono }
                      : { border: `1.5px solid ${C.seal}`, color: C.seal, ...mono }
                  }
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle size={15} aria-hidden="true" style={{ color: C.rust }} />
                    ) : (
                      <Gauge size={15} aria-hidden="true" style={{ color: C.seal }} />
                    )}
                    <h2
                      className="text-[16px] font-semibold leading-snug"
                      style={{ ...stamp, color: C.ink }}
                    >
                      {a.titel}
                    </h2>
                  </div>
                  <p
                    className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                    style={{ color: C.muted }}
                  >
                    {a.detail}
                  </p>
                </div>
                <button
                  className="justify-self-start px-5 py-2.5 text-[12.5px] font-semibold transition-all hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:justify-self-end"
                  style={
                    warn
                      ? { background: C.rust, color: C.paper, ...stamp }
                      : { border: `1px solid ${C.seal}`, color: C.seal, ...stamp }
                  }
                >
                  {a.cta}
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurColor(status: string): string {
  if (status === "Openstaand") return C.rust;
  if (status === "Betaald") return C.seal;
  return C.amber;
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-4 border-b pb-6"
        style={{ borderColor: C.ink }}
      >
        <div>
          <Label color={C.sepia}>Grootboek · omzet</Label>
          <h1
            className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.01em]"
            style={{ ...stamp, color: C.ink }}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 px-5 py-3 text-[13px] font-semibold transition-all hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.rust, color: C.paper, ...stamp }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", c: C.seal },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", c: C.rust },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", c: C.amber },
        ].map((s) => (
          <Sheet key={s.l} className="p-5" accent={s.c}>
            <p
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{ color: C.muted, ...mono }}
            >
              {s.l}
            </p>
            <p
              className="mt-2 text-[26px] font-semibold tabular-nums tracking-[-0.01em]"
              style={{ color: s.c, ...stamp }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </Sheet>
        ))}
      </section>

      <Sheet className="p-5">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_7rem_6rem] gap-4 border-b pb-2 sm:grid"
          style={{ borderColor: C.ink }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[10px] uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint, ...mono }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const col = factuurColor(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-b py-4 transition-colors hover:bg-[#f0e9d6] sm:grid-cols-[8rem_1fr_5rem_7rem_6rem] sm:gap-4"
                style={{ borderColor: C.lineSoft }}
              >
                <span
                  className="order-1 flex items-center gap-2 text-[11.5px] tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: col }}
                    aria-hidden="true"
                  />
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-semibold sm:order-2"
                  style={{ ...stamp, color: C.ink }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <Chip color={col}>{f.status}</Chip>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-semibold tabular-nums sm:order-5"
                  style={{ color: col, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex items-baseline justify-between pt-5">
          <span
            className="text-[10px] uppercase tracking-[0.2em]"
            style={{ color: C.faint, ...mono }}
          >
            Totaal betaald
          </span>
          <span
            className="text-[22px] font-semibold tabular-nums"
            style={{ ...stamp, color: C.seal }}
          >
            {totaalBetaald}
          </span>
        </div>
      </Sheet>
    </div>
  );
}

function FooterRail() {
  return (
    <footer
      className="flex items-center justify-between border-t py-5"
      style={{ borderColor: C.line }}
    >
      <span
        className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]"
        style={{ color: C.faint, ...mono }}
      >
        <Waves size={13} aria-hidden="true" style={{ color: C.sepia }} /> Seismograaf · registratie
        · alle documenten versleuteld
      </span>
      <span
        className="hidden text-[10px] tracking-[0.16em] sm:block"
        style={{ color: C.faint, ...mono }}
      >
        strook 07 · {tijdstip("footer")}
      </span>
    </footer>
  );
}
