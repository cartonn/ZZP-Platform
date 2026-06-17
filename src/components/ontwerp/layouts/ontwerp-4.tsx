"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Search,
  Filter,
  FileText,
  Clock,
  Receipt,
  Wallet,
  Check,
  ShieldCheck,
  Phone,
  MessageSquare,
  MapPin,
  Calendar,
  ChevronRight,
  MoreHorizontal,
  Download,
  Star,
} from "lucide-react";

type Status = "Actief" | "Voorgesteld" | "Afgerond" | "In behandeling";

type Kandidaat = {
  id: string;
  naam: string;
  functie: string;
  instelling: string;
  status: Status;
  tarief: number;
  match: number;
  initialen: string;
  ring: string;
  big: string;
  plaats: string;
  start: string;
  geverifieerd: boolean;
  vulgraad: number;
  stap: number;
  beoordeling: number;
};

const kandidaten: Kandidaat[] = [
  {
    id: "k1",
    naam: "Iris Hendriks",
    functie: "Verpleegkundige (BIG)",
    instelling: "ZorgGroep Midden",
    status: "Actief",
    tarief: 72,
    match: 96,
    initialen: "IH",
    ring: "bg-primary/15 text-primary",
    big: "BIG 49081234501",
    plaats: "Utrecht",
    start: "12 jun 2026",
    geverifieerd: true,
    vulgraad: 88,
    stap: 2,
    beoordeling: 4.9,
  },
  {
    id: "k2",
    naam: "Mark Jansen",
    functie: "Verzorgende IG",
    instelling: "Verpleeghuis De Noorderbrug",
    status: "Voorgesteld",
    tarief: 54,
    match: 91,
    initialen: "MJ",
    ring: "bg-accent text-accent-foreground",
    big: "Niet BIG-plichtig",
    plaats: "Groningen",
    start: "20 jun 2026",
    geverifieerd: true,
    vulgraad: 64,
    stap: 1,
    beoordeling: 4.7,
  },
  {
    id: "k3",
    naam: "Sanne de Vries",
    functie: "Wijkverpleegkundige",
    instelling: "ZorgGroep Midden",
    status: "In behandeling",
    tarief: 68,
    match: 84,
    initialen: "SV",
    ring: "bg-success/10 text-success",
    big: "BIG 19081299402",
    plaats: "Amersfoort",
    start: "Wachtend",
    geverifieerd: false,
    vulgraad: 41,
    stap: 0,
    beoordeling: 4.6,
  },
  {
    id: "k4",
    naam: "Fatima El Amrani",
    functie: "Verpleegkundige (BIG)",
    instelling: "Verpleeghuis De Noorderbrug",
    status: "Afgerond",
    tarief: 70,
    match: 88,
    initialen: "FE",
    ring: "bg-warning/15 text-warning",
    big: "BIG 29051234503",
    plaats: "Groningen",
    start: "1 mei 2026",
    geverifieerd: true,
    vulgraad: 100,
    stap: 4,
    beoordeling: 5.0,
  },
];

const statusStijl: Record<Status, string> = {
  Actief: "bg-success/10 text-success",
  Voorgesteld: "bg-primary/10 text-primary",
  "In behandeling": "bg-warning/15 text-warning",
  Afgerond: "bg-muted text-muted-foreground",
};

const stappen = [
  { label: "Contract", icon: FileText },
  { label: "Urenstaat", icon: Clock },
  { label: "Factuur", icon: Receipt },
  { label: "Betaling", icon: Wallet },
];

const documenten = [
  { naam: "VOG zorgsector.pdf", meta: "Geverifieerd · 220 kB", ok: true },
  { naam: "BIG-registratie.pdf", meta: "Geverifieerd · 96 kB", ok: true },
  { naam: "Beroepsaansprakelijkheid.pdf", meta: "Verloopt 31 dec 2026", ok: true },
  { naam: "Modelovereenkomst (Wet DBA).pdf", meta: "Ondertekend 12 jun", ok: true },
];

