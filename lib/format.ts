// Formato de cifras de DropFlex (design-system/README.md → Contenido y voz):
// punto de miles, signo pegado, signo menos tipográfico: $24.990, −$1.200, 34%, 2,6×.

const MINUS = "−";

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const decimal1 = new Intl.NumberFormat("es-CL", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const integer = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

/** $24.990 · −$1.200 */
export function money(value: number): string {
  const abs = clp.format(Math.abs(Math.round(value))).replace(/\s/g, "");
  return value < 0 && Math.round(value) !== 0 ? `${MINUS}${abs}` : abs;
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

/** "Miércoles 23 de septiembre" (fecha ISO, sin depender de la zona horaria). */
export function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  const weekday = new Intl.DateTimeFormat("es-CL", { weekday: "long", timeZone: "UTC" }).format(date);
  const month = new Intl.DateTimeFormat("es-CL", { month: "long", timeZone: "UTC" }).format(date);
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${d} de ${month}`;
}
