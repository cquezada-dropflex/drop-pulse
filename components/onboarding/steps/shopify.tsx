"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button, ConnectionCard, Field, PermissionList } from "@/components/df";
import { StickyActions } from "@/components/shell/sticky-actions";
import { count } from "@/lib/format";
import { ApiError, onboardingApi } from "@/lib/onboarding/client";
import { PERMS_SHOPIFY } from "../permissions";
import { useOnboarding } from "../provider";
import { OnboardingScreen } from "../screen";

const HEADER = { step: 1, total: 4, optionalSteps: [4] };

/** Paso 1 (obligatorio): conectar Shopify. De aquí salen los productos. */
export function ShopifyStep() {
  const { snapshot } = useOnboarding();
  const shop = snapshot.shop;
  const connected = shop && (shop.status === "importing" || shop.status === "connected");
  return connected ? <ShopConnected /> : <ShopForm />;
}

function ShopForm() {
  const { snapshot } = useOnboarding();
  const shop = snapshot.shop;
  const [value, setValue] = useState(shop?.domain?.replace(/\.myshopify\.com$/, "") ?? "");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const input = useRef<HTMLDivElement>(null);

  const connect = async (domain = value) => {
    setLoading(true);
    setError(undefined);
    try {
      const { authorizeUrl } = await onboardingApi.connectShopify(domain);
      // Como en el OAuth real: se sale de DropFlex para autorizar y se vuelve por el callback.
      window.location.assign(authorizeUrl);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos conectar tu tienda. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <OnboardingScreen
      header={HEADER}
      title="Conecta tu tienda Shopify"
      desc="De aquí sacamos tus productos para mejorarlos. Te llevaremos a Shopify para que autorices."
      footer={
        <StickyActions variant="bar" summary="Es el único paso obligatorio: sin productos no hay nada que mejorar.">
          <Button variant="primary" size="lg" iconEnd="chevron-right" loading={loading} onClick={() => connect()} className="lg:h-control lg:text-row">
            Conectar con Shopify
          </Button>
        </StickyActions>
      }
    >
      {shop?.status === "error" ? (
        <ConnectionCard
          provider="shopify"
          state="error"
          account={shop.domain}
          detail={shop.error}
          actions={
            <>
              <Button size="sm" onClick={() => input.current?.querySelector("input")?.focus()}>
                Cambiar dirección
              </Button>
              <Button size="sm" variant="ghost" onClick={() => connect(shop.domain ?? value)}>
                Reintentar
              </Button>
            </>
          }
        />
      ) : null}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          connect();
        }}
      >
        <div ref={input}>
          <Field
            label="Dirección de tu tienda"
            value={value}
            onValueChange={(v) => {
              setValue(v);
              setError(undefined);
            }}
            suffix=".myshopify.com"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="mitienda"
            hint="La ves en Shopify › Configuración › Dominios"
            error={error}
          />
        </div>
      </form>
      <PermissionList
        title="Qué hará DropFlex con tu tienda"
        items={PERMS_SHOPIFY}
        note="Puedes desconectar en cualquier momento desde Ajustes o desde tu Shopify."
      />
    </OnboardingScreen>
  );
}

function ShopConnected() {
  const { snapshot } = useOnboarding();
  const router = useRouter();
  const shop = snapshot.shop!;
  const importing = shop.status === "importing";
  return (
    <OnboardingScreen
      header={HEADER}
      title="Tienda conectada"
      desc={importing ? "Estamos trayendo tus productos. Puedes seguir mientras terminamos." : "Trajimos tus productos. Elige con cuáles empezar."}
      footer={
        <StickyActions variant="bar" summary={shop.domain}>
          <Button
            variant="primary"
            size="lg"
            iconEnd="chevron-right"
            onClick={() => router.push("/onboarding/products")}
            className="lg:h-control lg:text-row"
          >
            Elegir productos
          </Button>
        </StickyActions>
      }
    >
      {importing ? (
        <ConnectionCard
          provider="shopify"
          state="importing"
          account={shop.domain}
          progress={shop.imported / shop.total}
          detail={`${count(shop.imported)} de ${count(shop.total)} productos importados`}
        />
      ) : (
        <ConnectionCard
          provider="shopify"
          state="connected"
          account={shop.domain}
          facts={[
            ["Productos", count(shop.total)],
            ["Moneda", shop.currency],
          ]}
        />
      )}
    </OnboardingScreen>
  );
}
