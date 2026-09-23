import { NextResponse, after } from "next/server";
import { errorResponse, ownedProduct } from "@/lib/products/http";
import { expireStaleRuns, latestAvatars, latestRuns, toProposal, toRun } from "@/lib/products/store";
import { runOptimization, startOptimization } from "@/lib/pipeline/optimize";

// La corrida sigue después de responder (after): dos llamadas a Claude, ~1 a 2 minutos.
export const maxDuration = 300;

/** “Optimizar con IA”: crea la corrida y la ejecuta en segundo plano. Devuelve su estado. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await ownedProduct(id);
    const { run, created } = await startOptimization(userId, id);
    if (created) after(() => runOptimization(run.id));
    return NextResponse.json({ run: toRun(run) }, { status: created ? 202 : 200 });
  } catch (e) {
    return errorResponse(e, "No pudimos empezar la optimización. Intenta de nuevo en un momento.");
  }
}

/** Sondeo de la pantalla: la última corrida y la propuesta de cliente ideal vigente. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await ownedProduct(id);
    await expireStaleRuns(userId);
    const [runs, avatars] = await Promise.all([latestRuns(userId, [id]), latestAvatars(userId, [id])]);
    const run = runs.get(id);
    const avatar = avatars.get(id);
    return NextResponse.json({ run: run ? toRun(run) : null, avatar: avatar ? toProposal(avatar) : null });
  } catch (e) {
    return errorResponse(e);
  }
}
