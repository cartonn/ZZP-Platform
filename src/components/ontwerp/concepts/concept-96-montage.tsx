"use client";

// Concept 96 — "Montage" · video-editor tijdlijn / scrubber (Final Cut / Premiere / DaVinci-grade), DARK pro.
// Het platform als een montagesuite: bovenaan een "programma-monitor" die het geselecteerde item toont,
// onderaan een horizontale tijdlijn met sporen (tracks) — opdrachten, verificatie en facturen als clips op
// een tijdas, met een sleepbare playhead/scrubber, in/out-gevoel en een zoombare tijdliniaal. Donker,
// contrastrijk, tabulaire cijfers, transport-controls: een pro-tool-gevoel waarin elk kernscherm in
// hetzelfde editor-frame past. Alles is deterministisch — geen willekeurige posities.
// Fonts: --font-lab-geist (UI/kop) + --font-lab-spline-mono (timecode & cijfers).

import { useEffect, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
  Upload,
  MapPin,
  Check,
  ArrowRight,
  Plus,
  FileText,
  Film,
  Layers,
  ZoomIn,
  ZoomOut,
  Scissors,
  Magnet,
  Circle,
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
  NAV,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

void NAV;
void BERICHTEN;

/* ---------- Palet & typografie ---------- */

const C = {
  bg: "#0d0e12",
  panel: "#14161d",
  panelHi: "#1b1e27",
  rail: "#101219",
  fg: "#e8eaef",
  sub: "#9aa1b0",
  faint: "#646b7c",
  accent: "#f5a623",
  accentDim: "#a06f15",
  line: "rgba(255,255,255,0.08)",
  lineSoft: "rgba(255,255,255,0.05)",
  grid: "rgba(255,255,255,0.045)",
  ok: "#3ecf8e",
  warn: "#f5a623",
  alert: "#f2555a",
  info: "#5aa9f0",
  trackOpd: "#5aa9f0",
  trackVer: "#3ecf8e",
  trackFac: "#c084f5",
};

const ui = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-spline-mono)" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0e12]";

/* ---------- Status → betekenis ---------- */

type CredMeta = { label: string; color: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.ok, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In behandeling", color: C.info, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt", color: C.warn, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.alert, Icon: XCircle };
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

// Timecode uit playhead-percentage (deterministisch; 120s programma @ 30 fps).
function timecode(pos: number): string {
  const t = (pos / 100) * 120;
  const mm = Math.floor(t / 60);
  const ss = Math.floor(t % 60);
  const ff = Math.floor((t * 30) % 30);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(mm)}:${p(ss)}:${p(ff)}`;
}

// Verdeel clips deterministisch over de tijdas op basis van gewichten.
function layout(weights: number[], gap = 2.4): { left: number; width: number }[] {
  const n = weights.length;
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const avail = 100 - gap * (n + 1);
  let x = gap;
  return weights.map((w) => {
    const width = (w / sum) * avail;
    const seg = { left: x, width };
    x += width + gap;
    return seg;
  });
}

/* ---------- Kleine bouwstenen ---------- */

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
      style={{
        ...ui,
        color: m.color,
        background: `${m.color}1a`,
        border: `1px solid ${m.color}44`,
      }}
    >
      <Icon size={11} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function TransportButton({
  onClick,
  label,
  children,
  active,
}: {
  onClick?: () => void;
  label: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-9 w-9 items-center justify-center rounded-[6px] transition-colors ${RING}`}
      style={{
        color: active ? C.bg : C.fg,
        background: active ? C.accent : C.panelHi,
        border: `1px solid ${active ? C.accent : C.line}`,
      }}
    >
      {children}
    </button>
  );
}

/* ---------- Tijdlijn: clips-model ---------- */

type Clip = {
  id: string;
  label: string;
  sub: string;
  left: number;
  width: number;
  color: string;
  status?: CredStatus;
};

type Track = { id: string; name: string; Icon: typeof Layers; color: string; clips: Clip[] };

