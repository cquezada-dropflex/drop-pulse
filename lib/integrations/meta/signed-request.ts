import "server-only";
import { createHmac } from "node:crypto";
import { metaEnv } from "../env";
import { safeEqual } from "../oauth-state";

// `signed_request` de los callbacks de desautorización y de borrado de datos de Meta (spec §6.6):
// “<firma base64url>.<payload base64url>”, HMAC-SHA256 del payload con el app secret.

export interface SignedRequest {
  user_id: string;
  algorithm: string;
  issued_at?: number;
}

export function parseSignedRequest(raw: string | null): SignedRequest | null {
  if (!raw) return null;
  const [sig, payload] = raw.split(".");
  if (!sig || !payload) return null;
  const expected = createHmac("sha256", metaEnv().appSecret).update(payload).digest("base64url");
  if (!safeEqual(expected, sig.replace(/=+$/, ""))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<SignedRequest>;
    if (data.algorithm?.toUpperCase() !== "HMAC-SHA256" || typeof data.user_id !== "string") return null;
    return data as SignedRequest;
  } catch {
    return null;
  }
}
