import { describe, expect, it } from "vitest";
import { customerAvatarSystem, marketBlock, productBriefSystem, productBriefUser } from "./prompts";
import { customerAvatarSchema, productBriefSchema } from "./schemas";

const CL = { countryCode: "CL", currency: "CLP", language: "es" };

describe("prompts", () => {
  it("el mercado fija idioma neutro con tuteo, moneda, pago contra entrega y la ley local", () => {
    const m = marketBlock(CL);
    expect(m).toContain("español neutro con tuteo");
    expect(m).toContain("CLP");
    expect(m).toContain("pago contra entrega");
    expect(m).toContain("SERNAC");
  });

  it("Brasil escribe en portugués", () => {
    expect(marketBlock({ countryCode: "BR", currency: "BRL", language: "pt-BR" })).toContain("portugués de Brasil");
  });

  it("el system prompt es estable por mercado (se cachea)", () => {
    expect(productBriefSystem(CL)).toBe(productBriefSystem({ ...CL }));
    expect(customerAvatarSystem(CL)).toBe(customerAvatarSystem({ ...CL }));
  });

  it("el avatar recibe la plantilla de la fórmula (en dropflex base se nombraba pero no se enviaba)", () => {
    expect(customerAvatarSystem(CL)).toContain("El nombre de mi cliente ideal es [NOMBRE].");
  });

  it("la ficha lista las imágenes por id y formatea el precio en la moneda del mercado", () => {
    const u = productBriefUser({ title: "Corrector", price: 24990, baseInfo: "neopreno", images: [{ id: "img-1", source: "shopify" }] }, CL);
    expect(u).toContain("img-1");
    expect(u).toContain("$24.990");
  });
});

describe("esquemas", () => {
  it("se pueden convertir a JSON Schema para structured outputs", async () => {
    const { toJSONSchema } = await import("zod/v4");
    expect(toJSONSchema(productBriefSchema)).toHaveProperty("properties.missing_inputs");
    expect(toJSONSchema(customerAvatarSchema)).toHaveProperty("properties.formula");
  });
});
