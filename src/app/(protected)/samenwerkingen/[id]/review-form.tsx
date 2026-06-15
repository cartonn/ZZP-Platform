"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type ResolveState } from "@/lib/actions/resolve-state";
import { RATING_MAX, REVIEW_COMMENT_MAX } from "@/lib/reviews";
import { createReviewAction } from "./review-actions";

export function ReviewForm({
  collaborationId,
  subjectLabel,
}: {
  collaborationId: string;
  subjectLabel: string;
}) {
  const action = createReviewAction.bind(null, collaborationId);
  const [state, formAction, isPending] = useActionState<ResolveState, FormData>(action, undefined);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  const stars = Array.from({ length: RATING_MAX }, (_, i) => i + 1);
  const shown = hover || rating;

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="rating" value={rating} />
      <div>
        <p className="mb-1.5 text-sm font-medium">Hoe was de samenwerking met {subjectLabel}?</p>
        <div
          className="flex items-center gap-1"
          role="radiogroup"
          aria-label="Aantal sterren"
          onMouseLeave={() => setHover(0)}
        >
          {stars.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} ${value === 1 ? "ster" : "sterren"}`}
              className="focus-ring rounded p-0.5"
              onMouseEnter={() => setHover(value)}
              onFocus={() => setHover(value)}
              onClick={() => setRating(value)}
            >
              <Star
                className={
                  value <= shown ? "size-6 fill-current text-foreground" : "size-6 text-muted-foreground" // prettier-ignore
                }
                aria-hidden
              />
            </button>
          ))}
        </div>
      </div>
      <textarea
        name="comment"
        rows={3}
        maxLength={REVIEW_COMMENT_MAX}
        placeholder="Toelichting (optioneel)"
        className="focus-ring w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
      />
      {state && "error" in state && state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" size="sm" disabled={isPending || rating === 0}>
        {isPending ? "Versturen…" : "Beoordeling plaatsen"}
      </Button>
    </form>
  );
}
