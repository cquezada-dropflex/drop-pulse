// Datos de ejemplo. Productos, textos y cifras de design-system/reference/bundle.js (Screen*).
// Los productos que la referencia no nombra completan los conteos de la pantalla Productos
// (24 productos: 9 avanzan, 3 detenidos, 12 publicados).
import type { MeterStage } from "@/components/df/stage-meter";
import type { Product, Stage, StageKey } from "@/lib/types";
import { productImage } from "./images";

const TITLES: Record<StageKey, string> = {
  importado: "Producto importado",
  textos: "Textos",
  imagenes: "Imágenes",
  precio: "Precio y oferta",
  publicar: "Publicar en tu tienda",
  anuncios: "Anuncios",
};

const KEYS: StageKey[] = ["importado", "textos", "imagenes", "precio", "publicar", "anuncios"];

/** Etapas por defecto a partir del medidor, con las descripciones de la referencia. */
function stagesFromMeter(meter: MeterStage[], cost: number): Stage[] {
  return KEYS.map((key, i) => {
    const m = meter[i];
    const optional = key === "anuncios";
    const state =
      m === "done" ? "done" : m === "current" ? "current" : m === "review" || m === "stuck" ? "review" : m === "error" ? "error" : optional && m === "optional" ? "locked" : "locked";
    const desc: Partial<Record<StageKey, string>> = {
      importado: `Proveedor · costo ${new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(cost)}`,
      textos: state === "done" ? "Aprobados" : "Propuestas por revisar",
      imagenes: state === "done" ? "Elegidas y ordenadas" : "Elige y ordena 4 a 6",
      precio: state === "done" ? "Aprobado" : "Calcula cuánto ganas",
      publicar: state === "done" ? "En tu tienda" : "Necesita textos, imágenes y precio aprobados",
      anuncios: state === "done" ? "Campañas activas" : "Se habilita al publicar",
    };
    return { key, title: TITLES[key], state, desc: desc[key], optional };
  });
}

const st = (s: string) => s.split(",") as MeterStage[];

type Seed = Omit<Product, "stages" | "image" | "status"> & { imageIndex: number; stages?: Stage[] };

