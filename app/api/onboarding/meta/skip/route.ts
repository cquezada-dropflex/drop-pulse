import { mutate } from "@/lib/onboarding/http";
import { skipMeta } from "@/lib/onboarding/service";

/** “Conectar después”: termina el onboarding; Meta queda pendiente en SetupChecklist. */
export async function POST() {
  return mutate((s, now) => skipMeta(s, now));
}
