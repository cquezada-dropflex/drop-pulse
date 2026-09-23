import type { Permission } from "@/components/df";

// Textos de design-system/reference/bundle.js (PERMS_SHOPIFY, PERMS_META).
export const PERMS_SHOPIFY: Permission[] = [
  { kind: "read", text: "Productos, variantes, imágenes y precios" },
  { kind: "read", text: "Pedidos, para saber qué se vende y cuánto se entrega" },
  { kind: "write", text: "Productos: solo lo que tú apruebes" },
  { kind: "never", text: "Datos de pago ni clientes fuera de tus pedidos" },
];

export const PERMS_META: Permission[] = [
  { kind: "read", text: "Rendimiento de tus campañas y del píxel" },
  { kind: "write", text: "Campañas, anuncios y presupuestos que tú apruebes" },
  { kind: "never", text: "Publicar en tu página sin tu aprobación" },
];
