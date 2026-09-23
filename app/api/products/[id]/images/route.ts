import { NextResponse } from "next/server";
import { confirmUpload } from "@/lib/products/images";
import { errorResponse, json, ownedProduct, ProductApiError } from "@/lib/products/http";

/**
 * “Desde tu equipo”, paso 2: el navegador ya subió el archivo a Storage con la URL firmada
 * (POST …/images/upload-url). Aquí se valida el tipo real y se registra como referencia.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await ownedProduct(id);
    const { path, name } = await json<{ path: string; name: string }>(req);
    if (typeof path !== "string" || !path) throw new ProductApiError("Falta la imagen subida.", 400, "path");
    return NextResponse.json({ image: await confirmUpload(userId, id, path, typeof name === "string" ? name : "Imagen subida") }, { status: 201 });
  } catch (e) {
    return errorResponse(e, "No pudimos guardar la imagen. Intenta de nuevo.");
  }
}
