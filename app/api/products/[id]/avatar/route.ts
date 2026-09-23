import { NextResponse } from "next/server";
import { customerAvatarSchema } from "@/lib/ai/schemas";
import { adminClient } from "@/lib/integrations/admin";
import { errorResponse, json, ownedProduct, ProductApiError } from "@/lib/products/http";
import { latestAvatars, toProposal } from "@/lib/products/store";

// El comerciante decide sobre la propuesta de cliente ideal vigente (la IA propone, tú decides):
// PATCH  { action: "approve" }            → aprobado
// PATCH  { action: "reopen" }             → vuelve a revisión (el “Deshacer” del toast)
// PUT    { avatar, approve?: boolean }    → guarda lo editado (y, si approve, lo aprueba)

async function current(userId: string, productId: string) {
  const row = (await latestAvatars(userId, [productId])).get(productId);
  if (!row) throw new ProductApiError("Todavía no hay un cliente ideal para este producto. Optimiza con IA primero.", 409);
  return row;
}

async function save(userId: string, avatarId: string, patch: Record<string, unknown>) {
  const { data, error } = await adminClient()
    .from("customer_avatars")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", avatarId)
    .select("id, product_id, status, payload, edited_at, created_at")
    .single();
  if (error) throw new Error(`Guardar el cliente ideal: ${error.message}`);
  return toProposal(data as Parameters<typeof toProposal>[0]);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await ownedProduct(id);
    const { action } = await json<{ action: "approve" | "reopen" }>(req);
    const row = await current(userId, id);
    if (action === "approve") return NextResponse.json({ avatar: await save(userId, row.id, { status: "approved", decided_at: new Date().toISOString() }) });
    if (action === "reopen") return NextResponse.json({ avatar: await save(userId, row.id, { status: "in_review", decided_at: null }) });
    throw new ProductApiError("Acción desconocida.", 400, "action");
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await ownedProduct(id);
    const body = await json<{ avatar: unknown; approve: boolean }>(req);
    const parsed = customerAvatarSchema.safeParse(body.avatar);
    if (!parsed.success) throw new ProductApiError("Hay campos vacíos o con un formato inesperado. Revisa y vuelve a guardar.", 400, "avatar");
    const row = await current(userId, id);
    const now = new Date().toISOString();
    return NextResponse.json({
      avatar: await save(userId, row.id, {
        payload: parsed.data,
        edited_at: now,
        ...(body.approve ? { status: "approved", decided_at: now } : { status: "in_review" }),
      }),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
