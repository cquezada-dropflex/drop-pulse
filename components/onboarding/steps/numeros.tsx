"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Icon, notify } from "@/components/df";
import { StickyActions } from "@/components/shell/sticky-actions";
import { count, money, parseMoney } from "@/lib/format";
import { ApiError, onboardingApi } from "@/lib/onboarding/client";
import type { Numbers } from "@/lib/onboarding/types";
import { useOnboarding } from "../provider";
import { OnboardingScreen } from "../screen";

/** Paso 3: los números vienen llenos; “Usar sugeridos” permite saltarlo. “Empezar a generar” arranca la IA. */
export function NumerosStep({
  suggested,
  example,
}: {
  suggested: Numbers;
  /** Producto del ejemplo (el primero elegido). */
  example: { name: string; price: number; cost: number };
}) {
  const router = useRouter();
  const { snapshot, setSnapshot } = useOnboarding();
  const start = snapshot.numbers ?? suggested;
  const [delivered, setDelivered] = useState(String(start.deliveredOf10));
  const [shipping, setShipping] = useState(count(start.shipping));
  const [cpa, setCpa] = useState(count(start.maxCpa));
  const [errors, setErrors] = useState<Partial<Record<keyof Numbers, string>>>({});
  const [saving, setSaving] = useState<"save" | "skip" | null>(null);

  const n: Numbers = { deliveredOf10: Number(delivered), shipping: parseMoney(shipping), maxCpa: parseMoney(cpa) };
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
  const moneyInput = (set: (v: string) => void) => (v: string) => {
    const x = parseMoney(v);
    set(Number.isNaN(x) ? "" : count(x));
  };

  return (
    <OnboardingScreen
      header={{
        step: 3,
        total: 4,
        optionalSteps: [4],
        back: "Volver",
        backHref: "/onboarding/productos",
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
          ai={start.deliveredOf10 === Number(delivered)}
          hint={start.deliveredOf10 === Number(delivered) ? "Lo calculamos con tus pedidos de Shopify" : "Lo usamos para calcular cuánto ganas por venta entregada"}
          error={errors.deliveredOf10}
        />
        <div className="grid grid-cols-2 items-start gap-3">
          <Field label="Envío por pedido" prefix="$" value={shipping} onValueChange={moneyInput(setShipping)} error={errors.shipping} />
          <Field label="Máximo por venta en anuncios" prefix="$" value={cpa} onValueChange={moneyInput(setCpa)} hint="Tu CPA límite" error={errors.maxCpa} />
        </div>
      </form>
      <div className="flex items-start gap-3 rounded-lg border bg-card p-4 lg:max-w-content">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-foreground">
          <Icon name="tag" />
        </span>
        <div aria-live="polite">
          <p className="text-row font-semibold">Ejemplo con tu {example.name}</p>
          <p className="mt-1 text-label font-normal text-muted-foreground">
            A {money(example.price)}{" "}
            {profit >= 0 ? (
              <>
                ganarías <b className="font-semibold text-success">{money(profit)}</b> por venta entregada
              </>
            ) : (
              <>
                perderías <b className="font-semibold text-destructive">{money(profit)}</b> por venta entregada
              </>
            )}
            , si el anuncio cuesta hasta {money(n.maxCpa || 0)}.
          </p>
        </div>
      </div>
    </OnboardingScreen>
  );
}
