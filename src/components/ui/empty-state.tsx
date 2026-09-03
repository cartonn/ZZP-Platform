import { type ReactNode } from "react";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Gedeelde lege staat: één rustige, consistente vorm voor "er is hier nog niets".
// Icoon in een zachte cirkel, titel, korte uitleg en een optionele volgende actie.
// Rendert binnen of buiten een Card (geen eigen rand), zodat pagina's hun bestaande
// Card-omhulsel kunnen houden. Geen dode knoppen: een actie verwijst altijd ergens heen.
export interface EmptyStateAction {
  label: string;
  href: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
  as: Title = "h2",
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  /** Extra actie-slot onder de uitleg, bv. een client-side knop (filters wissen). */
  children?: ReactNode;
  className?: string;
  /**
   * Kopniveau van de titel. De lege staat is een echte sectie op de pagina, dus de titel hoort
   * als kop in de toegankelijkheidsboom te staan — anders navigeert een schermlezer een lege of
   * niet-gevonden pagina zonder enig oriëntatiepunt. Pagina's hebben altijd een h1, dus `h2` is
   * de juiste standaard; staat de lege staat binnen een sectie die zélf al een h2-kop heeft,
   * geef dan `as="h3"` mee zodat de kopvolgorde niet springt.
   */
  as?: "h2" | "h3" | "h4";
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-5" aria-hidden />
        </div>
      ) : null}
      <div className="space-y-1">
        <Title className="text-sm font-semibold tracking-tight text-foreground">{title}</Title>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Button asChild size="sm" variant="primary" className="mt-1">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
      {children ? <div className="mt-1">{children}</div> : null}
    </div>
  );
}
