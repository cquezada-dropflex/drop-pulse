import { readOnboarding } from "@/lib/onboarding/store";
import { snapshot } from "@/lib/onboarding/service";
import { SetupCard } from "./setup-card";

/** Hoy: solo aparece si al terminar el onboarding quedó algo pendiente y no se ocultó. */
export async function SetupSlot({ where }: { where: "hoy" | "ajustes" }) {
  const s = snapshot(await readOnboarding(), Date.now());
  if (!s.finished) return null;
  const pending = s.meta?.status !== "connected";
  if (!pending) return null;
  if (where === "hoy" && s.checklistHidden) return null;
  if (where === "ajustes" && !s.checklistHidden) return null;
  return <SetupCard where={where} />;
}