export default function OntwerpMasterDetail() {
  const [actief, setActief] = useState<string>("k1");
  const geselecteerd = kandidaten.find((k) => k.id === actief) ?? kandidaten[0]!;

  return (
    <div className="flex min-h-[620px] w-full flex-col overflow-hidden rounded-2xl border border-border bg-background text-foreground">
      {/* Kop */}
      <header className="flex items-center justify-between gap-4 border-b border-border bg-card/60 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold">Bemiddeling — Samenwerkingen</p>
            <p className="text-xs text-muted-foreground">ZorgGroep Midden · regio Utrecht/Noord</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-muted-foreground">
            <Search className="h-3.5 w-3.5" />
            <span>Zoek kandidaat of dienst</span>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Master: lijst */}
        <aside className="flex w-[300px] shrink-0 flex-col border-r border-border bg-card/40">
          <div className="flex items-center justify-between px-4 pb-2 pt-3">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              4 samenwerkingen
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-medium text-primary">
              2 actief
            </span>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
            {kandidaten.map((k) => {
              const isActief = k.id === actief;
              return (
                <button
                  key={k.id}
                  onClick={() => setActief(k.id)}
                  className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                    isActief
                      ? "border-primary/30 bg-card shadow-sm ring-1 ring-primary/20"
                      : "border-transparent hover:border-border hover:bg-card/70"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold ${k.ring}`}
                  >
                    {k.initialen}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-medium text-card-foreground">{k.naam}</p>
                      {k.geverifieerd && (
                        <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{k.functie}</p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusStijl[k.status]}`}
                      >
                        {k.status}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">€{k.tarief}/u</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Detail */}
        <section className="flex flex-1 flex-col overflow-y-auto bg-background">
          {/* Detailkop */}
          <div className="border-b border-border px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full font-display text-lg font-semibold ring-2 ring-background ${geselecteerd.ring}`}
                >
                  {geselecteerd.initialen}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-semibold">{geselecteerd.naam}</h2>
                    {geselecteerd.geverifieerd && (
                      <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Geverifieerd
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {geselecteerd.functie} · {geselecteerd.instelling}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {geselecteerd.plaats}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Start {geselecteerd.start}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-warning" />
                      <span className="font-mono">{geselecteerd.beoordeling.toFixed(1)}</span>
                    </span>
                  </div>
                </div>
              </div>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-input text-muted-foreground transition-colors hover:bg-muted">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            {/* Kerncijfers */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-card/60 px-4 py-3">
                <p className="text-xs text-muted-foreground">Matchscore</p>
                <p className="mt-0.5 font-mono text-xl font-semibold text-primary">
                  {geselecteerd.match}%
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card/60 px-4 py-3">
                <p className="text-xs text-muted-foreground">Uurtarief</p>
                <p className="mt-0.5 font-mono text-xl font-semibold">€{geselecteerd.tarief}</p>
              </div>
              <div className="rounded-xl border border-border bg-card/60 px-4 py-3">
                <p className="text-xs text-muted-foreground">Vulgraad rooster</p>
                <p className="mt-0.5 font-mono text-xl font-semibold text-success">
                  {geselecteerd.vulgraad}%
                </p>
              </div>
            </div>
          </div>

          {/* Werkproces stepper */}
          <div className="border-b border-border px-6 py-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Werkproces
            </p>
            <div className="flex items-center">
              {stappen.map((s, i) => {
                const Icon = s.icon;
                const gedaan = i < geselecteerd.stap;
                const huidig = i === geselecteerd.stap;
                return (
                  <div key={s.label} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                          gedaan
                            ? "border-success bg-success/10 text-success"
                            : huidig
                              ? "border-primary bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20"
                              : "border-border bg-card text-muted-foreground"
                        }`}
                      >
                        {gedaan ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <span
                        className={`text-[11px] font-medium ${
                          huidig
                            ? "text-foreground"
                            : gedaan
                              ? "text-success"
                              : "text-muted-foreground"
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < stappen.length - 1 && (
                      <div
                        className={`mx-2 h-0.5 flex-1 rounded-full ${
                          i < geselecteerd.stap ? "bg-success" : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gegevens + documenten */}
          <div className="grid flex-1 grid-cols-2 gap-px bg-border">
            {/* Gegevens */}
            <div className="bg-background px-6 py-5">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Gegevens
              </p>
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">BIG-registratie</dt>
                  <dd className="font-mono text-xs text-foreground">{geselecteerd.big}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Inzet per week</dt>
                  <dd className="font-mono text-foreground">32 uur</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Reistijd</dt>
                  <dd className="font-mono text-foreground">18 min</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Vertrouwensniveau</dt>
                  <dd className="flex items-center gap-1 text-xs font-medium text-success">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Hoog
                  </dd>
                </div>
              </dl>
            </div>

            {/* Documenten */}
            <div className="bg-background px-6 py-5">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Documenten
              </p>
              <ul className="space-y-1.5">
                {documenten.map((d) => (
                  <li
                    key={d.naam}
                    className="flex items-center gap-2.5 rounded-lg border border-border bg-card/50 px-3 py-2"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-card-foreground">{d.naam}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{d.meta}</p>
                    </div>
                    {d.ok && <BadgeCheck className="h-4 w-4 shrink-0 text-success" />}
                    <Download className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Acties */}
          <div className="flex items-center justify-between gap-3 border-t border-border bg-card/40 px-6 py-3.5">
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                <MessageSquare className="h-4 w-4" />
                Bericht
              </button>
              <button className="flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                <Phone className="h-4 w-4" />
                Bellen
              </button>
            </div>
            <button className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
              Voorstellen aan instelling
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
