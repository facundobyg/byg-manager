"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { isRedirectError } from "next/dist/client/components/redirect-error"

export async function authenticate(prevState: any, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/posicion",
    });
  } catch (error) {
    // Redirect errors MUST be re-thrown — Next.js handles them for navigation
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) {
      return "Credenciales inválidas.";
    }
    return "Error de servidor. Intente nuevamente.";
  }
}
