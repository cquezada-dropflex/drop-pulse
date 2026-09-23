import type { Metadata } from "next";
import { Icon } from "@/components/df";
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
      <PageHeader large title="Ajustes" subtitle="Supuestos, tienda y cuenta" back="Hoy" backHref="/hoy" />
      <div className="flex flex-col gap-4 px-4 pb-6 lg:max-w-content lg:px-8 lg:py-6">
        <Section
          id="supuestos"
          title="Supuestos"
          description="Hacen honestas las cifras de ganancia y los veredictos de campañas."
        >
          <AssumptionsForm initial={assumptions} />
        </Section>
        <Section id="cuentas" title="Tienda y cuentas">
          <ul className="flex flex-col">
            {[
              ["store", "Tienda", assumptions.store],
              ["megaphone", "Anuncios", assumptions.metaAccount],
            ].map(([icon, label, value]) => (
              <li key={label} className="flex items-center gap-3 py-2 not-first:border-t">
                <Icon name={icon as "store" | "megaphone"} className="text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-row">{label}</p>
                  <p className="truncate text-caption text-muted-foreground">{value}</p>
                </div>
                <span className="flex items-center gap-1 text-caption text-success">
                  <Icon name="check-circle" size="sm" strokeWidth={2} />
                  Conectada
                </span>
              </li>
            ))}
          </ul>
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
