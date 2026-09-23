import { describe, expect, it } from "vitest";
import { toMetaAssets } from "./assets";

const now = Date.parse("2026-09-23T12:00:00Z");

describe("activos de Meta para O7", () => {
  const assets = toMetaAssets(
    {
      accounts: [
        { id: "act_1", name: "Pruebas", account_status: 2, currency: "CLP" },
        { id: "act_2", name: "Mi Tienda USD", account_status: 1, currency: "USD" },
        { id: "act_3", name: "Mi Tienda CL", account_status: 1, currency: "CLP" },
      ],
      pages: [{ id: "p1", name: "Mi Tienda" }],
      pixelsByAccount: {
        act_2: [],
        act_3: [
          { id: "x1", name: "Viejo", last_fired_time: "2026-09-01T00:00:00Z" },
          { id: "x2", name: "Activo", last_fired_time: "2026-09-23T10:00:00Z" },
        ],
      },
    },
    "CLP",
    now,
  );

  it("sugiere la cuenta activa en la moneda de la tienda y el píxel más reciente", () => {
    expect(assets.suggested).toEqual({ account: "act_3", page: "p1", pixel: "x2" });
    expect(assets.adAccounts.find((a) => a.value === "act_3")?.tag).toBe("Sugerida");
  });

  it("deja las deshabilitadas al final, con su motivo", () => {
    expect(assets.adAccounts.at(-1)).toMatchObject({ value: "act_1", disabled: true, tone: "danger", meta: "Deshabilitada por Meta" });
  });

  it("avisa sin bloquear si el píxel no recibe eventos", () => {
    expect(assets.pixelsByAccount.act_3[1]).toMatchObject({ value: "x1", tone: "warning" });
    expect(assets.pixelsByAccount.act_3[1].disabled).toBeUndefined();
  });
});
