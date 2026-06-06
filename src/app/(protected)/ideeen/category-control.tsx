"use client";

import { IDEA_AUDIENCES, IDEA_THEMES, type IdeaAudience, type IdeaTheme } from "@/lib/enums";
import { IDEA_AUDIENCE_LABEL, IDEA_THEME_LABEL } from "@/lib/ideas";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { setIdeaCategory } from "./actions";

/** Beheerder corrigeert de doelgroep + het thema van een idee. */
export function CategoryControl({
  ideaId,
  audience,
  theme,
  title,
}: {
  ideaId: string;
  audience: IdeaAudience;
  theme: IdeaTheme | null;
  title: string;
}) {
  return (
    <form
      action={setIdeaCategory.bind(null, ideaId)}
      className="mt-2 flex flex-wrap items-center gap-2"
    >
      <span className="text-xs text-muted-foreground">Categorie:</span>
      <Select
        name="audience"
        defaultValue={audience}
        aria-label={`Doelgroep van idee: ${title}`}
        className="h-8 max-w-40 text-sm"
      >
        {IDEA_AUDIENCES.map((a) => (
          <option key={a} value={a}>
            {IDEA_AUDIENCE_LABEL[a]}
          </option>
        ))}
      </Select>
      <Select
        name="theme"
        defaultValue={theme ?? ""}
        aria-label={`Thema van idee: ${title}`}
        className="h-8 max-w-40 text-sm"
      >
        <option value="">Geen thema</option>
        {IDEA_THEMES.map((t) => (
          <option key={t} value={t}>
            {IDEA_THEME_LABEL[t]}
          </option>
        ))}
      </Select>
      <Button type="submit" size="xs" variant="secondary">
        Opslaan
      </Button>
    </form>
  );
}
