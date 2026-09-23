import { afterEach, describe, expect, it, vi } from "vitest";
import { supabaseAdminEnv } from "./env";

describe("supabaseAdminEnv", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("acepta Supabase local en http://127.0.0.1", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:55321");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "clave");
    expect(supabaseAdminEnv().url).toBe("http://127.0.0.1:55321");
  });

  it("rechaza http hacia otra máquina", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://ejemplo.com");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "clave");
    expect(() => supabaseAdminEnv()).toThrow("NEXT_PUBLIC_SUPABASE_URL no es válida");
  });
});
