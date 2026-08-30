"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = { error?: string } | undefined;

export async function authenticate(_prev: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      // Optionele tweede factor (TOTP-code of herstelcode). Leeg voor accounts zonder 2FA.
      token: formData.get("token"),
      redirectTo: "/dashboard",
    });
    return undefined;
  } catch (error) {
    // signIn gooit bij succes een NEXT_REDIRECT die we MOETEN doorlaten.
    if (error instanceof AuthError) {
      return { error: "Onjuiste e-mail of wachtwoord." };
    }
    throw error;
  }
}
