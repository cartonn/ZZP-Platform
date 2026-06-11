import { cn } from "@/lib/utils";

/**
 * Canonieke tabel-primitives (DESIGN.md): één stijl voor alle datatabellen i.p.v.
 * handgerolde varianten per pagina. Koppen als overline (klein, uppercase, gedempt),
 * hairline-scheidingen, cijferkolommen rechts uitgelijnd met `font-mono` via `numeric`.
 */
export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full text-sm", className)} {...props} />;
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={className} {...props} />;
}

export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-border", className)} {...props} />;
}

export function TR({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={className} {...props} />;
}

export function TH({
  className,
  numeric,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <th
      className={cn(
        "border-b border-border px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground first:pl-0 last:pr-0",
        numeric && "text-right",
        className,
      )}
      {...props}
    />
  );
}

export function TD({
  className,
  numeric,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <td
      className={cn(
        "px-3 py-2 first:pl-0 last:pr-0",
        numeric && "text-right font-mono text-[13px] tabular-nums",
        className,
      )}
      {...props}
    />
  );
}