function buildTracks(): Track[] {
  const opdLay = layout(OPDRACHTEN.map((o) => digits(o.uren) || 20));
  const verLay = layout(CREDENTIALS.map(() => 1));
  const facLay = layout(FACTUREN.map((f) => Math.max(digits(f.bedrag), 400)));

  return [
    {
      id: "opdrachten",
      name: "Opdrachten",
      Icon: Film,
      color: C.trackOpd,
      clips: OPDRACHTEN.map((o, i) => ({
        id: o.id,
        label: o.titel,
        sub: `${o.plaats} · ${o.tarief}`,
        left: opdLay[i]!.left,
        width: opdLay[i]!.width,
        color: C.trackOpd,
      })),
    },
    {
      id: "verificatie",
      name: "Verificatie",
      Icon: ShieldCheck,
      color: C.trackVer,
      clips: CREDENTIALS.map((c, i) => ({
        id: c.naam,
        label: c.naam,
        sub: c.detail,
        left: verLay[i]!.left,
        width: verLay[i]!.width,
        color: credMeta(c.status).color,
        status: c.status,
      })),
    },
    {
      id: "facturen",
      name: "Facturen",
      Icon: FileText,
      color: C.trackFac,
      clips: FACTUREN.map((f, i) => ({
        id: f.nr,
        label: f.nr,
        sub: `${f.klant} · ${f.bedrag}`,
        left: facLay[i]!.left,
        width: facLay[i]!.width,
        color: f.status === "Betaald" ? C.ok : f.status === "Openstaand" ? C.warn : C.faint,
      })),
    },
  ];
}

/* ---------- Tijdliniaal ---------- */

