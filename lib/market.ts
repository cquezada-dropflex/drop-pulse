// Mercado del comerciante: país, moneda e idioma. Se detecta desde Shopify al conectar la tienda y el
// comerciante lo confirma (o lo corrige) antes de elegir productos. Lo usa todo el pipeline de IA:
// idioma del copy, moneda de las cifras, pago contra entrega y la normativa local.
// Módulo puro: sin I/O, testeable.

export interface Market {
  /** ISO 3166-1 alfa-2. */
  countryCode: string;
  /** ISO 4217. */
  currency: string;
  /** "es" o "pt-BR". */
  language: string;
  timezone?: string | null;
}

export interface CountryInfo {
  code: string;
  name: string;
  currency: string;
  language: string;
  /** Autoridad de protección al consumidor (para las reglas de publicidad engañosa). */
  consumerAuthority: string;
}

/** Países donde opera DropFlex: LATAM con pago contra entrega. Orden alfabético por nombre. */
export const COUNTRIES: CountryInfo[] = [
  { code: "AR", name: "Argentina", currency: "ARS", language: "es", consumerAuthority: "Defensa del Consumidor (Ley 24.240)" },
  { code: "BO", name: "Bolivia", currency: "BOB", language: "es", consumerAuthority: "Ley 453 de derechos del consumidor" },
  { code: "BR", name: "Brasil", currency: "BRL", language: "pt-BR", consumerAuthority: "Procon y el Código de Defesa do Consumidor" },
  { code: "CL", name: "Chile", currency: "CLP", language: "es", consumerAuthority: "SERNAC (Ley 19.496)" },
  { code: "CO", name: "Colombia", currency: "COP", language: "es", consumerAuthority: "SIC (Estatuto del Consumidor, Ley 1480)" },
  { code: "CR", name: "Costa Rica", currency: "CRC", language: "es", consumerAuthority: "MEIC (Ley 7472)" },
  { code: "EC", name: "Ecuador", currency: "USD", language: "es", consumerAuthority: "Ley Orgánica de Defensa del Consumidor" },
  { code: "SV", name: "El Salvador", currency: "USD", language: "es", consumerAuthority: "Defensoría del Consumidor" },
  { code: "GT", name: "Guatemala", currency: "GTQ", language: "es", consumerAuthority: "DIACO" },
  { code: "HN", name: "Honduras", currency: "HNL", language: "es", consumerAuthority: "Ley de Protección al Consumidor" },
  { code: "MX", name: "México", currency: "MXN", language: "es", consumerAuthority: "PROFECO (Ley Federal de Protección al Consumidor)" },
  { code: "NI", name: "Nicaragua", currency: "NIO", language: "es", consumerAuthority: "Ley 842 de protección al consumidor" },
  { code: "PA", name: "Panamá", currency: "USD", language: "es", consumerAuthority: "ACODECO" },
  { code: "PY", name: "Paraguay", currency: "PYG", language: "es", consumerAuthority: "SEDECO (Ley 1334)" },
  { code: "PE", name: "Perú", currency: "PEN", language: "es", consumerAuthority: "INDECOPI (Código de Protección al Consumidor)" },
  { code: "DO", name: "República Dominicana", currency: "DOP", language: "es", consumerAuthority: "Pro Consumidor (Ley 358-05)" },
  { code: "UY", name: "Uruguay", currency: "UYU", language: "es", consumerAuthority: "Ley 17.250 de relaciones de consumo" },
];

/** Monedas que se pueden elegir: las de los países y el dólar. */
export const CURRENCIES: { code: string; name: string }[] = [
  { code: "ARS", name: "Peso argentino" },
  { code: "BOB", name: "Boliviano" },
  { code: "BRL", name: "Real brasileño" },
  { code: "CLP", name: "Peso chileno" },
  { code: "COP", name: "Peso colombiano" },
  { code: "CRC", name: "Colón costarricense" },
  { code: "DOP", name: "Peso dominicano" },
  { code: "GTQ", name: "Quetzal" },
  { code: "HNL", name: "Lempira" },
  { code: "MXN", name: "Peso mexicano" },
  { code: "NIO", name: "Córdoba" },
  { code: "PEN", name: "Sol peruano" },
  { code: "PYG", name: "Guaraní" },
  { code: "USD", name: "Dólar estadounidense" },
  { code: "UYU", name: "Peso uruguayo" },
];

export const LANGUAGES: { code: string; name: string }[] = [
  { code: "es", name: "Español neutro" },
  { code: "pt-BR", name: "Portugués de Brasil" },
];

/** Si Shopify no dice nada útil: Chile, pesos chilenos, español (los valores por defecto de DropFlex). */
export const DEFAULT_MARKET: Market = { countryCode: "CL", currency: "CLP", language: "es", timezone: "America/Santiago" };

export function countryInfo(code: string | null | undefined): CountryInfo | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

export const countryName = (code: string | null | undefined) => countryInfo(code)?.name ?? code ?? "";
export const currencyName = (code: string | null | undefined) => CURRENCIES.find((c) => c.code === code)?.name ?? code ?? "";
export const languageName = (code: string | null | undefined) => LANGUAGES.find((l) => l.code === code)?.name ?? code ?? "";

/**
 * Mercado sugerido con lo que Shopify sabe de la tienda. Un país fuera de LATAM (una tienda de
 * prueba creada en EE. UU.) no se impone: se sugiere el mercado por defecto y la moneda de la tienda
 * si es una de las que se pueden elegir.
 */
export function detectMarket(shop: { countryCode?: string | null; currency?: string | null; timezone?: string | null }): Market {
  const country = countryInfo(shop.countryCode ?? undefined);
  const currencyOk = (c?: string | null): c is string => !!c && CURRENCIES.some((x) => x.code === c);
  if (country) {
    return {
      countryCode: country.code,
      currency: currencyOk(shop.currency) ? shop.currency : country.currency,
      language: country.language,
      timezone: shop.timezone ?? null,
    };
  }
  return { ...DEFAULT_MARKET, currency: currencyOk(shop.currency) ? shop.currency : DEFAULT_MARKET.currency, timezone: shop.timezone ?? DEFAULT_MARKET.timezone };
}

/** Valida lo que el comerciante confirma. Devuelve el mercado o el campo con problema. */
export function validateMarket(input: Partial<Market>): { ok: true; market: Market } | { ok: false; field: keyof Market; error: string } {
  if (!countryInfo(input.countryCode)) return { ok: false, field: "countryCode", error: "Elige el país donde vendes." };
  if (!CURRENCIES.some((c) => c.code === input.currency)) return { ok: false, field: "currency", error: "Elige la moneda de tu tienda." };
  if (!LANGUAGES.some((l) => l.code === input.language)) return { ok: false, field: "language", error: "Elige el idioma de tus textos." };
  return {
    ok: true,
    market: { countryCode: input.countryCode!, currency: input.currency!, language: input.language!, timezone: input.timezone ?? null },
  };
}
