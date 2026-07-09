"use client";

// Concept 226 — "Etage" · gelaagde z-depth stacking. Expliciete diepte-hiërarchie: kaarten stapelen met
// offset-schaduw en parallax-achtige lagen, een duidelijk voorgrond/achtergrond en een verticale
// "verdiepingen"-metafoor (etage-nummers). Signatuur: de 3D-stacking (dubbele offset-schaduwlagen achter
// elke kaart) loopt consistent door alle schermen. Onderscheidt zich van platte SaaS-concepten door de
// tastbare diepte en de verdiepingen-navigatie. Status = label + icoon (nooit alleen kleur), WCAG-AA.
// Fonts: Sora (koppen) + Geist (tekst). Deterministisch: geen random, geen Date, geen netwerk/afbeeldingen.

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  FileText,
  TriangleAlert,
  ChevronRight,
  RefreshCw,
  BadgeCheck,
  Layers,
  Building2,
  Send,
  Bookmark,
  Sparkles,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — koele neutrale lagen met heldere diepte-accenten. ──
const C = {
  bg: "#eef1f6", // achtergrond-etage (diepste laag)
  bgDeep: "#e3e7ef", // schaduwlaag
  panel: "#ffffff", // voorgrond-kaart
  panelSunk: "#f6f8fc", // verzonken vlak
  ink: "#141a2b", // diep inkt
  inkSoft: "#525b73", // secundair
  inkFaint: "#8b93a8", // labels
  line: "#e0e4ee", // rand
  lineSoft: "#eaedf4",
  indigo: "#4b52e0", // hoofdaccent (voorgrond)
  indigoDeep: "#383fc4",
  indigoBg: "#e9eafe",
  violet: "#8a52e0", // laag 2
  violetBg: "#f0e8fd",
  cyan: "#1f9bb8", // laag 3
  cyanBg: "#e0f3f8",
  emerald: "#0f9d76", // goed
  emeraldBg: "#e0f5ee",
  amber: "#c98a1a", // aandacht
  amberBg: "#fbefd6",
  rose: "#d63a5f", // afgewezen
  roseBg: "#fce4ea",
};

const headF = { fontFamily: "var(--font-lab-sora)" };
const bodyF = { fontFamily: "var(--font-lab-geist)" };

// Gestapelde offset-schaduw — signatuur: twee lagen achter de kaart geven tastbare diepte.
const stackShadow = (depth = 1) =>
  depth >= 2
    ? "0 2px 0 0 #ffffff, 8px 8px 0 -2px #e3e7ef, 16px 16px 0 -4px #d7dbe6, 0 26px 44px -28px rgba(20,26,43,0.4)"
    : "0 1px 0 0 #ffffff, 6px 6px 0 -2px #e6eaf2, 0 20px 36px -26px rgba(20,26,43,0.34)";

// ── Status-model — vorm + icoon + label; nooit alleen kleur. ──
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.emerald, bg: C.emeraldBg };
    case "SUBMITTED":
      return { label: "In behandeling", Icon: Clock, fg: C.indigoDeep, bg: C.indigoBg };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fg: C.amber, bg: C.amberBg };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.rose, bg: C.roseBg };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-semibold"
      style={{ ...bodyF, background: m.bg, color: m.fg }}
    >
      <m.Icon size={13} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Gestapelde kaart — de diepte-signatuur van dit concept.
