import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button, MetricGrid, VerdictNote } from "@/components/df";
import { CampaignActions } from "@/components/screens/actions";
import { PageHeader, SectionTitle } from "@/components/shell/page-header";
import { StickyActions } from "@/components/shell/sticky-actions";
import { getCampaign, getCampaigns } from "@/lib/data/campaigns";
import { getAssumptions } from "@/lib/data/settings";
import { count, money } from "@/lib/format";

export async function generateStaticParams() {
  return (await getCampaigns()).map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const campaign = await getCampaign((await params).id);
  return { title: campaign?.name ?? "Campaña" };
}

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [campaign, assumptions] = await Promise.all([getCampaign(id), getAssumptions()]);
  if (!campaign) notFound();

  const actions =
    campaign.verdict === "subir" || campaign.verdict === "apagar" ? (
      <CampaignActions verdict={campaign.verdict} nextBudget={campaign.nextBudget} name={campaign.name} />
    ) : (
      <Button href={`/products/${campaign.productId}`} iconEnd="chevron-right">
        Ver producto
      </Button>
    );

  return (
    <>
      <PageHeader
        back="Campañas"
        backHref="/campaigns"
        title={campaign.name}
        subtitle={`${campaign.paused ? "Pausada" : "Activa"} · ${campaign.meta}`}
      />
      <div className="flex flex-col gap-4 px-4 py-2 lg:max-w-content lg:px-8 lg:py-6">
        <VerdictNote verdict={campaign.verdict} reason={campaign.reason} title={campaign.verdictTitle} />
        <MetricGrid metrics={campaign.metrics} wide />

        <section aria-labelledby="presupuesto" className="rounded-lg border bg-card p-4">
          <h2 id="presupuesto" className="text-heading">Presupuesto diario</h2>
          <p className="mt-1 text-metric">{money(campaign.budget)}</p>
          <p className="text-caption text-muted-foreground">
            Tu límite de costo por venta es {money(assumptions.maxCpa)}. Cámbialo en Ajustes.
          </p>
        </section>

        <section aria-labelledby="historial">
          <SectionTitle className="px-0">
            <span id="historial">Últimos días</span>
          </SectionTitle>
          <div className="overflow-hidden rounded-lg border bg-card">
            <table className="w-full text-left text-small">
              <caption className="sr-only">Gasto, ventas confirmadas y costo por venta por día</caption>
              <thead className="text-caption text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 font-normal">Día</th>
                  <th scope="col" className="px-4 py-2 text-right font-normal">Gasto</th>
                  <th scope="col" className="px-4 py-2 text-right font-normal">Ventas</th>
                  <th scope="col" className="px-4 py-2 text-right font-normal">Costo por venta</th>
                </tr>
              </thead>
              <tbody>
                {campaign.history.map((h) => (
                  <tr key={h.day} className="border-t">
                    <th scope="row" className="px-4 py-2 font-medium">{h.day}</th>
                    <td className="px-4 py-2 text-right">{money(h.spend)}</td>
                    <td className="px-4 py-2 text-right">{count(h.sales)}</td>
                    <td
                      className={
                        h.cpa == null
                          ? "px-4 py-2 text-right text-muted-foreground"
                          : h.cpa > assumptions.maxCpa
                            ? "px-4 py-2 text-right text-destructive"
                            : "px-4 py-2 text-right"
                      }
                    >
                      {h.cpa == null ? "—" : money(h.cpa)}
                      {h.cpa != null && h.cpa > assumptions.maxCpa ? <span className="sr-only"> (sobre tu límite)</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <StickyActions className="max-lg:[&>*]:flex-1">{actions}</StickyActions>
      </div>
    </>
  );
}
