// No-op stub voor het `server-only`-pakket in unit-tests. Vitest draait in Node (server-context),
// dus de client-import-guard van `server-only` is daar niet van toepassing; zonder deze stub gooit
// het pakket bij import. Gealiast via vitest.config.ts.
export {};
