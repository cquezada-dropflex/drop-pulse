import { NextResponse } from "next/server";
import { prepareUpload } from "@/lib/products/images";
import { errorResponse, json, ownedProduct } from "@/lib/products/http";

/** “Desde tu equipo”, paso 1: valida tipo, tamaño y tope, y entrega una URL firmada de subida. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await ownedProduct(id);
    const { type, size } = await json<{ type: string; size: number }>(req);
    return NextResponse.json(await prepareUpload(userId, id, { type, size: Number(size) }));
  } catch (e) {
    return errorResponse(e, "No pudimos preparar la subida. Intenta de nuevo.");
  }
}
