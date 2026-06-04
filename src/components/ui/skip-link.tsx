"use client";

// Skip-to-content-link (WCAG 2.4.1): het eerste focusbare element; springt naar de hoofdinhoud.
// Visueel verborgen tot focus. We verzetten de focus EXPLICIET naar #hoofdinhoud, want browsers
// doen dat niet betrouwbaar bij fragment-navigatie naar een tabindex=-1-doel — zo werkt de skip
// voor élke toetsenbordgebruiker (niet alleen scrollen, maar echt de navigatie overslaan).
export function SkipLink() {
  return (
    <a
      href="#hoofdinhoud"
      onClick={(e) => {
        const main = document.getElementById("hoofdinhoud");
        if (main) {
          e.preventDefault();
          main.focus();
          main.scrollIntoView();
        }
      }}
      className="focus-ring sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:border focus:border-border focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-sm"
    >
      Naar inhoud
    </a>
  );
}
