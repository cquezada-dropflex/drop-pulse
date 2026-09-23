// Supuestos del comerciante (Ajustes). Hoy, valores de ejemplo.
import type { Assumptions } from "@/lib/types";

export async function getAssumptions(): Promise<Assumptions> {
  return { deliveryRate: 80, maxCpa: 6000, store: "tutienda.cl", metaAccount: "Cuenta publicitaria de Meta" };
}
