# V5 public landing page

The owner asked to use the existing Handslag V5 design as the public homepage. This change replaces `/` with the native React version: the original hands start as one logo, move apart around “Een goede opdracht begint bij handslag.” and frame the finished phrase. Audience switching, readable responsive document stacks, FAQ keyboard interaction, depth, hover and reduced-motion behavior are retained.

Open Sans and the landing styles are scoped to this page. The authenticated platform keeps its existing layout and design; those changes remain in PR1474. Login, registration and legal links use the current application origin. The original Age Cymru / Unsplash photo is selected by its specific publisher photo ID and exact rendition query. Its source, license, comparison with the V5 export and SHA-256 digest are recorded in `src/components/landing/ASSETS.md`. Next Image serves the optimized result from the application origin; the preview service is no longer a dependency. The font and license provenance are documented alongside the local font.

Five browser regressions cover registration/auth protection, all audiences and mobile overflow, keyboard FAQ behavior, final hand placement after resize, initial logo-only paint with delayed scripts, and readable text without JavaScript. All six current GitHub gates must pass before merge.

The first independent review (run 34596986238, head c41fa861) returned BLOCK: mutable preview photo dependency, an unrestricted image query and JavaScript-only FAQ answers. The photo now uses the documented upstream object and exact query. FAQ answers are server-rendered inside native details/summary elements, preserving the V5 appearance and keyboard behavior without scripts. The no-JavaScript regression now opens the payment answer and checks its payment-guarantee text. Fresh review and all six gates remain required.

## Subscription review follow-up

The native GitHub Codex review of `7b81dd1251477483d6f388c45b957df8df3e1ac5`
(review `5178770673`) identified script-dependent audience selection, hardcoded
landing colors and the fixed footer year. A separate local GPT-5.5 review identified
the same audience fallback and an initially invisible keyboard target.

Audience pills and the three introductory cards now use real query-parameter links.
The page derives the selected audience server-side, so refresh, sharing, browser
history and navigation without JavaScript preserve the correct content. The return
control starts outside the tab order until the scroll handler makes it visible.
The footer receives the current year from the server.

`handslag-palette.css` maps the approved light colors to scoped semantic HSL tokens.
The same tokens provide dark surfaces and readable text for the existing theme
preference. Blue action backgrounds keep contrasting light text; orange logo marks
retain their identity in both themes. The scope includes the landing viewport gutter
and disappears when navigating into the application. No protected application palette
or business logic is changed by this landing PR.

Six local browser journeys passed against both development and production builds, including all
three no-script audience URLs through native keyboard activation and reload, saved
dark mode, browser back, mobile overflow and the existing hero animation. Mobile
390×844 screenshots were inspected in both themes. Full lint, typecheck, 8,657 tests
(two existing skips), build and formatting passed. A further independent local review
identified selector-list invalidation in browsers without `:has()`: the ordinary
palette rules are now separate from the optional gutter enhancement. The final
integrated build and a fresh independently published review remain required before merge.
