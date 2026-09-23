import "server-only";
import { redirect } from "next/navigation";
import { readOnboarding, type Loaded } from "./store";
import { STEP_PATH, canVisit, pendingStep, snapshot } from "./service";
import type { StepKey } from "./types";

/** Lee el estado y, si todavía no corresponde este paso, lleva al pendiente. */
export async function guardStep(step: StepKey): Promise<Loaded & { now: number }> {
  const loaded = await readOnboarding();
  if (!canVisit(loaded.state, step)) redirect(STEP_PATH[pendingStep(loaded.state)]);
  return { ...loaded, now: Date.now() };
}

export { snapshot };
