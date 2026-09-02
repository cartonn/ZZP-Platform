"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useT } from "@/components/i18n/locale-provider";
import { splitSkillChips } from "@/lib/skill-categories";
import { cn } from "@/lib/utils";

/** Eén vaardigheids-chip in het filterpaneel (dezelfde pill-vorm als de quickfilters). */
function SkillChip({
  id,
  name,
  selected,
  onToggle,
}: {
  id: string;
  name: string;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(id)}
      aria-pressed={selected}
      className={cn(
        "focus-ring rounded-full border px-3 py-1 text-sm transition-colors",
        selected ? "border-primary bg-accent" : "border-border hover:bg-muted",
      )}
    >
      {name}
    </button>
  );
}

const CREDENTIALS = [
  ["", "Alle certificaten"],
  ["VOG", "VOG"],
  ["DIPLOMA", "Diploma"],
  ["CERTIFICATE", "Certificaat"],
  ["INSURANCE", "Verzekering"],
  ["LICENSE", "Licentie"],
] as const;

export function JobFilters({
  industries,
  skills,
  myIndustryCount = 0,
  mySkillIds = [],
  canSortByMatch = false,
  canHideApplied = false,
  canFilterEligible = false,
}: {
  industries: { id: string; name: string }[];
  skills: { id: string; name: string }[];
  /**
   * Aantal profielbranches van de ZZP'er; >0 toont de "Mijn vakgebied"-quickfilter én zet die
   * standaard aan (dezelfde standaard die de server hanteert — de client beslist niets).
   */
  myIndustryCount?: number;
  /** Vaardigheden van het eigen profiel: die chips staan vooraan, de rest achter "Meer vaardigheden". */
  mySkillIds?: string[];
  /** Toont "Beste match eerst" als sorteeroptie (alleen zinvol voor een ZZP'er mét profiel). */
  canSortByMatch?: boolean;
  /** Toont de "Verberg opdrachten waarop ik al reageerde"-quickfilter (ZZP'er mét profiel). */
  canHideApplied?: boolean;
  /** Toont de "Alleen waar ik aan voldoe"-quickfilter (ZZP'er mét profiel; compliance-gebaseerd). */
  canFilterEligible?: boolean;
}) {
  const translate = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  const push = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const next = new URLSearchParams(Array.from(params.entries()));
      mutate(next);
      next.delete("page"); // filterwijziging -> terug naar pagina 1
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  // Debounced vrije-tekst-zoekopdracht.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => {
      push((p) => {
        if (q) p.set("q", q);
        else p.delete("q");
      });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const set = (key: string, value: string) =>
    push((p) => {
      if (value) p.set(key, value);
      else p.delete(key);
    });

  // "Mijn vakgebied" staat standaard aan zodra de ZZP'er branches op zijn profiel heeft: hij opent
  // de marktplaats dan op zijn eigen vakgebied. Een expliciete keuze in de URL (1/0) wint altijd en
  // blijft bewaard; uitzetten schrijft dus `mine=0` in plaats van de param te wissen.
  const mineParam = params.get("mine");
  const mineActive = mineParam === "1" || (mineParam !== "0" && myIndustryCount > 0);
  const toggleMine = () =>
    push((p) => {
      if (mineActive) {
        p.set("mine", "0");
      } else {
        p.set("mine", "1");
        p.delete("industryId"); // "Mijn vakgebied" overkoepelt de expliciete branchekeuze
      }
    });

  // Een expliciet gekozen branche overkoepelt "Mijn vakgebied" (zelfde regel als de where-builder),
  // dus zetten we de quickfilter dan uit in plaats van de keuzelijst te blokkeren.
  const setIndustry = (value: string) =>
    push((p) => {
      if (value) {
        p.set("industryId", value);
        p.set("mine", "0");
      } else {
        p.delete("industryId");
      }
    });

  const hideAppliedActive = params.get("hideApplied") === "1";
  const toggleHideApplied = () =>
    push((p) => {
      if (hideAppliedActive) p.delete("hideApplied");
      else p.set("hideApplied", "1");
    });

  const onlyEligibleActive = params.get("onlyEligible") === "1";
  const toggleOnlyEligible = () =>
    push((p) => {
      if (onlyEligibleActive) p.delete("onlyEligible");
      else p.set("onlyEligible", "1");
    });

  const selectedSkills = new Set(params.getAll("skillIds"));
  // Vaardigheids-chips: eerst wat voor déze ZZP'er telt (eigen profielvaardigheden + wat al
  // gefilterd is), de rest ingeklapt achter "Meer vaardigheden". Zo begint een verpleegkundige niet
  // bij AWS en Node.js. Zonder profiel valt de volgorde terug op de categorie-volgorde (zorg eerst).
  const [showAllSkills, setShowAllSkills] = useState(false);
  const relevantSkillIds = useMemo(
    () => [...new Set([...mySkillIds, ...selectedSkills])],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mySkillIds.join(","), [...selectedSkills].join(",")],
  );
  const { primary: primarySkills, more: moreSkills } = useMemo(
    () =>
      splitSkillChips(
        skills.map((s) => ({ value: s.id, label: s.name })),
        relevantSkillIds,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [skills, relevantSkillIds],
  );

  const toggleSkill = (id: string) =>
    push((p) => {
      const current = new Set(p.getAll("skillIds"));
      p.delete("skillIds");
      if (current.has(id)) current.delete(id);
      else current.add(id);
      for (const s of current) p.append("skillIds", s);
    });

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      {(myIndustryCount > 0 || canHideApplied || canFilterEligible) && (
        <div className="flex flex-wrap items-center gap-2">
          {myIndustryCount > 0 && (
            <button
              type="button"
              onClick={toggleMine}
              aria-pressed={mineActive}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                mineActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted",
              )}
            >
              {translate("Mijn vakgebied")}
            </button>
          )}
          {canHideApplied && (
            <button
              type="button"
              onClick={toggleHideApplied}
              aria-pressed={hideAppliedActive}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                hideAppliedActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted",
              )}
            >
              {translate("Verberg waar ik op reageerde")}
            </button>
          )}
          {canFilterEligible && (
            <button
              type="button"
              onClick={toggleOnlyEligible}
              aria-pressed={onlyEligibleActive}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                onlyEligibleActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted",
              )}
            >
              {translate("Alleen waar ik aan voldoe")}
            </button>
          )}
          {mineActive && (
            <span className="text-xs text-muted-foreground">
              {translate("Alleen opdrachten in jouw branche(s).")}
            </span>
          )}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          aria-label={translate("Zoeken")}
          placeholder={translate("Zoek op titel of omschrijving…")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sm:col-span-2 lg:col-span-2"
        />
        <Select
          aria-label={translate("Branche")}
          value={params.get("industryId") ?? ""}
          onChange={(e) => setIndustry(e.target.value)}
        >
          <option value="">{translate("Alle branches")}</option>
          {industries.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label={translate("Werkmodus")}
          value={params.get("workMode") ?? ""}
          onChange={(e) => set("workMode", e.target.value)}
        >
          <option value="">{translate("Alle werkmodi")}</option>
          <option value="REMOTE">{translate("Remote")}</option>
          <option value="ONSITE">{translate("Op locatie")}</option>
          <option value="HYBRID">{translate("Hybride")}</option>
        </Select>
        <Input
          aria-label={translate("Locatie")}
          placeholder={translate("Plaats of regio…")}
          defaultValue={params.get("location") ?? ""}
          onBlur={(e) => set("location", e.target.value.trim())}
        />
        <Input
          type="number"
          min={0}
          aria-label={translate("Minimumtarief")}
          placeholder={translate("Min. €/uur")}
          defaultValue={params.get("rateMin") ?? ""}
          onBlur={(e) => set("rateMin", e.target.value)}
        />
        <Input
          type="number"
          min={0}
          aria-label={translate("Maximumtarief")}
          placeholder={translate("Max. €/uur")}
          defaultValue={params.get("rateMax") ?? ""}
          onBlur={(e) => set("rateMax", e.target.value)}
        />
        <Select
          aria-label={translate("Vereist certificaat")}
          value={params.get("requiredCredential") ?? ""}
          onChange={(e) => set("requiredCredential", e.target.value)}
        >
          {CREDENTIALS.map(([v, l]) => (
            <option key={v} value={v}>
              {translate(l)}
            </option>
          ))}
        </Select>
        <Select
          aria-label={translate("Sorteren")}
          value={params.get("sort") ?? (canSortByMatch ? "match" : "recent")}
          onChange={(e) => set("sort", e.target.value)}
        >
          {canSortByMatch && <option value="match">{translate("Beste match eerst")}</option>}
          <option value="recent">{translate("Nieuwste eerst")}</option>
          <option value="start_soon">{translate("Startdatum (eerst)")}</option>
          <option value="rate_desc">{translate("Tarief hoog → laag")}</option>
          <option value="rate_asc">{translate("Tarief laag → hoog")}</option>
        </Select>
      </div>

      {skills.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          <div className="flex flex-wrap gap-2">
            {primarySkills.map((s) => (
              <SkillChip
                key={s.value}
                id={s.value}
                name={s.label}
                selected={selectedSkills.has(s.value)}
                onToggle={toggleSkill}
              />
            ))}
          </div>
          {moreSkills.length > 0 && (
            <>
              {showAllSkills && (
                <div className="flex flex-wrap gap-2">
                  {moreSkills.map((s) => (
                    <SkillChip
                      key={s.value}
                      id={s.value}
                      name={s.label}
                      selected={selectedSkills.has(s.value)}
                      onToggle={toggleSkill}
                    />
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowAllSkills((v) => !v)}
                aria-expanded={showAllSkills}
                className="focus-ring rounded-md text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
              >
                {showAllSkills
                  ? translate("Minder vaardigheden")
                  : `${translate("Meer vaardigheden")} (${moreSkills.length})`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
