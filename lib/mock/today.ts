// Cola de Hoy (ScreenHoy de bundle.js). Orden fijo por impacto: primero lo que cuesta dinero o bloquea
// ventas (errores de publicación, campañas), después lo que espera revisión, al final lo detenido.
// La referencia dice "6 por decidir"; además de sus 4 ítems, la cola incluye las otras dos campañas
// que piden una decisión (subir y vigilar), con los textos de las previews de AttentionItem y CampaignCard.
import type { AttentionEntry, TodaySummary } from "@/lib/types";

export const TODAY: AttentionEntry[] = [
  {
    id: "a-error-lampara",
    group: "primero",
    kind: "error",
    title: "No se pudo publicar en tu tienda",
    product: "Lámpara lunar 3D",
    detail: "Shopify rechazó 2 imágenes por tamaño.",
    actions: [
      { label: "Reintentar", href: "/productos/lampara-lunar-3d", variant: "primary" },
      { label: "Ver detalle", href: "/productos/lampara-lunar-3d", variant: "ghost" },
    ],
  },
  {
    id: "a-apagar-masajeador",
    group: "primero",
    kind: "ads",
    title: "Apaga “Masajeador · Video 2”",
    product: "Campaña · 4 días",
    detail: "CPA $9.800, sobre tu límite de $6.000.",
    actions: [{ label: "Revisar", href: "/campanas/masajeador-video-2" }],
  },
  {
    id: "a-subir-corrector",
    group: "primero",
    kind: "ads-up",
    title: "Sube “Corrector · Video UGC”",
    product: "Campaña · 3 días",
    detail: "CPA $4.100, 32% bajo tu límite.",
    actions: [{ label: "Revisar", href: "/campanas/corrector-video-ugc" }],
  },
  {
    id: "a-vigilar-botella",
    group: "primero",
    kind: "ads",
    title: "Vigila “Botella térmica · Imagen”",
    product: "Campaña · 7 días",
    detail: "CPA $5.700, cerca del límite y subiendo 3 días seguidos.",
    actions: [{ label: "Revisar", href: "/campanas/botella-imagen" }],
  },
  {
    id: "a-revisar-corrector",
    group: "revisar",
    kind: "review",
    title: "8 propuestas nuevas",
    product: "Corrector de postura",
    actions: [{ label: "Revisar ahora", href: "/productos/corrector-de-postura/textos", iconEnd: "chevron-right" }],
  },
  {
    id: "a-detenido-botella",
    group: "revisar",
    kind: "stuck",
    title: "Falta definir el precio",
    product: "Botella térmica 1L · detenido hace 3 días",
    actions: [],
  },
];

export const SUMMARY: TodaySummary = { date: "2026-09-23", pending: TODAY.length, errors: 1, published: 12 };