function Stack({
  children,
  className = "",
  style,
  depth = 1,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  depth?: number;
}) {
  return (
    <div
      className={`rounded-2xl transition-transform duration-200 ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: stackShadow(depth),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionHead({
  title,
  sub,
  Icon,
  floor,
  tint = C.indigo,
  tintBg = C.indigoBg,
}: {
  title: string;
  sub?: string;
  Icon: LucideIcon;
  floor?: string;
  tint?: string;
  tintBg?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: tintBg }}
        aria-hidden="true"
      >
        <Icon size={18} strokeWidth={2} style={{ color: tint }} />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {floor && (
            <span
              className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ ...headF, background: C.bgDeep, color: C.inkFaint }}
            >
              {floor}
            </span>
          )}
          <h2
            className="text-[19px] font-bold leading-tight tracking-tight"
            style={{ ...headF, color: C.ink }}
          >
            {title}
          </h2>
        </div>
        {sub && (
          <p className="mt-0.5 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function Meta({ Icon, value, tint }: { Icon: LucideIcon; value: string; tint: string }) {
  return (
    <div className="flex items-center gap-2" style={{ color: C.inkSoft }}>
      <Icon size={15} strokeWidth={2} style={{ color: tint }} aria-hidden="true" />
      <span className="truncate text-[13px]" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

function Spark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const coords = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 26 - ((v - min) / span) * 22 - 2;
    return [x, y] as const;
  });
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,28 ${line} 100,28`;
  return (
    <svg
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      className="h-7 w-full"
      aria-hidden="true"
      role="presentation"
    >
      <polygon points={area} fill={color} opacity={0.12} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Gelaagde match-badge: gestapelde blokjes die de diepte tonen + percentage.
function MatchStack({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "h-[86px] w-[86px]" : size === "sm" ? "h-11 w-11" : "h-16 w-16";
  const num = size === "lg" ? "text-[26px]" : size === "sm" ? "text-[13px]" : "text-[19px]";
  return (
    <span
      className={`relative inline-flex ${box} shrink-0 items-center justify-center`}
      aria-hidden="true"
    >
      <span
        className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-xl"
        style={{ background: C.violetBg }}
      />
      <span
        className="absolute inset-0 translate-x-0.5 translate-y-0.5 rounded-xl"
        style={{ background: C.indigoBg }}
      />
      <span
        className="relative flex h-full w-full flex-col items-center justify-center rounded-xl"
        style={{
          background: `linear-gradient(145deg, ${C.indigo}, ${C.violet})`,
          boxShadow: "0 10px 20px -10px rgba(75,82,224,0.8)",
        }}
      >
        <span
          className={`${num} font-bold tabular-nums leading-none`}
          style={{ ...headF, color: "#fff" }}
        >
          {value}
        </span>
        {size !== "sm" && (
          <span
            className="text-[8px] font-bold uppercase tracking-[0.16em]"
            style={{ ...headF, color: "#ffffffcc" }}
          >
            match
          </span>
        )}
      </span>
    </span>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept226() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;
  const floorIndex = SCREENS.findIndex((s) => s.key === screen);

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(760px 460px at 10% -10%, ${C.indigoBg}, transparent 60%), radial-gradient(680px 440px at 96% 4%, ${C.violetBg}, transparent 58%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex max-w-6xl gap-0 px-3 md:px-6">
        {/* Verticale etage-navigatie (verdiepingen) — desktop */}
        <aside
          className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col py-6 lg:flex"
          aria-label="Verdiepingen"
        >
          <div className="flex items-center gap-3 px-3 pb-6">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{
                background: `linear-gradient(145deg, ${C.indigo}, ${C.violet})`,
                boxShadow: "0 10px 20px -10px rgba(75,82,224,0.8)",
              }}
              aria-hidden="true"
            >
              <Layers size={20} strokeWidth={2} style={{ color: "#fff" }} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[18px] font-bold tracking-tight"
                style={{ ...headF, color: C.ink }}
              >
                Etage
              </div>
              <div className="text-[11px]" style={{ ...bodyF, color: C.inkSoft }}>
                {SCREENS.length} verdiepingen
              </div>
            </div>
          </div>
          <nav className="relative flex flex-1 flex-col gap-1.5">
            <span
              className="absolute bottom-4 left-[26px] top-2 w-px"
              style={{ background: C.line }}
              aria-hidden="true"
            />
            {SCREENS.map((s, i) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="relative z-10 flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    ...headF,
                    background: on ? C.panel : "transparent",
                    color: on ? C.ink : C.inkSoft,
                    boxShadow: on ? stackShadow(1) : "none",
                    ["--tw-ring-color" as string]: C.indigo,
                  }}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tabular-nums"
                    style={{
                      background: on ? C.indigo : C.bgDeep,
                      color: on ? "#fff" : C.inkFaint,
                    }}
                    aria-hidden="true"
                  >
                    {SCREENS.length - i}
                  </span>
                  {s.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-4 px-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold"
              style={{ ...bodyF, background: C.emeraldBg, color: C.emerald }}
            >
              <ShieldCheck size={13} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Mobiele topbar + horizontale schermwissel */}
          <header
            className="sticky top-0 z-30 lg:hidden"
            style={{ background: `${C.bg}e8`, backdropFilter: "blur(12px)" }}
          >
            <div className="flex items-center justify-between gap-3 py-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `linear-gradient(145deg, ${C.indigo}, ${C.violet})` }}
                  aria-hidden="true"
                >
                  <Layers size={18} strokeWidth={2} style={{ color: "#fff" }} />
                </span>
                <div
                  className="text-[17px] font-bold tracking-tight"
                  style={{ ...headF, color: C.ink }}
                >
                  Etage
                </div>
              </div>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[11px] font-bold"
                style={{ ...headF, background: C.indigoBg, color: C.indigoDeep }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
            <nav
              className="flex items-center gap-1.5 overflow-x-auto pb-3"
              aria-label="Verdiepingen"
            >
              {SCREENS.map((s) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className="shrink-0 rounded-lg px-3.5 py-2 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      ...headF,
                      background: on ? C.ink : C.panel,
                      color: on ? "#fff" : C.inkSoft,
                      border: `1px solid ${on ? C.ink : C.line}`,
                      ["--tw-ring-color" as string]: C.indigo,
                      ["--tw-ring-offset-color" as string]: C.bg,
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </nav>
          </header>

          <main className="py-6 md:py-9">
            {/* Etage-indicator */}
            <div
              className="mb-6 flex items-center gap-2 text-[12px]"
              style={{ ...bodyF, color: C.inkFaint }}
            >
              <Building2 size={14} strokeWidth={2} style={{ color: C.indigo }} aria-hidden="true" />
              <span>
                Verdieping <strong style={{ color: C.ink }}>{SCREENS.length - floorIndex}</strong> ·{" "}
                {SCREENS[floorIndex]?.label}
              </span>
            </div>

            {screen === "dashboard" && (
              <Dashboard
                onOpen={() => setScreen("opdracht")}
                onActies={() => setScreen("acties")}
              />
            )}
            {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
            {screen === "opdracht" && (
              <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
            )}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties onMatches={() => setScreen("marktplaats")} />}
            {screen === "facturen" && <Facturen />}

            <footer
              className="mt-12 flex flex-wrap items-center justify-center gap-2 border-t pt-8 text-center text-[12px]"
              style={{ ...bodyF, borderColor: C.line, color: C.inkFaint }}
            >
              <Layers size={13} strokeWidth={2} style={{ color: C.indigo }} aria-hidden="true" />{" "}
              Gelaagd en diep — elke status draagt een woord én een icoon, dus niets hangt alleen
              aan kleur.
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];
  const sparkColors = [C.indigo, C.violet, C.cyan, C.emerald];

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Stack
          depth={2}
          className="overflow-hidden"
          style={{ background: `linear-gradient(150deg, ${C.panel}, ${C.indigoBg})` }}
        >
          <div className="p-7 sm:p-9">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
              style={{
                ...bodyF,
                background: C.panel,
                color: C.indigoDeep,
                border: `1px solid ${C.line}`,
              }}
            >
              <Sparkles size={13} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
            </span>
            <h1
              className="mt-5 text-[29px] font-bold leading-[1.08] tracking-tight sm:text-[39px]"
              style={{ ...headF, color: C.ink }}
            >
              Welkom terug, {PROFIEL.naam.split(" ")[0]}.
              <br />
              <span style={{ color: C.indigoDeep }}>Drie matches</span> op de bovenste verdieping.
            </h1>
            <p
              className="mt-4 max-w-md text-[15px] leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              Rustige week. Eén ding vraagt aandacht — je VOG verloopt binnenkort — de rest is
              netjes gestapeld.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...headF,
                  background: C.indigo,
                  color: "#fff",
                  boxShadow: "0 12px 22px -12px rgba(75,82,224,0.9)",
                  ["--tw-ring-color" as string]: C.indigo,
                  ["--tw-ring-offset-color" as string]: C.indigoBg,
                }}
              >
                Bekijk matches <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...headF,
                  background: C.panel,
                  color: C.ink,
                  border: `1px solid ${C.line}`,
                  ["--tw-ring-color" as string]: C.indigo,
                  ["--tw-ring-offset-color" as string]: C.indigoBg,
                }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2.2}
                  style={{ color: C.amber }}
                  aria-hidden="true"
                />{" "}
                Regel je VOG
              </button>
            </div>
          </div>
        </Stack>

        <Stack depth={2}>
          <div className="flex flex-col items-center justify-center gap-4 p-7 text-center">
            <MatchStack value={dek} size="lg" />
            <StatusChip status="VERIFIED" />
            <p className="text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              {verified} van je {CREDENTIALS.length} certificaten zijn gecontroleerd. Opdrachtgevers
              zien alleen geverifieerde documenten.
            </p>
          </div>
        </Stack>
      </section>

      <section className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Stack key={k.label} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[12px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
                {k.label}
              </span>
              <span
                className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold"
                style={{
                  ...bodyF,
                  background: k.up ? C.emeraldBg : C.amberBg,
                  color: k.up ? C.emerald : C.amber,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-3 text-[26px] font-bold tabular-nums leading-none tracking-tight"
              style={{ ...headF, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} color={sparkColors[i % sparkColors.length] ?? C.indigo} />
            </div>
          </Stack>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        <section className="space-y-4">
          <SectionHead
            title="Voor jou geselecteerd"
            sub="Opdrachten die passen"
            Icon={Sparkles}
            floor="Etage 3"
            tint={C.violet}
            tintBg={C.violetBg}
          />
          <div className="space-y-4">
            {OPDRACHTEN.map((o) => (
              <Stack key={o.id} className="overflow-hidden hover:-translate-y-0.5">
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.indigo }}
                >
                  <MatchStack value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[16px] font-bold tracking-tight"
                      style={{ ...headF, color: C.ink }}
                    >
                      {o.titel}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[13px]"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11.5px] font-medium"
                          style={{ ...bodyF, background: C.emeraldBg, color: C.emerald }}
                        >
                          <Check size={12} strokeWidth={2.6} aria-hidden="true" /> {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className="shrink-0"
                    style={{ color: C.inkFaint }}
                    aria-hidden="true"
                  />
                </button>
              </Stack>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHead
            title="Vraagt aandacht"
            sub="Snel geregeld"
            Icon={TriangleAlert}
            floor="Begane grond"
            tint={C.amber}
            tintBg={C.amberBg}
          />
          <Stack
            depth={2}
            style={{ background: `linear-gradient(155deg, ${C.amberBg}, ${C.panel})` }}
          >
            <div className="p-5">
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.05em]"
                style={{ ...headF, background: C.amber, color: "#fff" }}
              >
                <TriangleAlert size={12} strokeWidth={2.4} aria-hidden="true" /> Aandacht
              </span>
              <h3
                className="mt-3 text-[18px] font-bold leading-tight tracking-tight"
                style={{ ...headF, color: C.ink }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[13px] leading-relaxed"
                style={{ ...bodyF, color: C.inkSoft }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...headF,
                  background: C.ink,
                  color: "#fff",
                  ["--tw-ring-color" as string]: C.amber,
                  ["--tw-ring-offset-color" as string]: C.amberBg,
                }}
              >
                {warn.cta} <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </Stack>

          <Stack className="p-5">
            <div className="flex items-center gap-2">
              <BadgeCheck
                size={16}
                strokeWidth={2}
                style={{ color: C.emerald }}
                aria-hidden="true"
              />
              <span
                className="text-[14px] font-bold tracking-tight"
                style={{ ...headF, color: C.ink }}
              >
                Vertrouwensniveau
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Je profiel staat op{" "}
              <strong style={{ color: C.emerald }}>{PROFIEL.trust.toLowerCase()}</strong>. Dat geeft
              voorrang bij nieuwe matches.
            </p>
            <div
              className="mt-4 h-2.5 w-full overflow-hidden rounded-full"
              style={{ background: C.bgDeep }}
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${dek}%`,
                  background: `linear-gradient(90deg, ${C.indigo}, ${C.violet})`,
                }}
              />
            </div>
          </Stack>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats — met zoek, skeleton, empty- én foutstate ─────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(true);
  const metaTints = [C.indigo, C.violet, C.cyan, C.emerald] as const;

  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 650);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Marktplaats"
          sub="Alle open opdrachten, gelaagd gerangschikt"
          Icon={Search}
          floor="Etage 4"
        />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              boxShadow: stackShadow(1),
            }}
          >
            <Search size={16} style={{ color: C.indigo }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent text-[13px] outline-none placeholder:opacity-60"
              style={{ ...bodyF, color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Opdrachten verversen"
            className="flex h-10 w-10 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              boxShadow: stackShadow(1),
              ["--tw-ring-color" as string]: C.indigo,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.indigo }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {error && (
        <div
          className="flex items-start gap-3 rounded-xl p-4"
          role="alert"
          style={{ background: C.roseBg, border: `1px solid ${C.rose}44` }}
        >
          <XCircle size={20} strokeWidth={2.2} style={{ color: C.rose }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold" style={{ ...headF, color: C.ink }}>
              Niet alles kon laden
            </div>
            <p className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              Een paar opdrachten lieten op zich wachten. Ververs gerust om het opnieuw te proberen.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-md px-3 py-1 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2"
            style={{ ...bodyF, color: C.rose, ["--tw-ring-color" as string]: C.rose }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Stack key={i} className="p-5">
              <div className="flex items-center gap-3">
                <span
                  className="h-16 w-16 shrink-0 animate-pulse rounded-xl"
                  style={{ background: C.indigoBg }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-4 w-3/4 animate-pulse rounded-md"
                    style={{ background: C.violetBg }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded-md"
                    style={{ background: C.lineSoft }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded-md"
                  style={{ background: C.lineSoft }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded-md"
                  style={{ background: C.lineSoft }}
                />
              </div>
            </Stack>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Stack
          depth={2}
          className="flex flex-col items-center justify-center gap-3 p-16 text-center"
        >
          <span
            className="flex h-20 w-20 items-center justify-center rounded-2xl"
            style={{ background: `linear-gradient(150deg, ${C.indigoBg}, ${C.violetBg})` }}
            aria-hidden="true"
          >
            <Layers size={34} strokeWidth={1.6} style={{ color: C.indigo }} />
          </span>
          <p className="text-[20px] font-bold tracking-tight" style={{ ...headF, color: C.ink }}>
            Niets gevonden
          </p>
          <p
            className="max-w-sm text-[13.5px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Geen opdracht voor &ldquo;{q}&rdquo;. Probeer een andere zoekterm — of wis het veld, dan
            staan alle verdiepingen er weer.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-xl px-5 py-2.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...headF,
              background: C.indigo,
              color: "#fff",
              ["--tw-ring-color" as string]: C.indigo,
              ["--tw-ring-offset-color" as string]: C.panel,
            }}
          >
            Toon alles
          </button>
        </Stack>
      ) : (
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Stack key={o.id} className="flex flex-col overflow-hidden hover:-translate-y-1">
              <div className="flex items-center justify-between gap-3 px-5 pt-5">
                <span
                  className="rounded-md px-2 py-1 text-[11px] font-semibold tabular-nums"
                  style={{ ...bodyF, background: C.panelSunk, color: C.inkSoft }}
                >
                  {o.id}
                </span>
                <MatchStack value={o.match} size="sm" />
              </div>
              <div className="px-5 pb-3 pt-3">
                <h3
                  className="text-[16.5px] font-bold leading-tight tracking-tight"
                  style={{ ...headF, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <p className="mt-0.5 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {o.opdrachtgever}
                </p>
                <dl className="mt-3.5 grid grid-cols-2 gap-y-2.5">
                  <Meta Icon={MapPin} value={o.plaats} tint={metaTints[0]} />
                  <Meta Icon={Coins} value={o.tarief} tint={metaTints[1]} />
                  <Meta Icon={Clock} value={o.uren} tint={metaTints[2]} />
                  <Meta Icon={CalendarDays} value={o.start} tint={metaTints[3]} />
                </dl>
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md px-2 py-0.5 text-[11px] font-medium"
                      style={{ ...bodyF, background: C.indigoBg, color: C.indigoDeep }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 px-5 py-3.5 text-[13px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...headF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.indigoDeep,
                  ["--tw-ring-color" as string]: C.indigo,
                }}
              >
                Bekijk opdracht <ArrowRight size={15} aria-hidden="true" />
              </button>
            </Stack>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const feiten: { l: string; v: string; Icon: LucideIcon; tint: string; tintBg: string }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins, tint: C.indigoDeep, tintBg: C.indigoBg },
    { l: "Omvang", v: opdracht.uren, Icon: Clock, tint: C.violet, tintBg: C.violetBg },
    { l: "Start", v: opdracht.start, Icon: CalendarDays, tint: C.emerald, tintBg: C.emeraldBg },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin, tint: C.cyan, tintBg: C.cyanBg },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-bold transition-transform hover:-translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...headF,
          background: C.panel,
          color: C.ink,
          border: `1px solid ${C.line}`,
          boxShadow: stackShadow(1),
          ["--tw-ring-color" as string]: C.indigo,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={15} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Stack depth={2} style={{ background: `linear-gradient(150deg, ${C.panel}, ${C.indigoBg})` }}>
        <div className="flex flex-wrap items-center justify-between gap-6 p-7 sm:p-9">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-md px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  ...bodyF,
                  background: C.panel,
                  color: C.indigoDeep,
                  border: `1px solid ${C.line}`,
                }}
              >
                {opdracht.id}
              </span>
              <span className="text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                Start {opdracht.start}
              </span>
            </div>
            <h1
              className="mt-3 max-w-2xl text-[25px] font-bold leading-[1.12] tracking-tight sm:text-[33px]"
              style={{ ...headF, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchStack value={opdracht.match} size="lg" />
        </div>
      </Stack>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {feiten.map((f) => (
          <Stack key={f.l} className="p-5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: f.tintBg }}
              aria-hidden="true"
            >
              <f.Icon size={16} strokeWidth={2} style={{ color: f.tint }} />
            </span>
            <div
              className="mt-3 text-[17px] font-bold tabular-nums leading-none tracking-tight"
              style={{ ...headF, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...headF, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Stack>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" Icon={Check} tint={C.emerald} tintBg={C.emeraldBg} />
          <Stack className="p-5">
            <ul className="space-y-3.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: C.emeraldBg }}
                    aria-hidden="true"
                  >
                    <Check size={13} strokeWidth={2.6} style={{ color: C.emerald }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Stack>
        </section>
        <section className="space-y-3">
          <SectionHead
            title="Om te overwegen"
            Icon={TriangleAlert}
            tint={C.amber}
            tintBg={C.amberBg}
          />
          <Stack className="p-5">
            <ul className="space-y-3.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: C.amberBg }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={12} strokeWidth={2.4} style={{ color: C.amber }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Stack>
        </section>
      </div>

      <Stack className="p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} strokeWidth={2} style={{ color: C.emerald }} aria-hidden="true" />
          <span className="text-[15px] font-bold tracking-tight" style={{ ...headF, color: C.ink }}>
            Wat de opdrachtgever vraagt
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium"
              style={{ ...bodyF, background: C.indigoBg, color: C.indigoDeep }}
            >
              <BadgeCheck size={13} strokeWidth={2.2} aria-hidden="true" /> {t}
            </span>
          ))}
        </div>
      </Stack>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => setApplied(true)}
          disabled={applied}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-4 text-[14px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:translate-y-0"
          style={{
            ...headF,
            background: applied ? C.emeraldBg : C.indigo,
            color: applied ? C.emerald : "#fff",
            boxShadow: applied ? "none" : "0 14px 24px -12px rgba(75,82,224,0.9)",
            ["--tw-ring-color" as string]: C.indigo,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          {applied ? (
            <>
              <Check size={16} strokeWidth={2.6} aria-hidden="true" /> Je reactie is verstuurd
            </>
          ) : (
            <>
              Reageren op deze opdracht <ArrowRight size={16} aria-hidden="true" />
            </>
          )}
        </button>
        <button
          onClick={() => setSaved((s) => !s)}
          aria-pressed={saved}
          className="flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-[14px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: saved ? C.indigoBg : C.panel,
            color: C.ink,
            border: `1px solid ${saved ? C.indigo : C.line}`,
            ["--tw-ring-color" as string]: C.indigo,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Bookmark
            size={16}
            strokeWidth={2.2}
            style={{ color: C.indigoDeep }}
            fill={saved ? C.indigo : "none"}
            aria-hidden="true"
          />
          {saved ? "Bewaard" : "Bewaar"}
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ──────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Jouw certificaten"
          sub="Documenten die je betrouwbaar maken"
          Icon={ShieldCheck}
          floor="Etage 2"
          tint={C.emerald}
          tintBg={C.emeraldBg}
        />
        <button
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: C.indigo,
            color: "#fff",
            boxShadow: "0 12px 22px -12px rgba(75,82,224,0.9)",
            ["--tw-ring-color" as string]: C.indigo,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={15} aria-hidden="true" /> Document toevoegen
        </button>
      </div>

      <Stack
        depth={2}
        style={{ background: `linear-gradient(150deg, ${C.panel}, ${C.emeraldBg})` }}
      >
        <div className="flex flex-wrap items-center gap-6 p-7 sm:p-9">
          <MatchStack value={dek} size="lg" />
          <div className="max-w-sm">
            <div
              className="text-[20px] font-bold tracking-tight"
              style={{ ...headF, color: C.ink }}
            >
              {verified} van {CREDENTIALS.length} geverifieerd
            </div>
            <p
              className="mt-1.5 text-[13.5px] leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              Elk gecontroleerd certificaat maakt je profiel sterker. Je bent bijna rond — nog even
              en alle lagen staan op groen.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold"
              style={{
                ...bodyF,
                background: C.panel,
                color: C.emerald,
                border: `1px solid ${C.line}`,
              }}
            >
              <BadgeCheck size={13} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Stack>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Stack key={c.naam} className="flex items-center gap-4 p-5 hover:-translate-y-0.5">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{ background: m.bg }}
                aria-hidden="true"
              >
                <m.Icon size={22} strokeWidth={2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15px] font-bold tracking-tight"
                  style={{ ...headF, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusChip status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-md px-3 py-1 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...headF,
                        background: C.panelSunk,
                        color: C.indigoDeep,
                        ["--tw-ring-color" as string]: C.indigo,
                        ["--tw-ring-offset-color" as string]: C.panel,
                      }}
                    >
                      {c.status === "EXPIRING"
                        ? "Vernieuwen"
                        : c.status === "REJECTED"
                          ? "Opnieuw indienen"
                          : "Bekijken"}
                    </button>
                  )}
                </div>
              </div>
            </Stack>
          );
        })}
      </div>

      <section className="space-y-3">
        <SectionHead
          title="Je documenten"
          sub="Veilig en privé bewaard"
          Icon={FileText}
          tint={C.violet}
          tintBg={C.violetBg}
        />
        <Stack className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr style={{ background: C.panelSunk }}>
                  {["Document", "Type", "Grootte", "Status", "Bijgewerkt"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.06em]"
                      style={{ ...headF, color: C.inkFaint }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DOCUMENTEN.map((d, i) => (
                  <tr
                    key={d.naam}
                    style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{ background: C.indigoBg }}
                          aria-hidden="true"
                        >
                          <FileText size={15} strokeWidth={2} style={{ color: C.indigoDeep }} />
                        </span>
                        <span
                          className="text-[13.5px] font-semibold"
                          style={{ ...headF, color: C.ink }}
                        >
                          {d.naam}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12.5px]"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {d.type}
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12.5px] tabular-nums"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {d.grootte}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusChip status={d.status} />
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12.5px] tabular-nums"
                      style={{ ...bodyF, color: C.inkFaint }}
                    >
                      {d.bijgewerkt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Stack>
      </section>
    </div>
  );
}

// ── Acties (next-action) ─────────────────────────────────────────────────────────
function Acties({ onMatches }: { onMatches: () => void }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  const openCount = sorted.filter((a) => !done[a.titel]).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Vandaag voor jou"
          sub="Van belangrijk naar minder — vink af"
          Icon={Layers}
          floor="Etage 1"
          tint={C.violet}
          tintBg={C.violetBg}
        />
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold"
          style={{
            ...bodyF,
            background: openCount === 0 ? C.emeraldBg : C.amberBg,
            color: openCount === 0 ? C.emerald : C.amber,
          }}
        >
          {openCount === 0 ? (
            <>
              <Check size={13} strokeWidth={2.6} aria-hidden="true" /> Alles gedaan
            </>
          ) : (
            <>{openCount} open</>
          )}
        </span>
      </div>

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const isDone = !!done[a.titel];
          const tint = warn ? C.amber : C.violet;
          const tintBg = warn ? C.amberBg : C.violetBg;
          const bar = isDone ? C.emerald : warn ? C.amber : C.violet;
          return (
            <li key={a.titel}>
              <Stack
                className="overflow-hidden hover:-translate-y-0.5"
                style={isDone ? { opacity: 0.72 } : undefined}
              >
                <div className="flex items-stretch">
                  <span className="w-1.5 shrink-0" style={{ background: bar }} aria-hidden="true" />
                  <div className="flex min-w-0 flex-1 items-start gap-4 p-5">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[16px] font-bold tabular-nums"
                      style={{
                        ...headF,
                        background: isDone ? C.emeraldBg : tintBg,
                        color: isDone ? C.emerald : tint,
                      }}
                      aria-hidden="true"
                    >
                      {isDone ? (
                        <Check size={20} strokeWidth={2.6} />
                      ) : warn ? (
                        <TriangleAlert size={19} strokeWidth={2.2} />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.05em]"
                          style={{ ...headF, background: tintBg, color: tint }}
                        >
                          {warn ? (
                            <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" />
                          ) : (
                            <Sparkles size={11} strokeWidth={2.4} aria-hidden="true" />
                          )}
                          {warn ? "Aandacht" : "Kans"}
                        </span>
                        <h3
                          className={`text-[16px] font-bold tracking-tight ${isDone ? "line-through" : ""}`}
                          style={{ ...headF, color: C.ink }}
                        >
                          {a.titel}
                        </h3>
                      </div>
                      <p
                        className="mt-1.5 text-[13.5px] leading-relaxed"
                        style={{ ...bodyF, color: C.inkSoft }}
                      >
                        {a.detail}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          onClick={a.cta === "Bekijk matches" ? onMatches : undefined}
                          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{
                            ...headF,
                            background: warn ? C.indigo : C.panelSunk,
                            color: warn ? "#fff" : C.indigoDeep,
                            ["--tw-ring-color" as string]: C.indigo,
                            ["--tw-ring-offset-color" as string]: C.panel,
                          }}
                        >
                          {a.cta} <ArrowRight size={13} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setDone((d) => ({ ...d, [a.titel]: !d[a.titel] }))}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{
                            ...headF,
                            background: "transparent",
                            color: isDone ? C.inkFaint : C.emerald,
                            ["--tw-ring-color" as string]: C.emerald,
                            ["--tw-ring-offset-color" as string]: C.panel,
                          }}
                        >
                          <Check size={14} strokeWidth={2.6} aria-hidden="true" />{" "}
                          {isDone ? "Ongedaan maken" : "Klaar"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Stack>
            </li>
          );
        })}
      </ol>

      {openCount === 0 && (
        <Stack depth={2} className="flex flex-col items-center gap-2 p-10 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: `linear-gradient(150deg, ${C.emeraldBg}, ${C.violetBg})` }}
            aria-hidden="true"
          >
            <Layers size={28} strokeWidth={2} style={{ color: C.emerald }} />
          </span>
          <p className="text-[18px] font-bold tracking-tight" style={{ ...headF, color: C.ink }}>
            Alle verdiepingen leeg
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Alles afgevinkt. We laten het weten zodra er iets nieuws binnenkomt.
          </p>
        </Stack>
      )}
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; fg: string; bg: string } => {
    if (status === "Betaald")
      return { label: "Betaald", Icon: Check, fg: C.emerald, bg: C.emeraldBg };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.amber, bg: C.amberBg };
    return { label: "Concept", Icon: FileText, fg: C.inkSoft, bg: C.panelSunk };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Je facturen"
          sub="Gelaagd overzicht van omzet en openstaand"
          Icon={Coins}
          tint={C.cyan}
          tintBg={C.cyanBg}
        />
        <button
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: C.indigo,
            color: "#fff",
            boxShadow: "0 12px 22px -12px rgba(75,82,224,0.9)",
            ["--tw-ring-color" as string]: C.indigo,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {[
          {
            l: "Betaald deze maand",
            v: betaald,
            Icon: Check,
            tint: C.emerald,
            tintBg: C.emeraldBg,
          },
          { l: "Openstaand", v: `${open}`, Icon: Clock, tint: C.amber, tintBg: C.amberBg },
          {
            l: "Nog te factureren",
            v: "€ 1.350",
            Icon: Send,
            tint: C.indigoDeep,
            tintBg: C.indigoBg,
          },
        ].map((s) => (
          <Stack key={s.l} className="p-5">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: s.tintBg }}
                aria-hidden="true"
              >
                <s.Icon size={16} strokeWidth={2.2} style={{ color: s.tint }} />
              </span>
              <div className="text-[12px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
                {s.l}
              </div>
            </div>
            <div
              className="mt-3 text-[26px] font-bold tabular-nums leading-none tracking-tight"
              style={{ ...headF, color: C.ink }}
            >
              {s.v}
            </div>
          </Stack>
        ))}
      </div>

      <Stack className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ background: C.panelSunk }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={`px-5 py-3 text-[11px] font-bold uppercase tracking-[0.06em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...headF, color: C.inkFaint }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const m = factMeta(f.status);
                return (
                  <tr key={f.nr} style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}>
                    <td
                      className="px-5 py-4 text-[13.5px] font-bold tabular-nums"
                      style={{ ...headF, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-5 py-4 text-[12.5px] tabular-nums"
                      style={{ ...bodyF, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-semibold"
                        style={{ ...bodyF, background: m.bg, color: m.fg }}
                      >
                        <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[15px] font-bold tabular-nums"
                      style={{ ...headF, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.indigoBg }}>
                <td
                  colSpan={4}
                  className="px-5 py-4 text-[12px] font-bold uppercase tracking-[0.08em]"
                  style={{ ...headF, color: C.indigoDeep }}
                >
                  Totaal betaald deze maand
                </td>
                <td
                  className="px-5 py-4 text-right text-[17px] font-bold tabular-nums"
                  style={{ ...headF, color: C.indigoDeep }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Stack>
    </div>
  );
}
