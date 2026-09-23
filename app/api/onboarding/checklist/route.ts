import { body, mutate } from "@/lib/onboarding/http";

/** Oculta o vuelve a mostrar la tarjeta “Termina de configurar” de Hoy. */
export async function POST(req: Request) {
  const { hidden } = await body<{ hidden: boolean }>(req);
  return mutate((s) => ({ ...s, checklistHidden: Boolean(hidden) }));
}
