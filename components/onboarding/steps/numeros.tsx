"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Icon, notify } from "@/components/df";
import { StickyActions } from "@/components/shell/sticky-actions";
import { amount, currencySymbol, fractionDigits, money, parseAmount } from "@/lib/format";
import { ApiError, onboardingApi } from "@/lib/onboarding/client";
import type { Numbers } from "@/lib/onboarding/types";
import { useOnboarding } from "../provider";
import { OnboardingScreen } from "../screen";

/** Paso 3: los números vienen llenos; “Usar sugeridos” permite saltarlo. “Empezar a generar” arranca la IA. */
export function NumerosStep({
  suggested,
  currency,
  example,
  deliveredFromOrders = false,
}: {
  suggested: Numbers;
  /** Moneda de la tienda (ISO 4217). */
  currency: string;
  /** La entrega se calculó con los pedidos de Shopify (destello). Aún no (spec D7). */
  deliveredFromOrders?: boolean;
  /** Producto del ejemplo (el primero elegido). */
  example: { name: string; price: number; cost: number };
}) {
  const router = useRouter();
  const { snapshot, setSnapshot } = useOnboarding();
  const start = snapshot.numbers ?? suggested;
  const [delivered, setDelivered] = useState(String(start.deliveredOf10));
  const [shipping, setShipping] = useState(amount(start.shipping, currency));
  const [cpa, setCpa] = useState(amount(start.maxCpa, currency));
  const [errors, setErrors] = useState<Partial<Record<keyof Numbers, string>>>({});
  const [saving, setSaving] = useState<"save" | "skip" | null>(null);

  const n: Numbers = { deliveredOf10: Number(delivered), shipping: parseAmount(shipping, currency), maxCpa: parseAmount(cpa, currency) };
  const profit = example.price - example.cost - (n.shipping || 0) - (n.maxCpa || 0);

  const submit = async (useSuggested: boolean) => {
    setSaving(useSuggested ? "skip" : "save");
    setErrors({});
    try {
      const { snapshot: next } = await onboardingApi.saveNumbers(useSuggested ? { sugeridos: true } : n);
      setSnapshot(next);
      router.push("/onboarding/meta");
    } catch (e) {
      if (e instanceof ApiError && e.field) setErrors({ [e.field]: e.message });
      else notify(e instanceof Error ? e.message : "No pudimos guardar tus números.");
      setSaving(null);
    }
  };
  // En CLP se reformatea al escribir ($24.990); con decimales solo se filtran caracteres, para no pisar la coma.
  const moneyInput = (set: (v: string) => void) => (v: string) => {
    if (fractionDigits(currency)) return set(v.replace(/[^\d.,]/g, ""));
    const x = parseAmount(v, currency);
    set(Number.isNaN(x) ? "" : amount(x, currency));
  };
  const symbol = currencySymbol(currency);
  const ai = deliveredFromOrders && start.deliveredOf10 === Number(delivered);

  return (
    <OnboardingScreen
      header={{
        step: 3,
        total: 4,
        optionalSteps: [4],
        back: "Volver",
        backHref: "/onboarding/products",
        skip: "Usar sugeridos",
        onSkip: () => submit(true),
      }}
      title="Tus números"
      desc="Con esto calculamos cuánto ganas por venta y cuándo apagar una campaña. Puedes cambiarlos después."
      bodyClassName="gap-4"
      footer={
        <StickyActions variant="bar" summary="Puedes cambiarlos después en Ajustes.">
          <Button variant="ghost" loading={saving === "skip"} onClick={() => submit(true)} className="max-lg:hidden">
            Usar sugeridos
          </Button>
          <Button
            variant="primary"
            size="lg"
            iconEnd="chevron-right"
            loading={saving === "save"}
            onClick={() => submit(false)}
            className="lg:h-control lg:text-row"
          >
            Empezar a generar
          </Button>
        </StickyActions>
      }
    >
      <form
        className="flex flex-col gap-4 lg:max-w-content"
        onSubmit={(e) => {
          e.preventDefault();
          submit(false);
        }}
      >
        <Field
          label="De cada 10 pedidos, ¿cuántos se entregan?"
          value={delivered}
          onValueChange={(v) => setDelivered(v.replace(/[^\d]/g, "").slice(0, 2))}
          suffix="de 10"
          inputMode="numeric"
          ai={ai}
          hint={ai ? "Lo calculamos con tus pedidos de Shopify" : "Lo usamos para calcular cuánto ganas por venta entregada"}
          error={errors.deliveredOf10}
        />
        <div className="grid grid-cols-2 items-start gap-3">
          <Field label="Envío por pedido" prefix={symbol} value={shipping} onValueChange={moneyInput(setShipping)} error={errors.shipping} />
          <Field label="Máximo por venta en anuncios" prefix={symbol} value={cpa} onValueChange={moneyInput(setCpa)} hint="Tu CPA límite" error={errors.maxCpa} />
        </div>
      </form>
      <div className="flex items-start gap-3 rounded-lg border bg-card p-4 lg:max-w-content">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-foreground">
          <Icon name="tag" />
        </span>
        <div aria-live="polite">
          <p className="text-row font-semibold">Ejemplo con tu {example.name}</p>
          <p className="mt-1 text-label font-normal text-muted-foreground">
            A {money(example.price, currency)}{" "}
            {profit >= 0 ? (
              <>
                ganarías <b className="font-semibold text-success">{money(profit, currency)}</b> por venta entregada
              </>
            ) : (
              <>
                perderías <b className="font-semibold text-destructive">{money(profit, currency)}</b> por venta entregada
              </>
            )}
            , si el anuncio cuesta hasta {money(n.maxCpa || 0, currency)}.
          </p>
        </div>
      </div>
    </OnboardingScreen>
  );
}