function Ruler({ zoom, markers }: { zoom: number; markers: { at: number; label: string }[] }) {
  const ticks = Math.round(12 * zoom);
  return (
    <div className="relative h-7 select-none" style={{ borderBottom: `1px solid ${C.line}` }}>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const pos = (i / ticks) * 100;
        const major = i % 2 === 0;
        return (
          <div
            key={i}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: `${pos}%` }}
          >
            <span
              style={{ width: 1, height: major ? 12 : 7, background: major ? C.faint : C.lineSoft }}
            />
            {major && (
              <span
                className="mt-0.5 -translate-x-1/2 text-[9px] tabular-nums"
                style={{ ...mono, color: C.faint }}
              >
                {timecode((pos / 100) * (100 / zoom))}
              </span>
            )}
          </div>
        );
      })}
      {/* Acties als hoofdstuk-markers */}
      {markers.map((m, i) => (
        <div key={i} className="absolute top-0" style={{ left: `${m.at}%` }} title={m.label}>
          <span
            className="block -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: `7px solid ${C.accent}`,
            }}
            aria-hidden="true"
          />
        </div>
      ))}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept96() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [pos, setPos] = useState(18);
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [snap, setSnap] = useState(true);

  const [selOpdracht, setSelOpdracht] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const [selCred, setSelCred] = useState<string>(CREDENTIALS[0]?.naam ?? "");
  const [selFactuur, setSelFactuur] = useState<string>(FACTUREN[0]?.nr ?? "");
  const [selActie, setSelActie] = useState(0);

  const tracks = buildTracks();
  const markers = ACTIES.map((a, i) => ({ at: 14 + i * 28, label: a.titel }));

  // Transport: playhead loopt door bij afspelen (deterministische stap, geen random).
  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => {
      setPos((p) => {
        if (p >= 100) {
          setPlaying(false);
          return 100;
        }
        return Math.min(p + 0.7, 100);
      });
    }, 45);
    return () => window.clearInterval(t);
  }, [playing]);

  const selectClip = (trackId: string, clipId: string, left: number) => {
    if (snap) setPos(Math.max(0, Math.min(left + 2, 100)));
    if (trackId === "opdrachten") {
      setSelOpdracht(clipId);
      setScreen("marktplaats");
    } else if (trackId === "verificatie") {
      setSelCred(clipId);
      setScreen("verificatie");
    } else if (trackId === "facturen") {
      setSelFactuur(clipId);
      setScreen("facturen");
    }
  };

  const activeTrackId =
    screen === "marktplaats" || screen === "opdracht"
      ? "opdrachten"
      : screen === "verificatie"
        ? "verificatie"
        : screen === "facturen"
          ? "facturen"
          : "";

  return (
    <div
      className="relative flex min-h-[680px] w-full flex-col overflow-hidden antialiased"
      style={{ ...ui, color: C.fg, background: C.bg }}
    >
      {/* Toolbar */}
      <header
        className="flex items-center gap-3 px-4 py-2.5"
        style={{ background: C.panel, borderBottom: `1px solid ${C.line}` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-[6px]"
            style={{ background: C.accent }}
            aria-hidden="true"
          >
            <Film size={15} strokeWidth={2.2} color={C.bg} />
          </span>
          <div className="leading-tight">
            <p className="text-[13px] font-semibold tracking-tight">Montage</p>
            <p className="text-[10px]" style={{ color: C.faint }}>
              {PROFIEL.naam} · sequentie
            </p>
          </div>
        </div>

        <nav className="ml-2 hidden gap-0.5 md:flex" aria-label="Sequenties">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`rounded-[6px] px-3 py-1.5 text-[12px] font-medium transition-colors ${RING}`}
                style={{
                  color: on ? C.accent : C.sub,
                  background: on ? "rgba(245,166,35,0.12)" : "transparent",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </nav>

        <div
          className="ml-auto flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 tabular-nums"
          style={{ ...mono, background: C.rail, border: `1px solid ${C.line}`, color: C.accent }}
        >
          <span className="text-[13px] tracking-wide">{timecode(pos)}</span>
          <span className="text-[10px]" style={{ color: C.faint }}>
            / 02:00:00
          </span>
        </div>
      </header>

      {/* Mobiele screen-switcher */}
      <div
        className="flex gap-1 overflow-x-auto px-3 py-2 md:hidden"
        style={{ background: C.panel, borderBottom: `1px solid ${C.lineSoft}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className={`shrink-0 rounded-[6px] px-3 py-1.5 text-[12px] font-medium ${RING}`}
              style={{ color: on ? C.bg : C.sub, background: on ? C.accent : C.rail }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Monitor + inspector */}
      <div className="grid flex-1 gap-3 p-3 lg:grid-cols-[1.55fr_1fr]">
        <Monitor
          screen={screen}
          pos={pos}
          selOpdracht={selOpdracht}
          selCred={selCred}
          selFactuur={selFactuur}
          selActie={selActie}
          onGo={setScreen}
        />
        <Inspector
          screen={screen}
          selOpdracht={selOpdracht}
          selCred={selCred}
          selFactuur={selFactuur}
          selActie={selActie}
          onSelActie={setSelActie}
        />
      </div>

      {/* Transport-balk */}
      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{ background: C.panel, borderTop: `1px solid ${C.line}` }}
      >
        <TransportButton label="Naar begin" onClick={() => setPos(0)}>
          <SkipBack size={16} strokeWidth={2} aria-hidden="true" />
        </TransportButton>
        <TransportButton
          label={playing ? "Pauzeren" : "Afspelen"}
          onClick={() => setPlaying((p) => !p)}
          active={playing}
        >
          {playing ? (
            <Pause size={16} strokeWidth={2.4} aria-hidden="true" />
          ) : (
            <Play size={16} strokeWidth={2.4} aria-hidden="true" />
          )}
        </TransportButton>
        <TransportButton label="Naar einde" onClick={() => setPos(100)}>
          <SkipForward size={16} strokeWidth={2} aria-hidden="true" />
        </TransportButton>

        <div className="mx-2 h-6 w-px" style={{ background: C.line }} aria-hidden="true" />

        <button
          type="button"
          onClick={() => setSnap((s) => !s)}
          aria-pressed={snap}
          className={`flex items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 text-[11.5px] font-medium ${RING}`}
          style={{
            color: snap ? C.accent : C.sub,
            background: snap ? "rgba(245,166,35,0.12)" : C.panelHi,
            border: `1px solid ${snap ? C.accentDim : C.line}`,
          }}
        >
          <Magnet size={13} strokeWidth={2.2} aria-hidden="true" /> Magnetisch
        </button>
        <span
          className="hidden items-center gap-1.5 text-[11px] sm:flex"
          style={{ color: C.faint }}
        >
          <Scissors size={13} strokeWidth={2} aria-hidden="true" /> Sleep de playhead
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
            aria-label="Uitzoomen"
            className={`flex h-8 w-8 items-center justify-center rounded-[6px] ${RING}`}
            style={{ color: C.fg, background: C.panelHi, border: `1px solid ${C.line}` }}
          >
            <ZoomOut size={15} strokeWidth={2} aria-hidden="true" />
          </button>
          <span
            className="w-12 text-center text-[11px] tabular-nums"
            style={{ ...mono, color: C.sub }}
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2, +(z + 0.25).toFixed(2)))}
            aria-label="Inzoomen"
            className={`flex h-8 w-8 items-center justify-center rounded-[6px] ${RING}`}
            style={{ color: C.fg, background: C.panelHi, border: `1px solid ${C.line}` }}
          >
            <ZoomIn size={15} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Tijdlijn */}
      <section className="px-3 pb-3" aria-label="Tijdlijn">
        <div
          className="overflow-hidden rounded-[8px]"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <div className="grid" style={{ gridTemplateColumns: "132px 1fr" }}>
            {/* Track-koppen */}
            <div className="border-r" style={{ borderColor: C.line }}>
              <div className="h-7" style={{ borderBottom: `1px solid ${C.line}` }} />
              {tracks.map((t) => {
                const on = t.id === activeTrackId;
                return (
                  <div
                    key={t.id}
                    className="flex h-[52px] items-center gap-2 px-3"
                    style={{
                      borderBottom: `1px solid ${C.lineSoft}`,
                      background: on ? "rgba(245,166,35,0.06)" : "transparent",
                    }}
                  >
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-[5px]"
                      style={{ background: `${t.color}1f` }}
                      aria-hidden="true"
                    >
                      <t.Icon size={13} strokeWidth={2.2} color={t.color} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-semibold">{t.name}</span>
                      <span className="block text-[10px]" style={{ color: C.faint }}>
                        {t.clips.length} clips
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Scrubber-veld */}
            <div className="relative">
              {/* Klikbare liniaal + playhead-slider */}
              <Ruler zoom={zoom} markers={markers} />

              {/* Verticale rasterlijnen */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  top: 28,
                  backgroundImage: `repeating-linear-gradient(90deg, ${C.grid} 0, ${C.grid} 1px, transparent 1px, transparent ${100 / (12 * zoom)}%)`,
                }}
                aria-hidden="true"
              />

              {tracks.map((t) => {
                const laneActive = t.id === activeTrackId;
                return (
                  <div
                    key={t.id}
                    className="relative h-[52px]"
                    style={{
                      borderBottom: `1px solid ${C.lineSoft}`,
                      opacity: activeTrackId && !laneActive ? 0.55 : 1,
                    }}
                  >
                    {t.clips.map((c) => {
                      const selected =
                        (t.id === "opdrachten" && c.id === selOpdracht) ||
                        (t.id === "verificatie" && c.id === selCred) ||
                        (t.id === "facturen" && c.id === selFactuur);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => selectClip(t.id, c.id, c.left)}
                          aria-label={`${c.label} — ${c.sub}`}
                          aria-pressed={selected}
                          className={`group absolute top-1.5 flex h-[40px] flex-col justify-center overflow-hidden rounded-[5px] px-2 text-left transition-all ${RING}`}
                          style={{
                            left: `${c.left}%`,
                            width: `${c.width}%`,
                            background: selected ? `${c.color}33` : `${c.color}1c`,
                            border: `1px solid ${selected ? c.color : c.color + "55"}`,
                            boxShadow: selected
                              ? `0 0 0 1px ${c.color}, 0 8px 18px -12px ${c.color}`
                              : "none",
                          }}
                        >
                          {/* Clip-handles (in/out) */}
                          <span
                            className="absolute inset-y-0 left-0 w-1"
                            style={{ background: c.color, opacity: 0.7 }}
                            aria-hidden="true"
                          />
                          <span
                            className="absolute inset-y-0 right-0 w-1"
                            style={{ background: c.color, opacity: 0.7 }}
                            aria-hidden="true"
                          />
                          <span
                            className="truncate text-[11px] font-semibold"
                            style={{ color: C.fg }}
                          >
                            {c.label}
                          </span>
                          <span className="truncate text-[9.5px]" style={{ color: C.sub }}>
                            {c.sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              {/* Playhead */}
              <div
                className="pointer-events-none absolute inset-y-0 z-10"
                style={{ left: `${pos}%` }}
                aria-hidden="true"
              >
                <div
                  className="absolute -left-[6px] top-0"
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderTop: `8px solid ${C.accent}`,
                  }}
                />
                <div
                  className="h-full"
                  style={{ width: 2, background: C.accent, boxShadow: `0 0 8px ${C.accent}88` }}
                />
              </div>

              {/* Onzichtbare scrubber over de volle breedte */}
              <label className="absolute inset-x-0 top-0 z-20 h-7">
                <span className="sr-only">Playhead-positie</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={0.5}
                  value={pos}
                  onChange={(e) => setPos(Number(e.target.value))}
                  className={`h-full w-full cursor-ew-resize opacity-0 ${RING}`}
                  aria-label="Playhead verslepen"
                />
              </label>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- Programma-monitor ---------- */

function Monitor({
  screen,
  pos,
  selOpdracht,
  selCred,
  selFactuur,
  selActie,
  onGo,
}: {
  screen: ScreenKey;
  pos: number;
  selOpdracht: string;
  selCred: string;
  selFactuur: string;
  selActie: number;
  onGo: (k: ScreenKey) => void;
}) {
  const opd = OPDRACHTEN.find((o) => o.id === selOpdracht) ?? (OPDRACHTEN[0] as Opdracht);

  return (
    <div
      className="flex flex-col overflow-hidden rounded-[8px]"
      style={{ background: "#000", border: `1px solid ${C.line}` }}
    >
      {/* Monitor-kop */}
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{ background: C.panel, borderBottom: `1px solid ${C.line}` }}
      >
        <span
          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: C.sub }}
        >
          <Circle size={8} strokeWidth={0} fill={C.alert} aria-hidden="true" /> Programma-monitor
        </span>
        <span className="text-[10.5px] tabular-nums" style={{ ...mono, color: C.faint }}>
          1920×1080 · {timecode(pos)}
        </span>
      </div>

      {/* Monitor-inhoud met safe-frame */}
      <div
        className="relative flex-1 p-4"
        style={{ background: "radial-gradient(120% 120% at 50% 0%, #16181f, #060709)" }}
      >
        <div
          className="pointer-events-none absolute inset-4 rounded-[4px]"
          style={{ border: `1px dashed ${C.lineSoft}` }}
          aria-hidden="true"
        />

        {(screen === "marktplaats" || screen === "opdracht") && (
          <MonitorOpdracht opd={opd} onGo={onGo} />
        )}
        {screen === "verificatie" && <MonitorVerificatie naam={selCred} />}
        {screen === "facturen" && <MonitorFacturen nr={selFactuur} />}
        {screen === "acties" && <MonitorActie index={selActie} onGo={onGo} />}
        {screen === "dashboard" && <MonitorDashboard onGo={onGo} opd={opd} />}
      </div>
    </div>
  );
}

function MonitorDashboard({ onGo, opd }: { onGo: (k: ScreenKey) => void; opd: Opdracht }) {
  return (
    <div className="relative">
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: C.accent }}
      >
        Sequentie · overzicht
      </p>
      <h2 className="mt-1.5 text-[24px] font-semibold leading-tight tracking-tight sm:text-[28px]">
        Goedemorgen, {PROFIEL.naam.split(" ")[0]}
      </h2>
      <p className="mt-1 text-[13px]" style={{ color: C.sub }}>
        {PROFIEL.rol} · {PROFIEL.plaats} · {PROFIEL.trust}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="rounded-[6px] p-3"
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.lineSoft}` }}
          >
            <p
              className="text-[10px] font-medium uppercase tracking-wide"
              style={{ color: C.faint }}
            >
              {k.label}
            </p>
            <p
              className="mt-1 text-[19px] font-semibold tabular-nums"
              style={{ ...mono, color: C.fg }}
            >
              {k.value}
            </p>
            <p
              className="text-[11px] font-semibold tabular-nums"
              style={{ color: k.up ? C.ok : C.warn }}
            >
              {k.up ? "▲" : "▼"} {k.trend}
            </p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onGo("marktplaats")}
        className={`mt-4 flex w-full items-center gap-3 rounded-[6px] p-3 text-left transition-colors hover:bg-white/5 ${RING}`}
        style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.line}` }}
      >
        <Play size={16} strokeWidth={2.4} color={C.accent} aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] uppercase tracking-wide" style={{ color: C.faint }}>
            Nu geladen
          </span>
          <span className="block truncate text-[13px] font-semibold">{opd.titel}</span>
        </span>
        <span
          className="text-[13px] font-semibold tabular-nums"
          style={{ ...mono, color: C.accent }}
        >
          {opd.match}%
        </span>
      </button>
    </div>
  );
}

function MonitorOpdracht({ opd, onGo }: { opd: Opdracht; onGo: (k: ScreenKey) => void }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  useEffect(() => setState("idle"), [opd.id]);
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };
  return (
    <div className="relative">
      <span
        className="text-[11px] font-semibold tracking-wide"
        style={{ ...mono, color: C.accent }}
      >
        {opd.id}
      </span>
      <h2 className="mt-1 text-[22px] font-semibold leading-tight tracking-tight sm:text-[26px]">
        {opd.titel}
      </h2>
      <p className="mt-1 flex items-center gap-1.5 text-[13px]" style={{ color: C.sub }}>
        <MapPin size={13} strokeWidth={2} aria-hidden="true" /> {opd.opdrachtgever} · {opd.plaats}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opd.tarief },
          { l: "Omvang", v: opd.uren },
          { l: "Start", v: opd.start },
          { l: "Match", v: `${opd.match}%` },
        ].map((m) => (
          <div
            key={m.l}
            className="rounded-[6px] p-2.5"
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.lineSoft}` }}
          >
            <p className="text-[10px] uppercase tracking-wide" style={{ color: C.faint }}>
              {m.l}
            </p>
            <p
              className="mt-0.5 text-[15px] font-semibold tabular-nums"
              style={{ ...mono, color: C.fg }}
            >
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={react}
          disabled={state !== "idle"}
          aria-live="polite"
          className={`inline-flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-90 ${RING}`}
          style={{ color: C.bg, background: state === "sent" ? C.ok : C.accent }}
        >
          {state === "idle" && (
            <>
              <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" /> Reageer op opdracht
            </>
          )}
          {state === "sending" && "Versturen…"}
          {state === "sent" && (
            <>
              <Check size={15} strokeWidth={3} aria-hidden="true" /> Verstuurd
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => onGo("marktplaats")}
          className={`inline-flex items-center gap-1.5 rounded-[6px] px-3 py-2.5 text-[12.5px] font-medium ${RING}`}
          style={{ color: C.sub, background: C.panelHi, border: `1px solid ${C.line}` }}
        >
          Alle opdrachten
        </button>
      </div>
    </div>
  );
}

