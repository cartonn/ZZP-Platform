# V5 public landing page

The owner asked to use the existing Handslag V5 design as the public homepage. This change replaces `/` with the native React version: the original hands start as one logo, move apart around “Een goede opdracht begint bij handslag.” and frame the finished phrase. Audience switching, readable responsive document stacks, FAQ keyboard interaction, depth, hover and reduced-motion behavior are retained.

Open Sans and the landing styles are scoped to this page. The authenticated platform keeps its existing layout and design; those changes remain in PR1474. Login, registration and legal links use the current application origin. The unchanged Age Cymru / Unsplash photo is served from the owner's existing Handslag V5 Railway service and optimized through an exact Next Image remote-path allowlist. That service must remain available for uncached images. The font and license provenance are documented alongside the local font.

Five browser regressions cover registration/auth protection, all audiences and mobile overflow, keyboard FAQ behavior, final hand placement after resize, initial logo-only paint with delayed scripts, and readable text without JavaScript. All six current GitHub gates must pass before merge.
