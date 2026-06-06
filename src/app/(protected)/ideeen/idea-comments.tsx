"use client";

import { useRef, useState, useTransition } from "react";
import { MessageSquare } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatDateShortNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";
import { addComment } from "./actions";

export interface IdeaCommentView {
  id: string;
  authorName: string;
  body: string;
  createdAt: Date;
}

/**
 * Reacties op een idee: een inklapbare draad (nieuwste onderaan) met een inline reactieformulier.
 * De server is leidend; na het plaatsen leegt het veld en hervalideert de pagina de telling.
 */
export function IdeaComments({
  ideaId,
  comments,
}: {
  ideaId: string;
  comments: IdeaCommentView[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="mt-3 border-t border-border pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="focus-ring inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <MessageSquare className="size-3.5" aria-hidden />
        {comments.length === 0 ? "Reageren" : plural(comments.length, "reactie", "reacties")}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {comments.length > 0 && (
            <ul className="space-y-2">
              {comments.map((c) => (
                <li key={c.id} className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="whitespace-pre-line text-sm">{c.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.authorName} · {formatDateShortNl(c.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <form
            ref={formRef}
            action={(fd) =>
              startTransition(async () => {
                await addComment(ideaId, fd);
                formRef.current?.reset();
              })
            }
            className="space-y-2"
          >
            <Textarea
              name="body"
              rows={2}
              required
              aria-label="Schrijf een reactie"
              placeholder="Schrijf een reactie…"
              className="text-sm"
            />
            <Button type="submit" size="xs" variant="secondary" disabled={pending}>
              {pending ? "Plaatsen…" : "Reactie plaatsen"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
