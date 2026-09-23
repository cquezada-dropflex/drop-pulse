import { mutate } from "@/lib/onboarding/http";
import { skipMeta } from "@/lib/onboarding/service";
import { deleteMetaConnection } from "@/lib/integrations/meta/connection";

/** “Conectar después”: termina el onboarding; Meta queda pendiente en SetupChecklist. */
export async function POST() {
  return mutate(async (s, now, { meta }) => {
    const next = skipMeta(s, now);
    // Una autorización a medias o con error no debe seguir mostrando “error”: queda pendiente.
    if (meta && meta.status !== "connected") await deleteMetaConnection(s.userId);
    return next;
  });
}
