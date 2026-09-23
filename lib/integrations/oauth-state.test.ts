import { describe, expect, it } from "vitest";
import { signState, verifyState } from "./oauth-state";

const base = { purpose: "shopify" as const, uid: "u1", nonce: "n1", shop: "mitienda.myshopify.com" };

describe("state firmado", () => {
  it("valida un state recién firmado", () => {
    const r = verifyState(signState({ ...base, iat: Date.now() }), "shopify");
    expect(r.ok && r.state.uid).toBe("u1");
  });

  it("rechaza una firma alterada", () => {
    const raw = signState({ ...base, iat: Date.now() });
    const [payload] = raw.split(".");
    const forged = Buffer.from(JSON.stringify({ ...base, uid: "otro", iat: Date.now() })).toString("base64url");
    expect(verifyState(`${forged}.${raw.split(".")[1]}`, "shopify")).toEqual({ ok: false, reason: "firma" });
    expect(verifyState(`${payload}.xyz`, "shopify")).toEqual({ ok: false, reason: "firma" });
  });

  it("un state de Shopify no sirve para Meta", () => {
    expect(verifyState(signState({ ...base, iat: Date.now() }), "meta")).toEqual({ ok: false, reason: "propósito" });
  });

  it("vence a los 10 minutos", () => {
    const now = Date.now();
    expect(verifyState(signState({ ...base, iat: now - 11 * 60_000 }), "shopify", now)).toEqual({ ok: false, reason: "vencido" });
  });
});
