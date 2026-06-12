import { RatingStars } from "@/components/reviews/rating-stars";

export interface ReviewItem {
  id: string;
  authorName: string;
  rating: number;
  comment: string | null;
  createdAt: Date | string;
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
