// Campañas de ejemplo: ScreenCampanas y ScreenDeskCampanas de bundle.js.
// Gasto total 7 días: $38.200 + $29.400 + $4.600 + $14.200 = $86.400; ventas confirmadas: 23 + 6 + 0 + 12 = 41.
import type { Campaign } from "@/lib/types";
import { productImage } from "./images";

const days = ["Jue", "Vie", "Sáb", "Dom", "Lun", "Mar", "Mié"];

export const CAMPAIGNS: (Campaign & { confirmedSales: number; spend: number })[] = [
  {
    id: "corrector-video-ugc",
    productId: "corrector-de-postura",
    name: "Corrector · Video UGC",
    image: productImage(1),
    verdict: "subir",
    reason: "CPA $4.100 por 3 días, 32% bajo tu límite de $6.000.",
    meta: "Meta Ads · 3 días",
    nextBudget: "$15.000",
    budget: 10000,
    spend: 38200,
    confirmedSales: 23,
    metrics: [
      { label: "Costo por venta", value: "$4.100", target: "Límite $6.000", trend: "good" },
      { label: "Ventas confirmadas", value: "23", target: "82% confirma", trend: "good" },
      { label: "Gasto", value: "$38.200" },
      { label: "Retorno", value: "2,6×" },
    ],
    history: days.map((day, i) => ({ day, spend: [4800, 5200, 5600, 5400, 5700, 5700, 5800][i], sales: [2, 3, 3, 4, 3, 4, 4][i], cpa: [5200, 4900, 4300, 4100, 4200, 4000, 4100][i] })),
  },
  {
    id: "masajeador-video-2",
    productId: "masajeador-de-cuello",
    name: "Masajeador · Video 2",
    image: productImage(4),
    verdict: "apagar",
    reason: "CPA $9.800 por 4 días; cada venta te deja −$1.200.",
    meta: "Meta Ads · 4 días",
    budget: 8000,
    spend: 29400,
    confirmedSales: 6,
    metrics: [
      { label: "Costo por venta", value: "$9.800", target: "Límite $6.000", trend: "bad" },
      { label: "Ventas confirmadas", value: "6", target: "61% confirma", trend: "warn" },
      { label: "Gasto", value: "$29.400" },
      { label: "Retorno", value: "0,9×" },
    ],
    history: days.map((day, i) => ({ day, spend: [0, 0, 0, 7200, 7400, 7300, 7500][i], sales: [0, 0, 0, 2, 1, 2, 1][i], cpa: [null, null, null, 7800, 9600, 10200, 9800][i] })),
  },
  {
    id: "lampara-carrusel",
    productId: "lampara-lunar-3d",
    name: "Lámpara lunar · Carrusel",
    image: productImage(2),
    verdict: "aprendiendo",
    reason: "14 h activa. Espera 48 h o 10 ventas antes de decidir.",
    meta: "Meta Ads · 14 h",
    budget: 8000,
    spend: 4600,
    confirmedSales: 0,
    metrics: [
      { label: "Costo por venta", value: "—" },
      { label: "Gasto", value: "$4.600" },
    ],
    history: [{ day: "Mié", spend: 4600, sales: 0, cpa: null }],
  },
  {
    id: "botella-imagen",
    productId: "botella-termica-1l",
    name: "Botella térmica · Imagen",
    image: productImage(0),
    verdict: "vigilar",
    reason: "CPA $5.700, cerca del límite y subiendo 3 días seguidos.",
    meta: "Meta Ads · 7 días",
    budget: 5000,
    spend: 14200,
    confirmedSales: 12,
    metrics: [
      { label: "Costo por venta", value: "$5.700", target: "Límite $6.000", trend: "warn" },
      { label: "Gasto", value: "$14.200" },
    ],
    history: days.map((day, i) => ({ day, spend: [1900, 2000, 2000, 2100, 2000, 2100, 2100][i], sales: [2, 2, 2, 2, 2, 1, 1][i], cpa: [4800, 4900, 4700, 5000, 5200, 5500, 5700][i] })),
  },
];
