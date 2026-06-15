import { RatingStars } from "@/components/reviews/rating-stars";

export interface ReviewItem {
  id: string;
  authorName: string;
  rating: number;
  comment: string | null;
  createdAt: Date | string;
  /** Nog niet onthuld (double-blind): alleen zichtbaar in de admin-moderatieweergave. */
  pending?: boolean;
}

export function ReviewList({ reviews }: { reviews: ReviewItem[] }): React.JSX.Element {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">Nog geen beoordelingen.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {reviews.map((review) => {
        const dateLabel = new Date(review.createdAt).toLocaleDateString("nl-NL", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        return (
          <li key={review.id} className="space-y-1 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{review.authorName}</span>
                <RatingStars average={review.rating} size="sm" />
                {review.pending && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    Nog niet zichtbaar
                  </span>
                )}
              </div>
              <time
                dateTime={new Date(review.createdAt).toISOString()}
                className="shrink-0 text-xs text-muted-foreground"
              >
                {dateLabel}
              </time>
            </div>
            {review.comment !== null && (
              <p className="text-sm text-muted-foreground">{review.comment}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
