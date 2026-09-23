import { afterEach, describe, expect, it } from "vitest";
import { authorizeUrl } from "./oauth";

const saved = process.env.META_LOGIN_CONFIG_ID;
afterEach(() => {
  process.env.META_LOGIN_CONFIG_ID = saved;
});

describe("URL de autorización de Meta", () => {
  it("sin META_LOGIN_CONFIG_ID usa el login clásico con los permisos en scope", () => {
    process.env.META_LOGIN_CONFIG_ID = "";
    const u = new URL(authorizeUrl("st", false));
    expect(u.searchParams.get("scope")).toBe("ads_read,ads_management,business_management,pages_show_list");
    expect(u.searchParams.has("config_id")).toBe(false);
    expect(u.searchParams.get("redirect_uri")).toBe("https://app.dropflex.test/api/onboarding/meta/callback");
  });

  it("con META_LOGIN_CONFIG_ID usa Facebook Login for Business", () => {
    process.env.META_LOGIN_CONFIG_ID = "cfg";
    const u = new URL(authorizeUrl("st", false));
    expect(u.searchParams.get("config_id")).toBe("cfg");
    expect(u.searchParams.has("scope")).toBe(false);
  });

  it("al reconectar vuelve a pedir lo rechazado", () => {
    expect(new URL(authorizeUrl("st", true)).searchParams.get("auth_type")).toBe("rerequest");
  });
});
