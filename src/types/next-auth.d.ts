import { type DefaultSession } from "next-auth";
import { type UserRole } from "@/lib/enums";

declare module "next-auth" {
  interface User {
    role: UserRole;
    status: string;
    mustChangePassword?: boolean;
    /** Wachtwoord-generatie-stempel (epoch-millis) op inlogmoment; zie AuthorizedUser. */
    passwordChangedAt?: number;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      status: string;
      mustChangePassword: boolean;
      /** Bevroren wachtwoord-generatie-stempel (epoch-millis) uit de JWT; `currentActor()` toetst dit live. */
      passwordChangedAt?: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    status: string;
    mustChangePassword: boolean;
    /** Bevroren op inlogmoment (niet ververst bij updateAge-rotatie); zie auth.config.ts. */
    passwordChangedAt?: number;
  }
}