function MonitorVerificatie({ naam }: { naam: string }) {
  const cred =
    CREDENTIALS.find((c) => c.naam === naam) ?? (CREDENTIALS[0] as (typeof CREDENTIALS)[number]);
  const meta = credMeta(cred.status);
  const doc = DOCUMENTEN.find((d) => d.status === cred.status);
  const [up, setUp] = useState<"idle" | "uploading" | "done">("idle");
  useEffect(() => setUp("idle"), [naam]);
  const start = () => {
    if (up !== "idle") return;
    setUp("uploading");
    window.setTimeout(() => setUp("done"), 900);
  };
  const canUpload = cred.status === "EXPIRING" || cred.status === "REJECTED";

  return (
    <div className="relative">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-[6px]"
          style={{ background: `${meta.color}1a`, border: `1px solid ${meta.color}44` }}
        >
          <meta.Icon size={20} strokeWidth={2} color={meta.color} aria-hidden="true" />
        </span>
        <StatusBadge status={cred.status} />
      </div>
      <h2 className="mt-3 text-[22px] font-semibold leading-tight tracking-tight sm:text-[26px]">
        {cred.naam}
      </h2>
      <p className="mt-1 text-[13px]" style={{ color: C.sub }}>
        {cred.detail}
      </p>

      <div className="mt-4">
        {up === "done" ? (
          <div
            className="flex items-center gap-2.5 rounded-[6px] p-3"
            style={{ background: `${C.ok}14`, border: `1px solid ${C.ok}44` }}
            role="status"
          >
            <Check size={18} strokeWidth={2.6} color={C.ok} aria-hidden="true" />
            <span className="text-[12.5px]">
              {doc ? doc.naam : "Nieuw bewijs"} toegevoegd — veilig bewaard, nu in beoordeling.
            </span>
          </div>
        ) : canUpload ? (
          <button
            type="button"
            onClick={start}
            disabled={up === "uploading"}
            className={`flex w-full items-center justify-center gap-2 rounded-[6px] py-3 text-[13px] font-semibold transition-colors disabled:opacity-70 ${RING}`}
            style={{ color: C.bg, background: C.accent }}
          >
            {up === "uploading" ? (
              <>
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black"
                  aria-hidden="true"
                />{" "}
                Uploaden…
              </>
            ) : (
              <>
                <Upload size={15} strokeWidth={2.2} aria-hidden="true" /> Nieuw bewijs uploaden
              </>
            )}
          </button>
        ) : (
          <div
            className="flex items-center gap-2.5 rounded-[6px] p-3"
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.lineSoft}` }}
          >
            <ShieldCheck size={17} strokeWidth={2} color={C.ok} aria-hidden="true" />
            <span className="text-[12.5px]" style={{ color: C.sub }}>
              Dit bewijsstuk is in orde. Geen actie nodig.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function MonitorFacturen({ nr }: { nr: string }) {
  const f = FACTUREN.find((x) => x.nr === nr) ?? (FACTUREN[0] as (typeof FACTUREN)[number]);
  const betaald = FACTUREN.filter((x) => x.status === "Betaald").reduce(
    (s, x) => s + digits(x.bedrag),
    0,
  );
  const open = FACTUREN.filter((x) => x.status === "Openstaand").reduce(
    (s, x) => s + digits(x.bedrag),
    0,
  );
  const color = f.status === "Betaald" ? C.ok : f.status === "Openstaand" ? C.warn : C.faint;
  return (
    <div className="relative">
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: C.accent }}
      >
        Clip · {f.nr}
      </p>
      <h2 className="mt-1.5 text-[22px] font-semibold leading-tight tracking-tight sm:text-[26px]">
        {f.klant}
      </h2>
      <div className="mt-1 flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 text-[11px] font-semibold"
          style={{ color, background: `${color}1a`, border: `1px solid ${color}44` }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: color }}
            aria-hidden="true"
          />{" "}
          {f.status}
        </span>
        <span className="text-[12px]" style={{ color: C.sub }}>
          {f.datum}
        </span>
      </div>

      <p
        className="mt-4 text-[34px] font-semibold tabular-nums tracking-tight"
        style={{ ...mono, color: C.fg }}
      >
        {f.bedrag}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div
          className="rounded-[6px] p-3"
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.lineSoft}` }}
        >
          <p className="text-[10px] uppercase tracking-wide" style={{ color: C.faint }}>
            Totaal ontvangen
          </p>
          <p
            className="mt-0.5 text-[16px] font-semibold tabular-nums"
            style={{ ...mono, color: C.ok }}
          >
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </div>
        <div
          className="rounded-[6px] p-3"
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.lineSoft}` }}
        >
          <p className="text-[10px] uppercase tracking-wide" style={{ color: C.faint }}>
            Openstaand
          </p>
          <p
            className="mt-0.5 text-[16px] font-semibold tabular-nums"
            style={{ ...mono, color: C.warn }}
          >
            € {open.toLocaleString("nl-NL")}
          </p>
        </div>
      </div>
    </div>
  );
}

function MonitorActie({ index, onGo }: { index: number; onGo: (k: ScreenKey) => void }) {
  const a = ACTIES[index] ?? ACTIES[0];
  if (!a) return null;
  const warn = a.urgentie === "warning";
  const color = warn ? C.warn : C.accent;
  return (
    <div className="relative">
      <span
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color }}
      >
        {warn ? (
          <AlertTriangle size={13} strokeWidth={2.4} aria-hidden="true" />
        ) : (
          <Play size={13} strokeWidth={2.4} aria-hidden="true" />
        )}
        {warn ? "Belangrijk" : "Kans"} · marker {index + 1}
      </span>
      <h2 className="mt-2 text-[22px] font-semibold leading-tight tracking-tight sm:text-[26px]">
        {a.titel}
      </h2>
      <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: C.sub }}>
        {a.detail}
      </p>
      <button
        type="button"
        onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
        className={`mt-4 inline-flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-[13px] font-semibold ${RING}`}
        style={{ color: C.bg, background: color }}
      >
        {a.cta} <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
      </button>
    </div>
  );
}

/* ---------- Inspector ---------- */

function Inspector({
  screen,
  selOpdracht,
  selCred,
  selFactuur,
  selActie,
  onSelActie,
}: {
  screen: ScreenKey;
  selOpdracht: string;
  selCred: string;
  selFactuur: string;
  selActie: number;
  onSelActie: (i: number) => void;
}) {
  const opd = OPDRACHTEN.find((o) => o.id === selOpdracht) ?? (OPDRACHTEN[0] as Opdracht);

  return (
    <div
      className="flex flex-col overflow-hidden rounded-[8px]"
      style={{ background: C.panel, border: `1px solid ${C.line}` }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        <Layers size={14} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
        <span
          className="text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: C.sub }}
        >
          Inspector
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {(screen === "marktplaats" || screen === "opdracht" || screen === "dashboard") && (
          <div className="space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide" style={{ color: C.faint }}>
                Waarom deze match
              </p>
              <ul className="mt-2 space-y-1.5">
                {opd.redenen.plus.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-[12.5px]">
                    <Check
                      size={14}
                      strokeWidth={2.4}
                      color={C.ok}
                      className="mt-0.5 shrink-0"
                      aria-hidden="true"
                    />{" "}
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide" style={{ color: C.faint }}>
                Aandachtspunten
              </p>
              <ul className="mt-2 space-y-1.5">
                {opd.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[12.5px]"
                    style={{ color: C.sub }}
                  >
                    <AlertTriangle
                      size={14}
                      strokeWidth={2.2}
                      color={C.warn}
                      className="mt-0.5 shrink-0"
                      aria-hidden="true"
                    />{" "}
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {opd.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-[4px] px-2 py-0.5 text-[11px] font-medium"
                  style={{
                    color: C.sub,
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${C.lineSoft}`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {screen === "verificatie" && (
          <ul className="space-y-1.5">
            {CREDENTIALS.map((c) => {
              const m = credMeta(c.status);
              const on = c.naam === selCred;
              return (
                <li
                  key={c.naam}
                  className="flex items-center gap-2.5 rounded-[6px] p-2.5"
                  style={{
                    background: on ? "rgba(245,166,35,0.08)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${on ? C.accentDim : C.lineSoft}`,
                  }}
                >
                  <m.Icon size={15} strokeWidth={2} color={m.color} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-semibold">{c.naam}</span>
                    <span className="block truncate text-[10.5px]" style={{ color: C.faint }}>
                      {c.detail}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {screen === "facturen" && (
          <ul className="space-y-1.5">
            {FACTUREN.map((f) => {
              const on = f.nr === selFactuur;
              const color =
                f.status === "Betaald" ? C.ok : f.status === "Openstaand" ? C.warn : C.faint;
              return (
                <li
                  key={f.nr}
                  className="flex items-center gap-2.5 rounded-[6px] p-2.5"
                  style={{
                    background: on ? "rgba(245,166,35,0.08)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${on ? C.accentDim : C.lineSoft}`,
                  }}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: color }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[12px] font-semibold tabular-nums"
                      style={{ ...mono }}
                    >
                      {f.nr}
                    </span>
                    <span className="block truncate text-[10.5px]" style={{ color: C.faint }}>
                      {f.klant}
                    </span>
                  </span>
                  <span
                    className="text-[12px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.fg }}
                  >
                    {f.bedrag}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {screen === "acties" && (
          <ul className="space-y-1.5">
            {ACTIES.map((a, i) => {
              const on = i === selActie;
              const warn = a.urgentie === "warning";
              const color = warn ? C.warn : C.accent;
              return (
                <li key={a.titel}>
                  <button
                    type="button"
                    onClick={() => onSelActie(i)}
                    aria-pressed={on}
                    className={`flex w-full items-start gap-2.5 rounded-[6px] p-2.5 text-left transition-colors ${RING}`}
                    style={{
                      background: on ? "rgba(245,166,35,0.08)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${on ? C.accentDim : C.lineSoft}`,
                    }}
                  >
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] text-[10px] font-bold tabular-nums"
                      style={{ ...mono, color, background: `${color}1f` }}
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12.5px] font-semibold">{a.titel}</span>
                      <span className="block truncate text-[10.5px]" style={{ color: C.faint }}>
                        {a.cta}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderTop: `1px solid ${C.line}` }}
      >
        <span className="flex items-center gap-1.5 text-[10.5px]" style={{ color: C.faint }}>
          <Plus size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.initialen} · project
        </span>
        <span className="text-[10.5px] tabular-nums" style={{ ...mono, color: C.faint }}>
          {OPDRACHTEN.length + CREDENTIALS.length + FACTUREN.length} clips
        </span>
      </div>
    </div>
  );
}
