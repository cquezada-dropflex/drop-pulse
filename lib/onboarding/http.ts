import "server-only";
import { NextResponse } from "next/server";
import { readOnboardingForApi, writeOnboarding, type Loaded } from "./store";
import { snapshot } from "./service";
import { OnboardingError, type OnboardingState } from "./types";

/** Respuesta de error uniforme: { error, field } con el código HTTP del dominio. */
export function errorResponse(e: unknown) {
  if (e instanceof OnboardingError) return NextResponse.json({ error: e.message, field: e.field }, { status: e.status });
  console.error(e);
  return NextResponse.json({ error: "No pudimos guardar el paso. Intenta de nuevo en un momento." }, { status: 500 });
}

/** Lee el estado, aplica el cambio, lo guarda y responde con el snapshot actualizado. */
export async function mutate(change: (state: OnboardingState, now: number, loaded: Loaded) => OnboardingState | Promise<OnboardingState>, extra?: Record<string, unknown>) {
  try {
    const now = Date.now();
    const loaded = await readOnboardingForApi();
    const next = await change(loaded.state, now, loaded);
    await writeOnboarding(next);
    return NextResponse.json({ ...extra, snapshot: snapshot(next, now) });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function body<T>(req: Request): Promise<Partial<T>> {
  try {
    return (await req.json()) as Partial<T>;
  } catch {
    return {};
  }
}
