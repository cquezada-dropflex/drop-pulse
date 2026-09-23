import "server-only";
import { redirect } from "next/navigation";
import { readOnboarding } from "./store";
import { STEP_PATH, canVisit, pendingStep, snapshot } from "./service";
import type { OnboardingState, StepKey } from "./types";

/** Lee el estado y, si todavía no corresponde este paso, lleva al pendiente. */
export async function guardStep(step: StepKey): Promise<{ state: OnboardingState; now: number }> {
  const state = await readOnboarding();
  if (!canVisit(state, step)) redirect(STEP_PATH[pendingStep(state)]);
  return { state, now: Date.now() };
}

export { snapshot };
