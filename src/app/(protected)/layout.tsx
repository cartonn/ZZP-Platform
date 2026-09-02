import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { prisma } from "@/lib/db";
import { activationGatePath } from "@/lib/franchise/activation";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  // Bemiddeling die nog op activatie wacht (of is afgewezen): stuur naar de wachtpagina i.p.v. een
  // doodlopende 403 — currentActor() geeft voor een niet-actieve tenant al `null`, dus élke pagina
  // en server action hierachter weigert toch fail-closed (zie tenantAccessBlocked in authz.ts).
  // Live uit de database, niet uit de sessie, zodat een activatie meteen doorwerkt.
  if (session.user.id) {
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tenant: { select: { status: true } } },
    });
    const gate = activationGatePath(me?.tenant?.status);
    if (gate) redirect(gate);
  }
  return <AppShell user={session.user}>{children}</AppShell>;
}
