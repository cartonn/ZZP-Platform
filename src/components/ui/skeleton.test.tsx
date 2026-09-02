import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import {
  Skeleton,
  PageHeaderSkeleton,
  ListSkeleton,
  DenseListSkeleton,
  FormSkeleton,
} from "./skeleton";

// Laad-skeletten tonen de paginavorm vóór de data er is. Contract: decoratief (aria-hidden),
// de wrapper meldt "bezig" aan screenreaders, en de puls staat uit bij prefers-reduced-motion.
const count = (html: string, needle: RegExp) => (html.match(needle) ?? []).length;

describe("Skeleton", () => {
  it("is decoratief en verborgen voor screenreaders", () => {
    const html = renderToStaticMarkup(<Skeleton />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("aria-label");
  });

  it("pulseert, maar niet bij prefers-reduced-motion", () => {
    const html = renderToStaticMarkup(<Skeleton />);
    expect(html).toContain("animate-pulse");
    expect(html).toContain("motion-reduce:animate-none");
  });

  it("neemt de meegegeven afmetingen over", () => {
    expect(renderToStaticMarkup(<Skeleton className="h-4 w-1/3" />)).toContain("h-4 w-1/3");
  });
});

describe("PageHeaderSkeleton", () => {
  it("matcht de kopvorm: een titelbalk met een subtitelbalk", () => {
    const html = renderToStaticMarkup(<PageHeaderSkeleton />);
    expect(count(html, /animate-pulse/g)).toBe(2);
    expect(html).toContain("h-6");
    expect(html).toContain("h-3");
  });
});

describe("ListSkeleton", () => {
  it("meldt zich als bezig, met een Nederlandse naam", () => {
    const html = renderToStaticMarkup(<ListSkeleton />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-label="Laden"');
  });

  it("toont standaard vijf rijen", () => {
    expect(count(renderToStaticMarkup(<ListSkeleton />), /border-border/g)).toBe(5);
  });

  it("volgt het gevraagde aantal rijen", () => {
    expect(count(renderToStaticMarkup(<ListSkeleton rows={2} />), /border-border/g)).toBe(2);
    expect(renderToStaticMarkup(<ListSkeleton rows={0} />)).not.toContain("animate-pulse");
  });
});

describe("DenseListSkeleton", () => {
  it("gebruikt één container met dividers in plaats van losse kaarten", () => {
    const html = renderToStaticMarkup(<DenseListSkeleton rows={3} />);
    expect(html).toContain("divide-y");
    expect(count(html, /border-border/g)).toBe(1);
    expect(count(html, /justify-between/g)).toBe(3);
  });

  it("meldt zich als bezig", () => {
    const html = renderToStaticMarkup(<DenseListSkeleton />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-label="Laden"');
  });
});

describe("FormSkeleton", () => {
  it("toont standaard vier label/veld-paren plus een knopbalk", () => {
    const html = renderToStaticMarkup(<FormSkeleton />);
    // 4 × (label + veld) + 1 knop.
    expect(count(html, /animate-pulse/g)).toBe(9);
    expect(html).toContain('aria-busy="true"');
  });

  it("volgt het gevraagde aantal velden", () => {
    expect(count(renderToStaticMarkup(<FormSkeleton fields={2} />), /animate-pulse/g)).toBe(5);
  });
});
