"use client";

import { useActionState, useState } from "react";
import { updateFranchiseBranding, type BrandingState } from "./actions";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";

export function BrandingForm({
  initialName,
  initialColor,
}: {
  initialName: string;
  initialColor: string | null;
}) {
  const [state, action, pending] = useActionState<BrandingState, FormData>(
    updateFranchiseBranding,
    undefined,
  );
  const fe = state?.fieldErrors ?? {};
  const [color, setColor] = useState(initialColor ?? "");
  const valid = /^#[0-9a-fA-F]{6}$/.test(color);

  return (
    <form action={action} className="space-y-4">
      <Field label="Franchise-naam" htmlFor="name" required error={fe.name}>
        <Input id="name" name="name" defaultValue={initialName} required />
      </Field>
      <Field
        label="Accentkleur"
        htmlFor="brandColor"
        hint="Hex-kleur (bv. #2563eb), getoond in de werkplek-header van je hele franchise. Leeg = standaard."
        error={fe.brandColor}
      >
        <div className="flex items-center gap-2">
          <Input
            id="brandColor"
            name="brandColor"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#2563eb"
            className="max-w-40"
          />
          <span
            aria-hidden
            className="size-9 shrink-0 rounded-md border border-border"
            style={{ backgroundColor: valid ? color : "transparent" }}
          />
        </div>
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Opslaan…" : "Opslaan"}
        </Button>
        <FormStatus success={state?.ok ? "Opgeslagen." : undefined} error={state?.error} />
      </div>
    </form>
  );
}
