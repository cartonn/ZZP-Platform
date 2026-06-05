import { cloneElement, isValidElement, type ReactElement } from "react";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  // Koppel hint/fout aria-technisch aan het input-child: screenreaders horen zo de
  // instructie/fout, en een ongeldig veld wordt als zodanig aangekondigd (WCAG 1.3.1/3.3.1/4.1.3).
  const hintId = htmlFor && hint && !error ? `${htmlFor}-hint` : undefined;
  const errorId = htmlFor && error ? `${htmlFor}-error` : undefined;

  let control = children;
  if (isValidElement(children) && (hintId || errorId)) {
    const child = children as ReactElement<{ "aria-describedby"?: string }>;
    const describedBy =
      [hintId, errorId, child.props["aria-describedby"]].filter(Boolean).join(" ") || undefined;
    control = cloneElement(child, {
      "aria-invalid": error ? true : undefined,
      "aria-describedby": describedBy,
    } as Partial<typeof child.props>);
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {control}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
