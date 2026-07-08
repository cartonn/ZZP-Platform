"use client";

import { useActionState, useEffect, useRef } from "react";
import { Trash2, Plus, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormStatus } from "@/components/ui/form-status";
import {
  addWorkExperience,
  deleteWorkExperience,
  type WorkExperienceState,
} from "@/app/(protected)/profiel/actions";
import {
  formatWorkPeriod,
  sortWorkExperiences,
  WORK_EXPERIENCE_ROLE_MAX,
  WORK_EXPERIENCE_ORG_MAX,
  WORK_EXPERIENCE_DESC_MAX,
  WORK_EXPERIENCE_MIN_YEAR,
  WORK_EXPERIENCE_MAX_YEAR,
  WORK_EXPERIENCE_MAX_PER_PROFILE,
  type WorkExperienceLike,
} from "@/lib/work-experience";

function DeleteButton({ id }: { id: string }) {
  const [, formAction, isPending] = useActionState<WorkExperienceState, FormData>(
    deleteWorkExperience,
    undefined,
  );
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={isPending}
        aria-label="Ervaring verwijderen"
      >
        <Trash2 className="size-4" aria-hidden />
      </Button>
    </form>
  );
}

export function WorkExperienceEditor({ items }: { items: WorkExperienceLike[] }) {
  const [state, formAction, isPending] = useActionState<WorkExperienceState, FormData>(
    addWorkExperience,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);
  const fe = state?.fieldErrors ?? {};
  const sorted = sortWorkExperiences(items);
  const atCap = items.length >= WORK_EXPERIENCE_MAX_PER_PROFILE;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight">Werkervaring</h2>
        <p className="text-sm text-muted-foreground">
          Toon eerdere rollen en opdrachten naast je geverifieerde certificaten. Dit is je eigen
          opgave — opdrachtgevers zien dat het niet servergeverifieerd is.
        </p>
      </div>

      {sorted.length > 0 ? (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {sorted.map((it) => (
            <li key={it.id} className="flex items-start justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{it.role}</p>
                <p className="truncate text-sm text-muted-foreground">{it.organization}</p>
                <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                  {formatWorkPeriod(it.startYear, it.endYear)}
                </p>
                {it.description && (
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">
                    {it.description}
                  </p>
                )}
              </div>
              <DeleteButton id={it.id} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          <Briefcase className="size-4 shrink-0" aria-hidden />
          Nog geen werkervaring toegevoegd.
        </div>
      )}

      {atCap ? (
        <p className="text-xs text-muted-foreground">
          Je hebt het maximum van {WORK_EXPERIENCE_MAX_PER_PROFILE} ervaringen bereikt.
        </p>
      ) : (
        <form
          ref={formRef}
          action={formAction}
          className="space-y-4 rounded-lg border border-border p-4"
        >
          <p className="text-sm font-medium">Ervaring toevoegen</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Rol / functie" htmlFor="we-role" error={fe.role}>
              <Input
                id="we-role"
                name="role"
                maxLength={WORK_EXPERIENCE_ROLE_MAX}
                placeholder="Verpleegkundige IC"
              />
            </Field>
            <Field label="Organisatie" htmlFor="we-org" error={fe.organization}>
              <Input
                id="we-org"
                name="organization"
                maxLength={WORK_EXPERIENCE_ORG_MAX}
                placeholder="Ziekenhuis / opdrachtgever"
              />
            </Field>
            <Field label="Van (jaar)" htmlFor="we-start" error={fe.startYear}>
              <Input
                id="we-start"
                name="startYear"
                type="number"
                min={WORK_EXPERIENCE_MIN_YEAR}
                max={WORK_EXPERIENCE_MAX_YEAR}
                placeholder="2019"
              />
            </Field>
            <Field
              label="Tot (jaar)"
              htmlFor="we-end"
              error={fe.endYear}
              hint="Leeg laten als je hier nog werkt"
            >
              <Input
                id="we-end"
                name="endYear"
                type="number"
                min={WORK_EXPERIENCE_MIN_YEAR}
                max={WORK_EXPERIENCE_MAX_YEAR}
                placeholder="2022"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Toelichting (optioneel)" htmlFor="we-desc" error={fe.description}>
                <Textarea
                  id="we-desc"
                  name="description"
                  rows={2}
                  maxLength={WORK_EXPERIENCE_DESC_MAX}
                  placeholder="Wat deed je in deze rol?"
                />
              </Field>
            </div>
          </div>
          <FormStatus error={state?.error} />
          <Button type="submit" disabled={isPending}>
            <Plus className="size-4" aria-hidden />
            Ervaring toevoegen
          </Button>
        </form>
      )}
    </section>
  );
}
