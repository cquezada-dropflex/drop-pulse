import { Button, ConnectionCard } from "@/components/df";
import { count } from "@/lib/format";
import { readOnboarding } from "@/lib/onboarding/store";
import { snapshot } from "@/lib/onboarding/service";

/** Ajustes › Conexiones: los mismos estados de ConnectionCard que en el onboarding. */
export async function Connections({ fallbackStore, fallbackMeta }: { fallbackStore: string; fallbackMeta: string }) {
  const s = snapshot(await readOnboarding(), Date.now());
  // Sin onboarding (datos de ejemplo de la app): ambas cuentas aparecen conectadas.
  if (!s.shop) {
    return (
      <div className="flex flex-col gap-2">
        <ConnectionCard provider="shopify" state="connected" account={fallbackStore} />
        <ConnectionCard provider="meta" state="connected" account={fallbackMeta} />
      </div>
    );
  }
  const shop = s.shop;
  const meta = s.meta;
  return (
    <div className="flex flex-col gap-2">
      {shop.status === "error" || shop.status === "connecting" ? (
        <ConnectionCard
          provider="shopify"
          state="error"
          account={shop.domain}
          detail={shop.error ?? "La conexión no terminó. Vuelve a conectar tu tienda."}
          actions={<Button size="sm" href="/onboarding/shopify">Volver a conectar</Button>}
        />
      ) : (
        <ConnectionCard
          provider="shopify"
          state={shop.status === "importing" ? "importing" : "connected"}
          account={shop.domain}
          progress={shop.status === "importing" ? shop.imported / shop.total : undefined}
          detail={shop.status === "importing" ? `${count(shop.imported)} de ${count(shop.total)} productos importados` : undefined}
          facts={shop.status === "connected" ? [["Productos", count(shop.total)], ["Moneda", shop.currency]] : undefined}
        />
      )}
      {meta?.status === "connected" ? (
        <ConnectionCard provider="meta" state="connected" account={[meta.account, meta.pixel].filter(Boolean).join(" · ")} />
      ) : meta?.status === "action" ? (
        <ConnectionCard
          provider="meta"
          state="action"
          account="Business Manager: Mi Tienda"
          detail="Elige cuenta publicitaria, página y píxel para terminar."
          actions={<Button size="sm" variant="primary" href="/onboarding/meta/cuentas">Elegir</Button>}
        />
      ) : meta?.status === "error" ? (
        <ConnectionCard
          provider="meta"
          state="error"
          detail={meta.error}
          actions={<Button size="sm" href="/onboarding/meta">Volver a conectar</Button>}
        />
      ) : (
        <ConnectionCard
          provider="meta"
          state="later"
          account="Conéctala cuando quieras anunciar"
          actions={<Button size="sm" href="/onboarding/meta">Conectar</Button>}
        />
      )}
    </div>
  );
}
