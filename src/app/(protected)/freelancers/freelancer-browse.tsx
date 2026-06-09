"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MapPin, Search, Calendar, Euro } from "lucide-react";
import {
  applyFreelancerFilters,
  type FreelancerCard,
  type FreelancerSearchFilters,
} from "@/lib/freelancer-search";
import type { TrustLevel } from "@/lib/trust";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const TRUST_LABEL: Record<TrustLevel, string> = {
  BASIS: "Basisprofiel",
  DEELS: "Deels geverifieerd",
  VOLLEDIG: "Volledig geverifieerd",
};

const TRUST_VARIANT: Record<TrustLevel, "muted" | "warning" | "success"> = {
  BASIS: "muted",
  DEELS: "warning",
  VOLLEDIG: "success",
};

const WORK_MODE_LABEL: Record<string, string> = {
  REMOTE: "Remote",
  ONSITE: "Op locatie",
  HYBRID: "Hybride",
};

export function FreelancerBrowse({ freelancers }: { freelancers: FreelancerCard[] }) {
  const [query, setQuery] = useState("");
  const [trustLevel, setTrustLevel] = useState<TrustLevel | "">("");
  const [availableOnly, setAvailableOnly] = useState(false);

  const filters: FreelancerSearchFilters = useMemo(
    () => ({ query, trustLevel, availableOnly }),
    [query, trustLevel, availableOnly],
  );

  const results = useMemo(
    () => applyFreelancerFilters(freelancers, filters),
    [freelancers, filters],
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Zoeken"
            placeholder="Zoek op naam, specialisme of vaardigheid…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          aria-label="Vertrouwensniveau"
          value={trustLevel}
          onChange={(e) => setTrustLevel(e.target.value as TrustLevel | "")}
          className="sm:w-56"
        >
          <option value="">Alle niveaus</option>
          <option value="VOLLEDIG">Volledig geverifieerd</option>
          <option value="DEELS">Deels geverifieerd</option>
          <option value="BASIS">Basisprofiel</option>
        </Select>
        <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Alleen beschikbaar
        </label>
      </div>

      {/* Teller */}
      <p className="text-sm text-muted-foreground">
        {results.length === freelancers.length
          ? `${freelancers.length} ${freelancers.length === 1 ? "ZZP'er" : "ZZP'ers"}`
          : `${results.length} van ${freelancers.length} ZZP'ers`}
      </p>

      {/* Resultatenlijst */}
      {results.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Geen ZZP'ers gevonden"
          description="Pas de filters aan om meer resultaten te zien."
        >
          {(query || trustLevel || availableOnly) && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setQuery("");
                setTrustLevel("");
                setAvailableOnly(false);
              }}
            >
              Filters wissen
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((f) => (
            <FreelancerCardItem key={f.id} card={f} />
          ))}
        </div>
      )}
    </div>
  );
}

function FreelancerCardItem({ card: f }: { card: FreelancerCard }) {
  const initials = f.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Card className="flex flex-col gap-3 p-4 transition-shadow hover:shadow-md">
      {/* Header: avatar + naam + badge */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{f.name}</p>
          {f.headline && <p className="truncate text-xs text-muted-foreground">{f.headline}</p>}
        </div>
        <Badge variant={TRUST_VARIANT[f.trustLevel]} className="shrink-0">
          {TRUST_LABEL[f.trustLevel]}
        </Badge>
      </div>

      {/* Meta */}
      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        {f.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            {f.location} · {WORK_MODE_LABEL[f.workMode] ?? f.workMode}
          </span>
        )}
        {f.hourlyRate != null && (
          <span className="flex items-center gap-1">
            <Euro className="h-3 w-3 shrink-0" />€ {f.hourlyRate} / uur
          </span>
        )}
        {f.availabilitySummary && (
          <span className="flex items-center gap-1 text-success">
            <Calendar className="h-3 w-3 shrink-0" />
            {f.availabilitySummary}
          </span>
        )}
      </div>

      {/* Skills */}
      {f.skillLabels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {f.skillLabels.slice(0, 4).map((s) => (
            <Badge key={s} variant="muted" className="text-xs">
              {s}
            </Badge>
          ))}
          {f.skillLabels.length > 4 && (
            <Badge variant="muted" className="text-xs">
              +{f.skillLabels.length - 4}
            </Badge>
          )}
        </div>
      )}

      {/* Acties */}
      <div className="mt-auto pt-1">
        <Button asChild variant="secondary" size="sm" className="w-full">
          <Link href={`/zzp/${f.id}`}>Bekijk profiel</Link>
        </Button>
      </div>
    </Card>
  );
}
