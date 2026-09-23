// Imágenes de producto de ejemplo (marcadores de posición, no marca).
// Copia de productImage() en design-system/reference/bundle.js: los colores son contenido de la imagen,
// no tokens de la interfaz, por eso viven aquí y no en components/ ni app/.

const PAL = [
  ["#e9e4dc", "#b8a48a", "#6b5a45"],
  ["#dfe7ea", "#8fa9b3", "#3f5b66"],
  ["#ece6ef", "#b39cc0", "#5c4868"],
  ["#e5ebe0", "#9db38a", "#4d6340"],
  ["#f1e3dc", "#d19b86", "#7a4a3a"],
  ["#e6e6e6", "#a3a3a3", "#4a4a4a"],
];

export function productImage(i = 0, shape?: number): string {
  const p = PAL[i % PAL.length];
  const s = shape ?? i % 4;
  let body: string;
  if (s === 0)
    body = `<rect x="36" y="22" width="28" height="10" rx="3" fill="${p[2]}"/><rect x="30" y="30" width="40" height="52" rx="10" fill="${p[1]}"/><rect x="36" y="46" width="28" height="16" rx="3" fill="${p[0]}"/>`;
  else if (s === 1)
    body = `<rect x="22" y="30" width="56" height="44" rx="6" fill="${p[1]}"/><path d="M22 42h56" stroke="${p[2]}" stroke-width="3"/><rect x="44" y="30" width="12" height="44" fill="${p[2]}" opacity=".5"/>`;
  else if (s === 2)
    body = `<circle cx="50" cy="52" r="24" fill="${p[1]}"/><circle cx="50" cy="52" r="10" fill="${p[0]}"/><rect x="47" y="22" width="6" height="10" rx="2" fill="${p[2]}"/>`;
  else
    body = `<path d="M30 78c0-22 8-40 20-50 12 10 20 28 20 50z" fill="${p[1]}"/><path d="M50 28v50" stroke="${p[2]}" stroke-width="3"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${p[0]}"/><ellipse cx="50" cy="84" rx="26" ry="4" fill="${p[2]}" opacity=".18"/>${body}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
