import { forwardRef, useId } from "react";
import { Input } from "@/components/ui/input";

/**
 * Native `<input type="date">` toont zijn formaat volgens de browser-locale, niet de
 * pagina-locale. Bij een niet-NL browser verschijnt mm/dd/jjjj, wat Nederlandse
 * gebruikers laat raden. Deze wrapper zet `lang="nl"` op de input (helpt in sommige
 * browsers, schaadt nooit) en toont altijd een zichtbare formaat-hint "dd-mm-jjjj",
 * zodat het verwachte formaat nooit onduidelijk is. Geen extra dependency.
 *
 * De hint wordt aria-technisch aan de input gekoppeld en samengevoegd met een
 * eventueel doorgegeven `aria-describedby` (bv. vanuit `Field`), zodat screenreaders
 * zowel de formaat-hint als een veldfout blijven horen.
 */
export const DateInput = forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">
>(({ className, "aria-describedby": describedBy, ...props }, ref) => {
  const hintId = useId();
  const mergedDescribedBy = [describedBy, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1">
      <Input
        ref={ref}
        type="date"
        lang="nl"
        aria-describedby={mergedDescribedBy}
        className={className}
        {...props}
      />
      <p id={hintId} className="text-xs text-muted-foreground">
        Formaat: dd-mm-jjjj
      </p>
    </div>
  );
});
DateInput.displayName = "DateInput";
