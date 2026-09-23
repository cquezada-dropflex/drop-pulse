import { describe, expect, it } from "vitest";
import { amount, currencySymbol, money, parseAmount } from "./format";

describe("dinero", () => {
  it("CLP como siempre", () => {
    expect(money(24990)).toBe("$24.990");
    expect(money(-1200)).toBe("−$1.200");
  });
  it("otras monedas con su símbolo y decimales", () => {
    expect(money(12.5, "USD")).toBe("US$12,50");
    expect(currencySymbol("USD")).toBe("US$");
    expect(amount(12.5, "USD")).toBe("12,50");
    expect(parseAmount("12,5", "USD")).toBe(12.5);
    expect(parseAmount("24.990", "CLP")).toBe(24990);
  });
});
