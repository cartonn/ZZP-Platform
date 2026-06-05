"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { type Theme, nextTheme, isTheme, applyTheme } from "@/lib/theme";

/** Light/dark-themaknop. Persisteert de keuze in localStorage; de no-flash-script in de
 *  root-layout zet het thema al vóór de eerste paint. Dark mode = gebruikerskeuze. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const initial: Theme = isTheme(stored)
      ? stored
      : document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";
    setTheme(initial);
  }, []);

  function toggle() {
    const next = nextTheme(theme);
    setTheme(next);
    applyTheme(next, document.documentElement);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* localStorage kan geblokkeerd zijn — niet kritiek. */
    }
  }

  const toDark = theme !== "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={toDark ? "Schakel naar donkere modus" : "Schakel naar lichte modus"}
      title={toDark ? "Donkere modus" : "Lichte modus"}
      className="inline-flex size-10 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {toDark ? <Moon className="size-4" aria-hidden /> : <Sun className="size-4" aria-hidden />}
    </button>
  );
}
