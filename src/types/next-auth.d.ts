import { type DefaultSession } from "next-auth";
import { type UserRole } from "@/lib/enums";

declare module "next-auth" {
  interface User {
    role: UserRole;
    status: string;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      status: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    status: string;
  }
}
