// Gedeeld resultaattype voor de Actiecentrum-beoordeel-acties. De onderliggende mutaties zijn
// void server-acties (progressive-enhancement forms); de drawer heeft een useActionState-vriendelijke
// variant nodig die succes/fout teruggeeft, zodat hij kan sluiten + doorvloeien (auto-advance) en
// een fout inline kan tonen i.p.v. de error-boundary te triggeren.
export type ResolveState = { ok: true } | { error: string } | undefined;
