import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "danger";
type Size = "xs" | "sm" | "md";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-sm",
  secondary: "border border-border bg-card text-foreground hover:bg-muted hover:shadow-sm",
  ghost: "text-foreground hover:bg-muted",
  // Discrete destructieve actie: rustig tot de intentie blijkt (hover). De solide `danger`
  // is gereserveerd voor expliciet bevestigde flows (bv. in een bevestigingsdialoog).
  destructive:
    "border border-border bg-card text-danger hover:border-danger hover:bg-danger hover:text-white",
  danger: "bg-danger text-white hover:bg-danger/90 hover:shadow-sm",
};

const sizes: Record<Size, string> = {
  xs: "h-7 gap-1.5 px-2 text-xs",
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "focus-ring inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
