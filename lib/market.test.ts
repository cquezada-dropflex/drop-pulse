import { describe, expect, it } from "vitest";
import { DEFAULT_MARKET, detectMarket, validateMarket } from "./market";

describe("detectMarket", () => {
  it("usa el país de Shopify con su moneda e idioma", () => {
    expect(detectMarket({ countryCode: "MX", currency: "MXN", timezone: "America/Mexico_City" })).toEqual({
      countryCode: "MX",
      currency: "MXN",
      language: "es",
      timezone: "America/Mexico_City",
    });
  });

  it("respeta la moneda de la tienda si es elegible (Ecuador vende en dólares)", () => {
    expect(detectMarket({ countryCode: "EC", currency: "USD" }).currency).toBe("USD");
  });

  it("Brasil sugiere portugués", () => {
    expect(detectMarket({ countryCode: "BR", currency: "BRL" }).language).toBe("pt-BR");
  });

  it("un país fuera de LATAM cae al mercado por defecto sin imponer una moneda rara", () => {
    const m = detectMarket({ countryCode: "US", currency: "EUR" });
    expect(m.countryCode).toBe(DEFAULT_MARKET.countryCode);
    expect(m.currency).toBe("CLP");
  });

  it("sin datos, el mercado por defecto", () => {
    expect(detectMarket({}).countryCode).toBe("CL");
  });
});

describe("validateMarket", () => {
  it("acepta un mercado completo", () => {
    expect(validateMarket({ countryCode: "CO", currency: "COP", language: "es" }).ok).toBe(true);
  });

  it("dice qué campo falla", () => {
    const r = validateMarket({ countryCode: "CO", currency: "XXX", language: "es" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe("currency");
  });
});
