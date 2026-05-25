import { redirect } from "next/navigation";

// Dashboard-first (CLAUDE.md): geen marketinghomepage. De middleware stuurt
// niet-ingelogde bezoekers door naar /login.
export default function HomePage() {
  redirect("/dashboard");
}
