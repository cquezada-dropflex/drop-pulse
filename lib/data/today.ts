// Cola de decisiones de Hoy. Hoy lee lib/mock/today.ts.
import { SUMMARY, TODAY } from "@/lib/mock/today";
import type { AttentionEntry, TodaySummary } from "@/lib/types";

/** Decisiones pendientes, ya ordenadas por impacto. */
export async function getTodayQueue(): Promise<AttentionEntry[]> {
  return TODAY;
}

export async function getTodaySummary(): Promise<TodaySummary> {
  return SUMMARY;
}
