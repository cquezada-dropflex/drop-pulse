import { body, mutate } from "@/lib/onboarding/http";
import { createAccount } from "@/lib/onboarding/service";

/** O1 · Crear cuenta (maqueta: sin Supabase configurado, la cuenta vive en el estado del onboarding). */
export async function POST(req: Request) {
  const { email } = await body<{ email: string }>(req);
  return mutate((s, now) => createAccount(s, String(email ?? ""), now));
}
