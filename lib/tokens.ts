import tokens from "@/design-system/tokens.json";

export type ThemeId = "light" | "dark";

export interface ColorToken {
  name: string;
  value: Record<ThemeId, string>;
  usage: string;
}

export const colorTokens = tokens.color.tokens as ColorToken[];
export const typeGroups = tokens.type.groups;

const byName = new Map(colorTokens.map((t) => [t.name, t]));

/** Resuelve un color de tokens.json, siguiendo alias como "{foreground}". */
export function colorToken(name: string, theme: ThemeId): string {
  const value = byName.get(name)?.value[theme];
  if (!value) throw new Error(`Token de color desconocido: ${name}`);
  const alias = value.match(/^\{(.+)\}$/);
  return alias ? colorToken(alias[1], theme) : value;
}
