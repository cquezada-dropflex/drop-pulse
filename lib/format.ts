// Formato de cifras de DropFlex (design-system/README.md → Contenido y voz):
// punto de miles, signo pegado, signo menos tipográfico: $24.990, −$1.200, 34%, 2,6×.

const MINUS = "−";

const currencyFormats = new Map<string, Intl.NumberFormat>();

/** Formato de moneda en es-CL. CLP sin decimales ($24.990); las demás, con los de su moneda (US$12,50). */
function currencyFormat(currency: string): Intl.NumberFormat {
  let f = currencyFormats.get(currency);
  if (!f) {
    try {
      f = new Intl.NumberFormat("es-CL", { style: "currency", currency, ...(currency === "CLP" ? { maximumFractionDigits: 0 } : {}) });
    } catch {
      f = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
    }
    currencyFormats.set(currency, f);
  }
  return f;
}

/** Decimales de la moneda: 0 en CLP, 2 en USD. */
export function fractionDigits(currency = "CLP"): number {
  return currencyFormat(currency).resolvedOptions().maximumFractionDigits ?? 0;
}

/** Símbolo para el prefijo de un campo: "$" en CLP, "US$" en USD. */
export function currencySymbol(currency = "CLP"): string {
  return currencyFormat(currency).formatToParts(0).find((p) => p.type === "currency")?.value ?? "$";
}

const decimal1 = new Intl.NumberFormat("es-CL", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const integer = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

/** $24.990 · −$1.200 (CLP por defecto; otras monedas con su símbolo y decimales). */
export function money(value: number, currency = "CLP"): string {
  const f = 10 ** fractionDigits(currency);
  const rounded = Math.round(value * f) / f;
  const abs = currencyFormat(currency).format(Math.abs(rounded)).replace(/\s/g, "");
  return rounded < 0 ? `${MINUS}${abs}` : abs;
}

/** 34% · −12% */
export function percent(value: number): string {
  const n = Math.round(value);
  return `${n < 0 ? MINUS : ""}${integer.format(Math.abs(n))}%`;
}

/** 2,6× */
export function multiplier(value: number): string {
  return `${decimal1.format(value)}×`;
}

/** 1.234 */
export function count(value: number): string {
  return integer.format(value);
}

/** Convierte "24.990" o "$24.990" en 24990. Devuelve NaN si no hay dígitos. */
export function parseMoney(input: string): number {
  const digits = input.replace(/[^\d]/g, "");
  return digits ? Number(digits) : NaN;
}

/** Monto para un campo, sin símbolo: "24.990" en CLP, "12,50" en USD. */
export function amount(value: number, currency = "CLP"): string {
  const d = fractionDigits(currency);
  if (!d) return count(value);
  return new Intl.NumberFormat("es-CL", { minimumFractionDigits: d, maximumFractionDigits: d }).format(value);
}

/** Lee un monto escrito en es-CL: "24.990" → 24990; en monedas con decimales, "12,5" → 12.5. */
export function parseAmount(input: string, currency = "CLP"): number {
  if (!fractionDigits(currency)) return parseMoney(input);
  const clean = input.replace(/[^\d,]/g, "").replace(",", ".");
  return clean && clean !== "." ? Number(clean) : NaN;
}

/** "Miércoles 23 de septiembre" (fecha ISO, sin depender de la zona horaria). */
export function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  const weekday = new Intl.DateTimeFormat("es-CL", { weekday: "long", timeZone: "UTC" }).format(date);
  const month = new Intl.DateTimeFormat("es-CL", { month: "long", timeZone: "UTC" }).format(date);
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${d} de ${month}`;
}
