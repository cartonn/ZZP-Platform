"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckChip } from "@/components/ui/check-chip";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DbaRiskBadge } from "@/components/dba/dba-risk-badge";
import { assessDbaRisk, dbaAdvice } from "@/lib/dba";
import {
  recommendModelAgreement,
  MODEL_AGREEMENT_LABELS,
  MODEL_AGREEMENT_TYPES,
} from "@/lib/model-agreement";
import { assessRateThreshold, rechtsvermoedenHint } from "@/lib/rechtsvermoeden";
import { groupSkillsByCategory, type SkillOption } from "@/lib/skill-categories";
import { JobRateBandCard } from "@/components/jobs/job-rate-band-card";
import { type MarketBand } from "@/lib/market-rate";
import { type CredentialType } from "@/lib/enums";
import { cn } from "@/lib/utils";
import { saveJob, type JobFormState } from "./actions";

// Elke DBA-indicator als gewone-mensen-vraag met een voorbeeldzin eronder. De koppeling met de
// bestaande dba-velden (namen) en de risicologica in @/lib/dba blijft ongewijzigd; alleen de
// formulering is toegankelijker. De trefwoorden ("directe aansturing", "structureel ingebed",
// "vrije vervanging") blijven bewust in de tekst staan voor herkenbaarheid en checks.
const DBA_FACTORS = [
  [
    "dbaDirectSupervision",
    "Bepaal jij hoe en wanneer het werk gebeurt?",
    "Bijv. vaste werktijden, directe aansturing of een leidinggevende die de ZZP'er dagelijks instructies geeft.",
  ],
  [
    "dbaEmbedded",
    "Is de ZZP'er onderdeel van je vaste team?",
    "Bijv. structureel ingebed: doet mee aan teamoverleg, staat op de teampagina, doet hetzelfde werk als je werknemers.",
  ],
  [
    "dbaFixedSchedule",
    "Werkt de ZZP'er op vaste uren of een rooster?",
    "Bijv. elke maandag t/m vrijdag van 9 tot 5, net als een werknemer.",
  ],
  [
    "dbaNoSubstitution",
    "Moet deze persoon het werk per se zelf doen?",
    "Bijv. vrije vervanging is niet toegestaan — een andere zelfstandige mag niet invallen.",
  ],
  [
    "dbaExclusive",
    "Werkt de ZZP'er (vrijwel) alleen voor jou?",
    "Bijv. exclusief voor dit bedrijf, nauwelijks tijd of ruimte voor andere opdrachtgevers.",
  ],
  [
    "dbaWeakEntrepreneurship",
    "Ligt het tarief onder wat gebruikelijk is in de markt?",
    "Bijv. een uurtarief lager dan wat andere zelfstandigen voor dit werk vragen, of nauwelijks andere klanten.",
  ],
] as const;

const WORK_MODE = [
  ["REMOTE", "Remote"],
  ["ONSITE", "Op locatie"],
  ["HYBRID", "Hybride"],
] as const;

const CREDENTIAL_LABELS: Record<CredentialType, string> = {
  VOG: "VOG",
  DIPLOMA: "Diploma",
  CERTIFICATE: "Certificaat",
  INSURANCE: "Verzekering",
  LICENSE: "Licentie",
  OTHER: "Overig",
};

export interface JobFormInitial {
  id?: string;
  title: string;
  description: string;
  industryId: string;
  rateMin: string;
  rateMax: string;
  location: string;
  workMode: string;
  startDate: string;
  requiredSkillIds: string[];
  optionalSkillIds: string[];
  requiredCredentialTypes: string[];
  optionalCredentialTypes: string[];
  modelAgreementType: string;
  dba: {
    dbaDirectSupervision: boolean;
    dbaEmbedded: boolean;
    dbaFixedSchedule: boolean;
    dbaNoSubstitution: boolean;
    dbaExclusive: boolean;
    dbaWeakEntrepreneurship: boolean;
    dbaDurationMonths: string;
  };
}

