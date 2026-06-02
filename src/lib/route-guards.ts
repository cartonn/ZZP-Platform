// Pure route-matchers voor de middleware. Apart en getest omdat een naïeve
// `pathname.startsWith("/admin")` óók `/administratie` matcht (de boekhoudpagina van
// ZZP'er/opdrachtgever) — dat stuurde niet-admins ten onrechte naar /dashboard.

/** Hoort dit pad bij het admin-paneel? Matcht op de segmentgrens, niet op losse prefix. */
export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}
