import { NextResponse } from "next/server";
import { addImageFromUrl } from "@/lib/products/images";
import { errorResponse, json, ownedProduct, ProductApiError } from "@/lib/products/http";

/** “Desde un enlace”: el servidor descarga la imagen, valida tipo y tamaño, y la guarda. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await ownedProduct(id);
    const { url } = await json<{ url: string }>(req);
    if (typeof url !== "string" || !url.trim()) throw new ProductApiError("Pega el enlace de la imagen.", 400, "url");
    return NextResponse.json({ image: await addImageFromUrl(userId, id, url) }, { status: 201 });
  } catch (e) {
    return errorResponse(e, "No pudimos traer la imagen. Intenta de nuevo o súbela desde tu equipo.");
  }
}
