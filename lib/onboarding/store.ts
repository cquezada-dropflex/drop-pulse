import "server-only";
import { cookies } from "next/headers";
import { EMPTY } from "./service";
import type { OnboardingState } from "./types";

// Persistencia de la maqueta: el estado del onboarding en una cookie httpOnly firmada por nadie.
// Sirve para retomar el paso pendiente entre visitas. En producción: una fila por comerciante en
// Supabase (ver docs/onboarding-backend.md) y los tokens de Shopify y Meta cifrados en el servidor.
const COOKIE = "df_onboarding";
const MAX_AGE = 60 * 60 * 24 * 30;

export async function readOnboarding(): Promise<OnboardingState> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as OnboardingState;
    return parsed?.version === 1 ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

/** Solo en Route Handlers y Server Actions (las páginas no pueden escribir cookies). */
export async function writeOnboarding(state: OnboardingState) {
  (await cookies()).set(COOKIE, Buffer.from(JSON.stringify(state)).toString("base64url"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearOnboarding() {
  (await cookies()).delete(COOKIE);
}
