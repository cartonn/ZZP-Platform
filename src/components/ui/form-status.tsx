import { cn } from "@/lib/utils";

/**
 * Eenduidige formulier-statusmelding. Succes via role=status (aria-live=polite) en fout via
 * role=alert, zodat screenreaders beide aankondigen — vervangt losse text-success-spans die
 * stil van waarde wisselden. `srOnly` verbergt de tekst visueel voor gevallen waar de UI zelf
 * al zichtbare feedback geeft (bv. een verzonden bericht dat in de thread verschijnt).
 */
export function FormStatus({
  success,
  error,
  srOnly,
  className,
}: {
  success?: string | false | null;
  error?: string | false | null;
  srOnly?: boolean;
  className?: string;
}) {
  if (error)
    return (
      <span role="alert" className={cn(srOnly ? "sr-only" : "text-sm text-danger", className)}>
        {error}
      </span>
    );
  if (success)
    return (
      <span role="status" className={cn(srOnly ? "sr-only" : "text-sm text-success", className)}>
        {success}
      </span>
    );
  return null;
}
