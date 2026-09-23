import { NextResponse } from "next/server";
import { setImageExcluded } from "@/lib/products/images";
import { errorResponse, json, ownedProduct, ProductApiError } from "@/lib/products/http";

/** Usar o no una imagen como referencia. Excluir no borra nada en Shopify. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  try {
    const { id, imageId } = await params;
    const { userId } = await ownedProduct(id);
    const { excluded } = await json<{ excluded: boolean }>(req);
    if (typeof excluded !== "boolean") throw new ProductApiError("Falta indicar si se usa la imagen.", 400, "excluded");
    await setImageExcluded(userId, id, imageId, excluded);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
