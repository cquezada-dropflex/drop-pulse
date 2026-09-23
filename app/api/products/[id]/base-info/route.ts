import { NextResponse } from "next/server";
import { errorResponse, json, ownedProduct, ProductApiError } from "@/lib/products/http";
import { updateBaseInfo } from "@/lib/products/store";
import { detectTopics } from "@/lib/products/topics";

/** Tope del campo: holgado (pegar la ficha completa de un proveedor), pero no ilimitado. */
const MAX_CHARS = 20_000;

/** Autoguardado de Información base (ProductInfoInput): guarda el texto y devuelve los temas que cubre. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await ownedProduct(id);
    const { text } = await json<{ text: string }>(req);
    if (typeof text !== "string") throw new ProductApiError("Falta el texto.", 400, "text");
    if (text.length > MAX_CHARS) throw new ProductApiError(`El texto es muy largo: deja lo más útil (hasta ${MAX_CHARS.toLocaleString("es-CL")} caracteres).`, 400, "text");
    const savedAt = await updateBaseInfo(userId, id, text);
    return NextResponse.json({ savedAt, topics: detectTopics(text) });
  } catch (e) {
    return errorResponse(e);
  }
}

/** navigator.sendBeacon (al cerrar la pestaña con cambios sin guardar) solo sabe hacer POST. */
export const POST = PATCH;
