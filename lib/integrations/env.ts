import "server-only";

// Variables de entorno de las integraciones (docs/spec-migracion-conexiones.md §8).
// Se validan al usarse: un valor faltante o mal formado falla con un mensaje claro en el log,
// nunca con un `undefined` que viaje hasta una URL de Shopify o de Meta.

class EnvError extends Error {}

function read(name: string, check?: (v: string) => boolean, hint?: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new EnvError(`Falta la variable de entorno ${name}.`);
  if (check && !check(value)) throw new EnvError(`La variable ${name} no es válida${hint ? `: ${hint}` : ""}.`);
  return value;
}

const isUrl = (v: string) => {
  try {
    const u = new URL(v);
    // En desarrollo, http solo hacia la propia máquina (Supabase local sirve en http://127.0.0.1:55321).
    return u.protocol === "https:" || ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);
  } catch {
    return false;
  }
};

/** Dominio público de la app, sin barra final. Base de todos los redirect_uri. */
export function appUrl(): string {
  return read("APP_URL", isUrl, "usa https://dominio (o http://localhost en local)").replace(/\/+$/, "");
}

export function stateSecret(): string {
  return read("OAUTH_STATE_SECRET", (v) => v.length >= 32, "al menos 32 caracteres");
}

export function cronSecret(): string {
  return read("CRON_SECRET", (v) => v.length >= 16, "al menos 16 caracteres");
}

export function supabaseAdminEnv() {
  return {
    url: read("NEXT_PUBLIC_SUPABASE_URL", isUrl),
    serviceRoleKey: read("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function shopifyEnv() {
  return {
    apiKey: read("SHOPIFY_API_KEY"),
    apiSecret: read("SHOPIFY_API_SECRET"),
    apiVersion: read("SHOPIFY_API_VERSION", (v) => /^\d{4}-(01|04|07|10)$/.test(v), "formato AAAA-01|04|07|10"),
    redirectUri: `${appUrl()}/api/onboarding/shopify/callback`,
  };
}

export function metaEnv() {
  return {
    appId: read("META_APP_ID"),
    appSecret: read("META_APP_SECRET"),
    // Opcional: con él, Facebook Login for Business; sin él, el login clásico con `scope` (app no Business).
    configId: process.env.META_LOGIN_CONFIG_ID?.trim() || null,
    graphVersion: read("META_GRAPH_VERSION", (v) => /^v\d{2,3}\.0$/.test(v), "formato v24.0"),
    redirectUri: `${appUrl()}/api/onboarding/meta/callback`,
  };
}