export function JobForm({
  initial,
  skills,
  industries,
  rateBands,
  platformRateBand,
}: {
  initial: JobFormInitial;
  skills: { id: string; name: string }[];
  industries: { id: string; name: string }[];
  /** Marktband per branche-id (met platform-terugval ingebakken). */
  rateBands: Record<string, MarketBand>;
  /** Platformbrede band als terugval wanneer geen branche is gekozen. */
  platformRateBand: MarketBand;
}) {
  const [state, formAction, isPending] = useActionState<JobFormState, FormData>(saveJob, undefined);
  const fe = state?.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  // Na een server-validatie: spring naar het eerste foutieve veld (lange form, DBA-blok onderaan).
  // Field zet aria-invalid op het foutieve input, dus dat is meteen het anker + SR-aankondiging.
  useEffect(() => {
    if (!state?.fieldErrors || Object.keys(state.fieldErrors).length === 0) return;
    const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (first) {
      first.scrollIntoView({ behavior: "smooth", block: "center" });
      first.focus({ preventScroll: true });
    }
  }, [state]);
  const [workMode, setWorkMode] = useState(initial.workMode);
  const [industryId, setIndustryId] = useState(initial.industryId);
  const [dba, setDba] = useState(initial.dba);
  const [modelAgreementType, setModelAgreementType] = useState(initial.modelAgreementType);
  const [rateMin, setRateMin] = useState(initial.rateMin);
  // Live set van vereiste skill-ids zodat de "Gewenst"-picker dezelfde skill kan uitschakelen
  // (dubbel selecteren voorkomen — alleen in de UI; de server-validatie blijft ongewijzigd).
  const [requiredSkillIds, setRequiredSkillIds] = useState<string[]>(initial.requiredSkillIds);

  const skillOptions: SkillOption[] = skills.map((s) => ({ value: s.id, label: s.name }));

  // Live rechtsvermoeden-drempelcheck op het minimumtarief (pure functie, centen).
  const rateMinCents = rateMin !== "" ? Number(rateMin) * 100 : null;
  const rateThreshold = assessRateThreshold(rateMinCents);

  // Marktband voor de gekozen branche (server-side berekend); terugval op platformbreed.
  const rateBand = (industryId && rateBands[industryId]) || platformRateBand;
  const rateMinEuro = rateMin !== "" && Number.isFinite(Number(rateMin)) ? Number(rateMin) : null;

  // De inschatting verschijnt pas nadat de opdrachtgever iets heeft aangeraakt — anders zou het blok
  // "Laag DBA-risico" tonen vóór enige input (valse geruststelling). Aangeraakt = minstens één
  // indicator aangevinkt óf een verwachte duur ingevuld.
  const dbaTouched =
    dba.dbaDirectSupervision ||
    dba.dbaEmbedded ||
    dba.dbaFixedSchedule ||
    dba.dbaNoSubstitution ||
    dba.dbaExclusive ||
    dba.dbaWeakEntrepreneurship ||
    dba.dbaDurationMonths.trim() !== "";

  // Live, deterministische DBA-inschatting (zelfde pure functie als de server gebruikt).
  const dbaResult = assessDbaRisk({
    directSupervision: dba.dbaDirectSupervision,
    embedded: dba.dbaEmbedded,
    fixedSchedule: dba.dbaFixedSchedule,
    noSubstitution: dba.dbaNoSubstitution,
    exclusive: dba.dbaExclusive,
    weakEntrepreneurship: dba.dbaWeakEntrepreneurship,
    durationMonths: dba.dbaDurationMonths ? Number(dba.dbaDurationMonths) : null,
  });

  const modelRec = recommendModelAgreement({
    directSupervision: dba.dbaDirectSupervision,
    embedded: dba.dbaEmbedded,
    fixedSchedule: dba.dbaFixedSchedule,
    noSubstitution: dba.dbaNoSubstitution,
    exclusive: dba.dbaExclusive,
    weakEntrepreneurship: dba.dbaWeakEntrepreneurship,
    durationMonths: dba.dbaDurationMonths ? Number(dba.dbaDurationMonths) : null,
  });

  return (
    <form ref={formRef} action={formAction} noValidate className="space-y-6">
      {initial.id && <input type="hidden" name="jobId" value={initial.id} />}

      <div className="space-y-1 border-b border-border pb-2">
        <h2 className="text-sm font-semibold tracking-tight">Basisgegevens</h2>
        <p className="text-xs text-muted-foreground">
          Wat houdt de opdracht in en onder welke voorwaarden?
        </p>
      </div>

      <Field label="Titel" htmlFor="title" required error={fe.title}>
        <Input
          id="title"
          name="title"
          defaultValue={initial.title}
          required
          maxLength={160}
          placeholder="Bijv. Frontend Developer (React)"
        />
      </Field>

      <Field label="Omschrijving" htmlFor="description" required error={fe.description}>
        <Textarea
          id="description"
          name="description"
          defaultValue={initial.description}
          required
          rows={6}
          maxLength={5000}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Branche" htmlFor="industryId" error={fe.industryId}>
          <Select
            id="industryId"
            name="industryId"
            value={industryId}
            onChange={(e) => setIndustryId(e.target.value)}
          >
            <option value="">— Kies een branche —</option>
            {industries.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Werkmodus" htmlFor="workMode" error={fe.workMode}>
          <Select
            id="workMode"
            name="workMode"
            value={workMode}
            onChange={(e) => setWorkMode(e.target.value)}
          >
            {WORK_MODE.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Min. tarief (€/uur)" htmlFor="rateMin" error={fe.rateMin}>
          <Input
            id="rateMin"
            name="rateMin"
            type="number"
            min={0}
            max={2000}
            value={rateMin}
            onChange={(e) => setRateMin(e.target.value)}
          />
          {rateThreshold.belowThreshold && (
            <p className="mt-1 text-xs text-warning" role="note">
              {rechtsvermoedenHint()}
            </p>
          )}
        </Field>
        <Field label="Max. tarief (€/uur)" htmlFor="rateMax" error={fe.rateMax}>
          <Input
            id="rateMax"
            name="rateMax"
            type="number"
            min={0}
            max={2000}
            defaultValue={initial.rateMax}
          />
        </Field>
        <Field label="Locatie" htmlFor="location" error={fe.location}>
          <Input
            id="location"
            name="location"
            defaultValue={initial.location}
            placeholder="Amsterdam"
          />
        </Field>
        <Field label="Startdatum" htmlFor="startDate" error={fe.startDate}>
          <DateInput id="startDate" name="startDate" defaultValue={initial.startDate} />
        </Field>
      </div>

      <JobRateBandCard band={rateBand} rateMin={rateMinEuro} />

      <div className="space-y-1 border-b border-border pb-2 pt-2">
        <h2 className="text-sm font-semibold tracking-tight">Eisen aan de ZZP&apos;er</h2>
        <p className="text-xs text-muted-foreground">
          Skills en certificaten bepalen de match en de compliance-check.
        </p>
      </div>

      <SkillPicker
        legend="Vereiste skills"
        name="requiredSkillIds"
        options={skillOptions}
        selected={requiredSkillIds}
        onSelectedChange={setRequiredSkillIds}
      />
      <SkillPicker
        legend="Gewenste skills"
        name="optionalSkillIds"
        options={skillOptions}
        selected={initial.optionalSkillIds}
        // Al als "vereist" gekozen skills kunnen niet óók "gewenst" zijn (zou dubbel tellen).
        disabledValues={requiredSkillIds}
        disabledHint="al vereist"
      />
      <ChipGroup
        legend="Vereiste certificaten"
        name="requiredCredentialTypes"
        options={Object.entries(CREDENTIAL_LABELS).map(([value, label]) => ({ value, label }))}
        selected={initial.requiredCredentialTypes}
      />
      <ChipGroup
        legend="Gewenste certificaten"
        name="optionalCredentialTypes"
        options={Object.entries(CREDENTIAL_LABELS).map(([value, label]) => ({ value, label }))}
        selected={initial.optionalCredentialTypes}
      />

      <div className="space-y-1 border-b border-border pb-2 pt-2">
        <h2 className="text-sm font-semibold tracking-tight">Compliance &amp; overeenkomst</h2>
        <p className="text-xs text-muted-foreground">
          We toetsen het risico op schijnzelfstandigheid en adviseren een modelovereenkomst.
        </p>
      </div>

      <fieldset className="space-y-3 rounded-lg border border-border bg-card p-5">
        <legend className="text-sm font-medium">Wet DBA — risicocheck</legend>
        <p className="text-xs text-muted-foreground">
          Vink aan wat van toepassing is. We tonen direct het risico op schijnzelfstandigheid met
          uitleg. Dit is een hulpmiddel, geen juridisch advies.
        </p>
        <div className="space-y-3">
          {DBA_FACTORS.map(([name, question, example]) => (
            <label key={name} className="flex items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                name={name}
                checked={dba[name]}
                onChange={(e) => setDba((d) => ({ ...d, [name]: e.target.checked }))}
                className="mt-0.5"
              />
              <span className="space-y-0.5">
                <span className="block">{question}</span>
                <span className="block text-xs text-muted-foreground">{example}</span>
              </span>
            </label>
          ))}
        </div>
        <Field label="Verwachte duur (maanden)" htmlFor="dbaDurationMonths">
          <Input
            id="dbaDurationMonths"
            name="dbaDurationMonths"
            type="number"
            min={0}
            max={240}
            value={dba.dbaDurationMonths}
            onChange={(e) => setDba((d) => ({ ...d, dbaDurationMonths: e.target.value }))}
            className="max-w-32"
          />
        </Field>

        {!dbaTouched ? (
          <p className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            Vink aan wat van toepassing is — daarna zie je direct de risico-inschatting.
          </p>
        ) : (
          <div className="rounded-md border border-border bg-muted/40 p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Inschatting:</span>
              <DbaRiskBadge level={dbaResult.level} />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">{dbaAdvice(dbaResult.level)}</p>
            {dbaResult.reasons.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {dbaResult.reasons.map((r) => (
                  <li key={r.factor}>{r.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {dbaTouched && modelRec.recommended && (
          <div className="rounded-md border border-border bg-muted/40 p-3">
            <p className="text-sm font-medium">Aanbevolen modelovereenkomst: {modelRec.label}</p>
            {modelRec.reasons.length > 0 && (
              <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {modelRec.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
            <p className="mt-1.5 text-[11px] text-muted-foreground/70">{modelRec.note}</p>
          </div>
        )}

        <Field label="Vastgelegde modelovereenkomst" htmlFor="modelAgreementType">
          <Select
            id="modelAgreementType"
            name="modelAgreementType"
            value={modelAgreementType}
            onChange={(e) => setModelAgreementType(e.target.value)}
          >
            <option value="">Automatisch — aanbevolen op basis van de risicocheck</option>
            {MODEL_AGREEMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {MODEL_AGREEMENT_LABELS[t]}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-muted-foreground">
            Laat je dit op &laquo;Automatisch&raquo; staan, dan kiezen we bij elke opdracht de best
            passende modelovereenkomst op basis van de risicocheck hierboven. Je kunt altijd zelf
            een vorm vastleggen.
          </p>
        </Field>
      </fieldset>

      {initial.id ? (
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Opslaan…" : "Wijzigingen opslaan"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {/* Twee expliciete paden. "intent" bepaalt server-side of we na het aanmaken direct
              publiceren (via de bestaande JOB_TRANSITIONS-overgang, met dezelfde validaties als de
              detailpagina). De publiceer-knop staat als een submit-button met eigen name/value zodat
              de gekozen knop meekomt in de FormData. */}
          <Button type="submit" name="intent" value="publish" disabled={isPending}>
            {isPending ? "Opslaan…" : "Opslaan & publiceren"}
          </Button>
          <Button
            type="submit"
            name="intent"
            value="draft"
            variant="secondary"
            disabled={isPending}
          >
            {isPending ? "Opslaan…" : "Opslaan als concept"}
          </Button>
          <span className="text-xs text-muted-foreground">
            Publiceren maakt de opdracht direct zichtbaar voor ZZP&apos;ers. Als concept opslaan kan
            altijd; publiceren doe je later ook op de detailpagina.
          </span>
        </div>
      )}
      {state?.error && !Object.keys(fe).length && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}

function ChipGroup({
  legend,
  name,
  options,
  selected,
  emptyText,
}: {
  legend: string;
  name: string;
  options: { value: string; label: string }[];
  selected: string[];
  emptyText?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-medium">{legend}</legend>
      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((o) => (
            <CheckChip
              key={o.value}
              name={name}
              value={o.value}
              label={o.label}
              defaultChecked={selected.includes(o.value)}
            />
          ))}
        </div>
      )}
    </fieldset>
  );
}

/**
 * Skill-kiezer: groepeert pills onder rustige categorie-kopjes, met een klein zoekveld dat de
 * zichtbare pills client-side filtert (op label én categorie, case-insensitief). Geselecteerde
 * skills blijven altijd zichtbaar. Waarden in `disabledValues` worden uitgeschakeld met een hint
 * (bijv. "al vereist") — puur UI-preventie; de server-validatie verandert niet.
 */
function SkillPicker({
  legend,
  name,
  options,
  selected,
  onSelectedChange,
  disabledValues = [],
  disabledHint,
}: {
  legend: string;
  name: string;
  options: SkillOption[];
  selected: string[];
  onSelectedChange?: (next: string[]) => void;
  disabledValues?: string[];
  disabledHint?: string;
}) {
  const [query, setQuery] = useState("");
  // Interne selectie zodat geselecteerde skills altijd zichtbaar blijven, ook bij een actief filter.
  const [chosen, setChosen] = useState<string[]>(selected);
  const disabledSet = new Set(disabledValues);

  // Wordt een gekozen skill later uitgeschakeld (bijv. nu ook als "vereist" gekozen), verwijder
  // 'm uit deze selectie zodat de pill niet als aangevinkt blijft ogen. Een disabled checkbox
  // wordt sowieso niet meegepost, dus dit is puur cosmetisch/consistent.
  useEffect(() => {
    if (disabledValues.length === 0) return;
    setChosen((prev) => {
      const next = prev.filter((v) => !disabledSet.has(v));
      return next.length === prev.length ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledValues.join(",")]);

  function toggle(value: string, checked: boolean) {
    const next = checked ? [...chosen, value] : chosen.filter((v) => v !== value);
    setChosen(next);
    onSelectedChange?.(next);
  }

  const groups = useMemo(() => groupSkillsByCategory(options), [options]);
  const needle = query.trim().toLowerCase();

  const visibleGroups = groups
    .map((group) => ({
      category: group.category,
      options: group.options.filter((o) => {
        if (chosen.includes(o.value)) return true; // gekozen skills blijven altijd zichtbaar
        if (needle === "") return true;
        return (
          o.label.toLowerCase().includes(needle) || group.category.toLowerCase().includes(needle)
        );
      }),
    }))
    .filter((group) => group.options.length > 0);

  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-medium">{legend}</legend>
      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen skills beschikbaar.</p>
      ) : (
        <div className="space-y-3">
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek skill…"
            aria-label={`Zoek in ${legend.toLowerCase()}`}
            className="max-w-xs"
          />
          {visibleGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen skills gevonden voor “{query}”.</p>
          ) : (
            <div className="space-y-3">
              {visibleGroups.map((group) => (
                <div key={group.category} className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">{group.category}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.options.map((o) => {
                      const isDisabled = disabledSet.has(o.value);
                      return (
                        <label
                          key={o.value}
                          title={isDisabled ? disabledHint : undefined}
                          className={cn(
                            "select-none rounded-full border px-3 py-1 text-sm transition-colors",
                            isDisabled
                              ? "cursor-not-allowed border-border bg-muted/50 text-muted-foreground"
                              : "cursor-pointer border-border hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background",
                          )}
                        >
                          <input
                            type="checkbox"
                            name={name}
                            value={o.value}
                            checked={chosen.includes(o.value)}
                            disabled={isDisabled}
                            onChange={(e) => toggle(o.value, e.target.checked)}
                            className="sr-only"
                          />
                          {o.label}
                          {isDisabled && disabledHint && (
                            <span className="ml-1.5 text-xs text-muted-foreground/80">
                              · {disabledHint}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </fieldset>
  );
}
