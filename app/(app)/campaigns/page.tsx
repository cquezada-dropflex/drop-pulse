import type { Metadata } from "next";
import { Suspense } from "react";
import { CampaignCard, Icon } from "@/components/df";
import { CampaignActions, CampaignMenu } from "@/components/screens/actions";
import { UrlFilter } from "@/components/screens/filters";
import { EmptyState, PageHeader } from "@/components/shell/page-header";
import { Skeleton } from "@/components/shell/skeletons";
import { getCampaignSummary, getCampaigns } from "@/lib/data/campaigns";
import { money } from "@/lib/format";

export const metadata: Metadata = { title: "Campañas" };

const PERIODS = [
  { value: "today", label: "Hoy" },
  { value: "7", label: "7 días" },
  { value: "30", label: "30 días" },
];

async function Period({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period = "7" } = await searchParams;
  return <UrlFilter param="period" value={period} options={PERIODS} label="Periodo" />;
}

async function CampaignList({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period = "7" } = await searchParams;
  if (period !== "7") {
    return (
      <EmptyState icon={<Icon name="clock" />} title="Sin cifras para este periodo">
        En esta versión de prueba solo hay datos de los últimos 7 días. Elige “7 días” para verlos.
      </EmptyState>
    );
  }
  const campaigns = await getCampaigns();
  if (!campaigns.length) {
    return (
      <EmptyState icon={<Icon name="megaphone" />} title="Aún no tienes campañas">
        Cuando publiques un producto, puedes crear sus anuncios desde su ruta.
      </EmptyState>
    );
  }
  return (
    <ul className="grid gap-3 px-4 md:grid-cols-2 lg:gap-4 lg:px-0">
      {campaigns.map((c) => (
        <li key={c.id}>
          <CampaignCard
            name={c.name}
            image={c.image}
            verdict={c.verdict}
            reason={c.reason}
            meta={c.meta}
            paused={c.paused}
            metrics={c.metrics}
            wide
            href={`/campaigns/${c.id}`}
            menu={<CampaignMenu name={c.name} href={`/campaigns/${c.id}`} paused={c.paused} />}
            actions={
              c.verdict === "subir" || c.verdict === "apagar"
                ? [<CampaignActions key="a" verdict={c.verdict} nextBudget={c.nextBudget} name={c.name} detailHref={`/campaigns/${c.id}`} />]
                : null
            }
            className="h-full"
          />
        </li>
      ))}
    </ul>
  );
}

export default async function CampanasPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const summary = await getCampaignSummary();
  const subtitle = `Últimos 7 días · gasto ${money(summary.spend)}`;
  return (
    <>
      <PageHeader
        large
        title="Campañas"
        subtitle={subtitle}
        desktopSubtitle={`${subtitle} · ${summary.confirmedSales} ventas confirmadas`}
        desktopActions={
          <Suspense fallback={<Skeleton className="h-9.5 w-60" />}>
            <Period searchParams={searchParams} />
          </Suspense>
        }
      />
      <div className="pb-6 lg:px-8 lg:py-6">
        <Suspense
          fallback={
            <div className="grid gap-3 px-4 md:grid-cols-2 lg:px-0">
              <Skeleton className="h-80" />
              <Skeleton className="h-80" />
            </div>
          }
        >
          <CampaignList searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
