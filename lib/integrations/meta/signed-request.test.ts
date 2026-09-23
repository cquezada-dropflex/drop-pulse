import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseSignedRequest } from "./signed-request";

function make(payload: object, secret = "meta-secret") {
  const p = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${createHmac("sha256", secret).update(p).digest("base64url")}.${p}`;
}

describe("signed_request de Meta", () => {
  it("lee el usuario de una firma válida", () => {
    expect(parseSignedRequest(make({ algorithm: "HMAC-SHA256", user_id: "10" }))?.user_id).toBe("10");
  });
  it("rechaza otra clave", () => expect(parseSignedRequest(make({ algorithm: "HMAC-SHA256", user_id: "10" }, "otra"))).toBeNull());
  it("rechaza otro algoritmo", () => expect(parseSignedRequest(make({ algorithm: "none", user_id: "10" }))).toBeNull());
  it("rechaza basura", () => expect(parseSignedRequest("abc")).toBeNull());
});
