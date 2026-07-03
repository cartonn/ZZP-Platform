"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useT } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";

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
}: {
  industries: { id: string; name: string }[];
  skills: { id: string; name: string }[];
  /** Aantal profielbranches van de ZZP'er; >0 toont de "Mijn vakgebied"-quickfilter. */
  myIndustryCount?: number;
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

  const mineActive = params.get("mine") === "1";
  const toggleMine = () =>
    push((p) => {
      if (mineActive) {
        p.delete("mine");
      } else {
        p.set("mine", "1");
        p.delete("industryId"); // "Mijn vakgebied" overkoepelt de expliciete branchekeuze
      }
    });

  const selectedSkills = new Set(params.getAll("skillIds"));
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
      {myIndustryCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
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
          value={mineActive ? "" : (params.get("industryId") ?? "")}
          disabled={mineActive}
          onChange={(e) => set("industryId", e.target.value)}
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
          value={params.get("sort") ?? "recent"}
          onChange={(e) => set("sort", e.target.value)}
        >
          <option value="recent">{translate("Nieuwste eerst")}</option>
          <option value="rate_desc">{translate("Tarief hoog → laag")}</option>
          <option value="rate_asc">{translate("Tarief laag → hoog")}</option>
        </Select>
      </div>

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          {skills.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleSkill(s.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                selectedSkills.has(s.id)
                  ? "border-primary bg-accent"
                  : "border-border hover:bg-muted",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
