// Acceso a campañas. Hoy lee lib/mock/campaigns.ts.
import { CAMPAIGNS } from "@/lib/mock/campaigns";
import type { Campaign } from "@/lib/types";

export type CampaignPeriod = "today" | "7" | "30";

export async function getCampaigns(): Promise<Campaign[]> {
  return CAMPAIGNS;
}

export async function getCampaign(id: string): Promise<(Campaign & { confirmedSales: number; spend: number }) | null> {
  return CAMPAIGNS.find((c) => c.id === id) ?? null;
}

/** Resumen del periodo: gasto y ventas confirmadas. */
export async function getCampaignSummary(): Promise<{ spend: number; confirmedSales: number }> {
  return {
    spend: CAMPAIGNS.reduce((s, c) => s + c.spend, 0),
    confirmedSales: CAMPAIGNS.reduce((s, c) => s + c.confirmedSales, 0),
  };
}
