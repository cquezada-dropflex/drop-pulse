import { Button, ConnectionCard } from "@/components/df";
import { count } from "@/lib/format";
import { readOnboarding } from "@/lib/onboarding/store";
import { snapshot } from "@/lib/onboarding/service";
import { DisconnectButton } from "./disconnect-button";

/** Ajustes › Conexiones: los mismos estados de ConnectionCard que en el onboarding, con datos reales. */
export async function Connections() {
  const { state } = await readOnboarding();
  const s = snapshot(state, Date.now());
  const shop = s.shop;
  const meta = s.meta;
  return (
    <div className="flex flex-col gap-2">
      {!shop ? (
        <ConnectionCard
          provider="shopify"
          state="idle"
          account="Conecta tu tienda para traer tus productos"
          actions={<Button size="sm" variant="primary" href="/onboarding/shopify">Conectar</Button>}
        />
      ) : shop.status === "error" || shop.status === "connecting" ? (
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
          progress={shop.status === "importing" ? shop.imported / Math.max(1, shop.total) : undefined}
          detail={shop.status === "importing" ? `${count(shop.imported)} de ${count(shop.total)} productos importados` : undefined}
          facts={shop.status === "connected" ? [["Productos", count(shop.total)], ["Moneda", shop.currency]] : undefined}
          actions={<DisconnectButton provider="shopify" />}
        />
      )}
      {meta?.status === "connected" ? (
        <ConnectionCard
          provider="meta"
          state="connected"
          account={[meta.account, meta.pixel].filter(Boolean).join(" · ")}
          actions={<DisconnectButton provider="meta" />}
        />
      ) : meta?.status === "action" ? (
        <ConnectionCard
          provider="meta"
          state="action"
          account="Business Manager autorizado"
          detail="Elige cuenta publicitaria, página y píxel para terminar."
          actions={<Button size="sm" variant="primary" href="/onboarding/meta/accounts">Elegir</Button>}
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
