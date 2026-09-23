import type { Metadata } from "next";
import { Suspense } from "react";
import { Connections } from "@/components/onboarding/connections";
import { SetupSlot } from "@/components/onboarding/setup-slot";
import { Skeleton } from "@/components/shell/skeletons";
import { LogoutButton } from "@/components/logout-button";
import { AssumptionsForm } from "@/components/screens/assumptions-form";
import { PageHeader } from "@/components/shell/page-header";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { getAssumptions } from "@/lib/data/settings";

export const metadata: Metadata = { title: "Ajustes" };

function Section({ id, title, children, description }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-lg border bg-card p-4">
      <h2 id={id} className="text-heading">{title}</h2>
      {description ? <p className="mt-0.5 text-label font-normal text-muted-foreground">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function AjustesPage() {
  const assumptions = await getAssumptions();
  return (
    <>
      <PageHeader large title="Ajustes" subtitle="Supuestos, tienda y cuenta" back="Hoy" backHref="/today" />
      <div className="flex flex-col gap-4 px-4 pb-6 lg:max-w-content lg:px-8 lg:py-6">
        <Section
          id="supuestos"
          title="Supuestos"
          description="Hacen honestas las cifras de ganancia y los veredictos de campañas."
        >
          <AssumptionsForm initial={assumptions} />
        </Section>
        <Section id="conexiones" title="Conexiones" description="Tu tienda Shopify y tu cuenta de Meta Ads.">
          <Suspense fallback={<Skeleton className="h-40" />}>
            <div className="flex flex-col gap-3">
              <SetupSlot where="ajustes" />
              <Connections />
            </div>
          </Suspense>
        </Section>
        <Section id="apariencia" title="Apariencia" description="Claro, oscuro o el mismo del teléfono.">
          <div className="flex items-center justify-between gap-3">
            <span className="text-body">Tema</span>
            <ThemeSwitcher />
          </div>
        </Section>
        <Section id="cuenta" title="Cuenta">
          <LogoutButton />
        </Section>
      </div>
    </>
  );
}