const SEEDS: Seed[] = [
  // Detenidos (la referencia: Productos con el filtro "Detenidos").
  {
    id: "lampara-lunar-3d",
    name: "Lámpara lunar 3D",
    imageIndex: 2,
    sku: "DF-10418",
    filter: "detenidos",
    meter: st("done,done,done,done,error,optional"),
    reason: "Error al publicar · 2 imágenes",
    tone: "danger",
    nextStage: "publicar",
    summary: "4 de 5 etapas · falló al publicar hace 1 h",
    supplierCost: 7400,
    stages: [
      { key: "importado", title: "Producto importado", state: "done", desc: "Proveedor · costo $7.400" },
      { key: "textos", title: "Textos", state: "done", desc: "Aprobados" },
      { key: "imagenes", title: "Imágenes", state: "done", desc: "5 elegidas" },
      { key: "precio", title: "Precio y oferta", state: "done", desc: "$19.990 · ganas $4.120" },
      { key: "publicar", title: "Publicar en tu tienda", state: "error", desc: "Shopify rechazó 2 imágenes por tamaño" },
      { key: "anuncios", title: "Anuncios", state: "locked", optional: true, desc: "Se habilita al publicar" },
    ],
  },
  {
    id: "corrector-de-postura",
    name: "Corrector de postura",
    imageIndex: 1,
    sku: "DF-10432",
    filter: "detenidos",
    meter: st("done,review,current,locked,locked,optional"),
    reason: "Espera tu revisión · 8 textos",
    tone: "warning",
    nextStage: "imagenes",
    summary: "2 de 5 etapas · editado hace 2 h",
    supplierCost: 6900,
    stages: [
      { key: "importado", title: "Producto importado", state: "done", desc: "Proveedor · costo $6.900" },
      { key: "textos", title: "Textos", state: "review", desc: "8 propuestas esperan tu revisión" },
      { key: "imagenes", title: "Imágenes", state: "current", desc: "Elige y ordena 4 a 6" },
      { key: "precio", title: "Precio y oferta", state: "available", desc: "Calcula cuánto ganas" },
      { key: "publicar", title: "Publicar en tu tienda", state: "locked", desc: "Necesita textos, imágenes y precio aprobados" },
      { key: "anuncios", title: "Anuncios", state: "locked", optional: true, desc: "Se habilita al publicar" },
    ],
  },
  {
    id: "botella-termica-1l",
    name: "Botella térmica 1L",
    imageIndex: 0,
    sku: "DF-10397",
    filter: "detenidos",
    meter: st("done,done,done,stuck,locked,optional"),
    reason: "Detenido: falta el precio · 3 días",
    tone: "warning",
    nextStage: "precio",
    summary: "3 de 5 etapas · detenido hace 3 días",
    supplierCost: 5200,
    stages: [
      { key: "importado", title: "Producto importado", state: "done", desc: "Proveedor · costo $5.200" },
      { key: "textos", title: "Textos", state: "done", desc: "Aprobados" },
      { key: "imagenes", title: "Imágenes", state: "done", desc: "4 elegidas" },
      { key: "precio", title: "Precio y oferta", state: "current", desc: "Falta definir el precio · hace 3 días" },
      { key: "publicar", title: "Publicar en tu tienda", state: "locked", desc: "Necesita textos, imágenes y precio aprobados" },
      { key: "anuncios", title: "Anuncios", state: "locked", optional: true, desc: "Se habilita al publicar" },
    ],
  },

  // Avanzan (9): la IA está trabajando o el comerciante va al día.
  ...[
    ["organizador-de-cables", "Organizador de cables", 3, "done,current,locked,locked,locked,optional", "Generando textos · listo en 5 min", "textos"],
    ["soporte-celular-auto", "Soporte de celular para auto", 5, "done,done,current,locked,locked,optional", "Generando imágenes · 4 de 9", "imagenes"],
    ["almohada-cervical", "Almohada cervical", 4, "done,done,done,current,locked,optional", "Siguiente: precio y oferta", "precio"],
    ["rodillo-de-masaje", "Rodillo de masaje", 2, "done,current,locked,locked,locked,optional", "Generando textos · listo en 3 min", "textos"],
    ["mini-proyector", "Mini proyector portátil", 0, "done,done,done,done,current,optional", "Publicándose en tu tienda", "publicar"],
    ["humidificador-aroma", "Humidificador de aroma", 1, "done,done,current,locked,locked,optional", "Generando imágenes · 7 de 9", "imagenes"],
    ["faja-lumbar", "Faja lumbar", 3, "current,locked,locked,locked,locked,optional", "Importando del proveedor", "importado"],
    ["lampara-escritorio-led", "Lámpara de escritorio LED", 4, "done,done,done,current,locked,optional", "Siguiente: precio y oferta", "precio"],
    ["cepillo-alisador", "Cepillo alisador", 5, "done,current,locked,locked,locked,optional", "Generando textos · listo en 8 min", "textos"],
  ].map(([id, name, img, meter, reason, next], i): Seed => ({
    id: id as string,
    name: name as string,
    imageIndex: img as number,
    sku: `DF-10${460 + i}`,
    filter: "avanzan",
    meter: st(meter as string),
    reason: reason as string,
    tone: "primary",
    nextStage: next as StageKey,
    summary: `${(meter as string).split(",").filter((m) => m === "done").length} de 5 etapas · la IA está trabajando`,
    supplierCost: 4800 + i * 300,
  })),

  // Publicados (12).
  ...[
    ["masajeador-de-cuello", "Masajeador de cuello", 4, "Publicado · 2 campañas activas"],
    ["faja-reductora", "Faja reductora", 2, "Publicado · 1 campaña activa"],
    ["termo-cafe", "Termo para café", 0, "Publicado · 1 campaña activa"],
    ["set-brochas", "Set de brochas de maquillaje", 1, "Publicado · sin campañas"],
    ["audifonos-deportivos", "Audífonos deportivos", 5, "Publicado · 1 campaña activa"],
    ["alfombra-yoga", "Alfombra de yoga", 3, "Publicado · sin campañas"],
    ["reloj-inteligente", "Reloj inteligente", 5, "Publicado · 2 campañas activas"],
    ["lampara-sal", "Lámpara de sal", 4, "Publicado · sin campañas"],
    ["mochila-antirrobo", "Mochila antirrobo", 1, "Publicado · 1 campaña activa"],
    ["plancha-vapor", "Plancha de vapor portátil", 2, "Publicado · sin campañas"],
    ["organizador-maquillaje", "Organizador de maquillaje", 0, "Publicado · sin campañas"],
    ["tira-led", "Tira LED para pieza", 3, "Publicado · 1 campaña activa"],
  ].map(([id, name, img, reason], i): Seed => ({
    id: id as string,
    name: name as string,
    imageIndex: img as number,
    sku: `DF-10${300 + i}`,
    filter: "publicados",
    meter: st("done,done,done,done,done,done"),
    reason: reason as string,
    tone: "success",
    nextStage: "anuncios",
    summary: "5 de 5 etapas · publicado",
    supplierCost: 5600 + i * 250,
  })),
];

export const PRODUCTS: Product[] = SEEDS.map(({ imageIndex, stages, ...p }) => ({
  ...p,
  image: productImage(imageIndex),
  stages: stages ?? stagesFromMeter(p.meter, p.supplierCost),
  status: p.filter === "publicados" ? "publicado" : p.tone === "danger" ? "error" : p.filter === "detenidos" ? "revision" : "generado",
}));
