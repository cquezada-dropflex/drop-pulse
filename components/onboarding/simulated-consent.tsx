import { Button, Icon, PermissionList, ProviderMark, type Permission, type Provider } from "@/components/df";

/**
 * Pantalla de autorización SIMULADA. En producción, en este punto el comerciante está en la
 * página oficial del proveedor (Shopify o Facebook), no en DropFlex. Aquí no se usa ninguna marca
 * de terceros: se dice claramente que es una maqueta.
 */
export function SimulatedConsent({
  provider,
  name,
  account,
  permissions,
  approveHref,
  cancelHref,
}: {
  provider: Provider;
  name: string;
  account?: string;
  permissions: Permission[];
  approveHref: string;
  cancelHref: string;
}) {
  return (
    <main id="contenido" className="flex min-h-svh flex-col items-center px-4 py-8 md:justify-center">
      <div className="flex w-full max-w-md flex-col gap-5">
        <p role="note" className="flex items-start gap-2 rounded-md bg-warning-soft p-3 text-label font-normal text-warning">
          <Icon name="alert" size="sm" strokeWidth={2} className="mt-px" />
          Simulación de la maqueta. En producción aquí verás la página oficial de {name} para autorizar DropFlex.
        </p>
        <div className="flex items-center gap-3">
          <ProviderMark provider={provider} size="lg" />
          <div>
            <h1 className="text-title">Autorizar DropFlex en {name}</h1>
            {account ? <p className="text-body text-muted-foreground">{account}</p> : null}
          </div>
        </div>
        <PermissionList title="DropFlex pide permiso para" items={permissions} />
        <div className="flex flex-col gap-2">
          <Button href={approveHref} variant="primary" size="lg" block icon="check">
            Autorizar
          </Button>
          <Button href={cancelHref} variant="ghost" block>
            Cancelar
          </Button>
        </div>
      </div>
    </main>
  );
}
