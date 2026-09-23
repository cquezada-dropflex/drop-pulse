import { describe, expect, it } from "vitest";
import { detectTopics } from "./topics";

describe("detectTopics", () => {
  it("encuentra los temas del texto de ejemplo del design system", () => {
    const text =
      "Corrector Postura Espalda Ajustable Unisex. Material: neopreno + velcro. Talla única, ajustable hasta 110 cm de pecho. Ayuda a mantener la espalda recta y reduce la tensión en hombros. Se usa debajo de la ropa. Clientes preguntan si sirve para trabajar sentado 8 horas: sí, recomendado 2 a 3 horas al día al inicio.";
    const found = detectTopics(text);
    expect(found).toEqual(expect.arrayContaining(["Beneficios", "Medidas", "Materiales", "Modo de uso"]));
    expect(found).not.toContain("Garantía");
    // “Clientes preguntan…” no dice para quién es (la referencia no lo marca).
    expect(found).not.toContain("Para quién es");
  });

  it("detecta garantía e incluye", () => {
    expect(detectTopics("Incluye 4 cabezales. Garantía de 30 días.")).toEqual(expect.arrayContaining(["Qué incluye", "Garantía"]));
  });

  it("texto vacío, sin temas", () => {
    expect(detectTopics("")).toEqual([]);
  });
});
