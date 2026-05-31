"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
}: {
  industries: { id: string; name: string }[];
  skills: { id: string; name: string }[];
}) {
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          aria-label="Zoeken"
          placeholder="Zoek op titel of omschrijving…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sm:col-span-2 lg:col-span-2"
        />
        <Select
          aria-label="Branche"
          value={params.get("industryId") ?? ""}
          onChange={(e) => set("industryId", e.target.value)}
        >
          <option value="">Alle branches</option>
          {industries.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Werkmodus"
          value={params.get("workMode") ?? ""}
          onChange={(e) => set("workMode", e.target.value)}
        >
          <option value="">Alle werkmodi</option>
          <option value="REMOTE">Remote</option>
          <option value="ONSITE">Op locatie</option>
          <option value="HYBRID">Hybride</option>
        </Select>
        <Input
          type="number"
          min={0}
          aria-label="Minimumtarief"
          placeholder="Min. €/uur"
          defaultValue={params.get("rateMin") ?? ""}
          onBlur={(e) => set("rateMin", e.target.value)}
        />
        <Input
          type="number"
          min={0}
          aria-label="Maximumtarief"
          placeholder="Max. €/uur"
          defaultValue={params.get("rateMax") ?? ""}
          onBlur={(e) => set("rateMax", e.target.value)}
        />
        <Select
          aria-label="Vereist certificaat"
          value={params.get("requiredCredential") ?? ""}
          onChange={(e) => set("requiredCredential", e.target.value)}
        >
          {CREDENTIALS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Sorteren"
          value={params.get("sort") ?? "recent"}
          onChange={(e) => set("sort", e.target.value)}
        >
          <option value="recent">Nieuwste eerst</option>
          <option value="rate_desc">Tarief hoog → laag</option>
          <option value="rate_asc">Tarief laag → hoog</option>
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
