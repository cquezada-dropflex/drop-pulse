// Claves estables de error de las conexiones → texto para el usuario (docs/spec-migracion-conexiones.md §7).
// En la base se guarda la clave; el texto se arma aquí, con la voz de design-system/README.md:
// qué pasó y qué hacer, tuteo, sin signos de exclamación.

export type ConnectionErrorCode =
  | "denied"
  | "expired"
  | "insufficient_scope"
  | "shop_taken"
  | "unavailable"
  | "revoked"
  | "disconnected"
  | "import_failed"
  | "no_ad_accounts";

const SHOPIFY: Record<ConnectionErrorCode, string> = {
  denied: "Cancelaste la autorización en Shopify. Vuelve a intentarlo cuando quieras.",
  expired: "La autorización venció. Vuelve a conectar tu tienda.",
  insufficient_scope: "Faltan permisos para leer tus productos y pedidos. Vuelve a conectar y acepta todos.",
  shop_taken: "Esa tienda ya está conectada a otra cuenta de DropFlex. Entra con esa cuenta o escríbenos.",
  unavailable: "Shopify no respondió. Intenta de nuevo en unos minutos.",
  revoked: "Desinstalaste DropFlex en Shopify. Vuelve a conectar para seguir.",
  disconnected: "Desconectaste tu tienda. Vuelve a conectarla para seguir mejorando tus productos.",
  import_failed: "No pudimos traer todos tus productos. Reintentaremos solos; si sigue, vuelve a conectar.",
  no_ad_accounts: "La conexión no terminó. Vuelve a conectar tu tienda.",
};

const META: Record<ConnectionErrorCode, string> = {
  denied: "Cancelaste la autorización en Facebook. Puedes conectarla ahora o después.",
  expired: "La autorización venció. Vuelve a conectar Meta Ads.",
  insufficient_scope: "Faltan permisos para ver tus cuentas publicitarias. Vuelve a conectar y acepta todos.",
  shop_taken: "La conexión no terminó. Vuelve a conectar Meta Ads.",
  unavailable: "Facebook no respondió. Intenta de nuevo en unos minutos.",
  revoked: "Quitaste el acceso de DropFlex en Facebook. Vuelve a conectar para anunciar.",
  disconnected: "Desconectaste Meta Ads. Vuelve a conectarla cuando quieras anunciar.",
  import_failed: "La conexión no terminó. Vuelve a conectar Meta Ads.",
  no_ad_accounts: "No encontramos cuentas publicitarias activas en tu Business Manager. Activa una en Meta o conecta después.",
};

export function connectionErrorText(provider: "shopify" | "meta", code: string | null | undefined): string {
  const table = provider === "shopify" ? SHOPIFY : META;
  return table[(code ?? "expired") as ConnectionErrorCode] ?? table.expired;
}
