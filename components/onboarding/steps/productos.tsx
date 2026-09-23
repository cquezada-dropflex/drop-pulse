"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Icon, PickRow, SegmentedControl, notify } from "@/components/df";
import { EmptyState } from "@/components/shell/page-header";
import { StickyActions } from "@/components/shell/sticky-actions";
import { count, money } from "@/lib/format";
import { ApiError, onboardingApi } from "@/lib/onboarding/client";
import type { CatalogProduct } from "@/lib/onboarding/types";
import { useOnboarding } from "../provider";
import { OnboardingScreen } from "../screen";

interface Lists {
  recommended: CatalogProduct[];
  all: CatalogProduct[];
  total: number;
  defaultSelection: string[];
}

const meta = (p: CatalogProduct, first: boolean, currency: string) =>
  `${money(p.price, currency)} · ${p.sales30 ? `${count(p.sales30)} ventas${first ? " en 30 días" : ""}` : "Sin ventas en 30 días"}`;

/** Paso 2: elegir con qué empezar. Los 3 recomendados vienen marcados: el camino rápido es un toque. */
export function ProductosStep({ initial }: { initial: Lists }) {
  const router = useRouter();
  const { snapshot, setSnapshot } = useOnboarding();
  const [lists, setLists] = useState(initial);
  const [view, setView] = useState<"rec" | "all">("rec");
  const [selected, setSelected] = useState<string[]>(snapshot.selected.length ? snapshot.selected : initial.defaultSelection);
  const [saving, setSaving] = useState(false);
  const limit = snapshot.planLimit;
  const imported = snapshot.shop?.imported;

  // La importación no bloquea: la lista crece mientras llegan productos.
  useEffect(() => {
    if (snapshot.shop?.status !== "importing") return;
    fetch("/api/onboarding/shopify/products", { cache: "no-store" })
      .then((r) => r.json())
      .then((l: Lists) => setLists(l))
      .catch(() => {});
  }, [imported, snapshot.shop?.status]);

  const rows = view === "rec" ? lists.recommended : lists.all;
  const full = selected.length >= limit;
  const toggle = (id: string, on: boolean) => setSelected((s) => (on ? (s.includes(id) ? s : [...s, id]) : s.filter((x) => x !== id)));

  const submit = async () => {
    setSaving(true);
    try {
      const { snapshot: next } = await onboardingApi.saveProducts(selected);
      setSnapshot(next);
      router.push("/onboarding/numbers");
    } catch (e) {
      notify(e instanceof ApiError ? e.message : "No pudimos guardar tu selección. Intenta de nuevo.");
      setSaving(false);
    }
  };

  const filter = (
    <SegmentedControl
      block
      label="Productos"
      value={view}
      onChange={(v) => setView(v as "rec" | "all")}
      options={[
        { value: "rec", label: "Recomendados", count: lists.recommended.length },
        { value: "all", label: "Todos", count: lists.total },
      ]}
      className="lg:inline-flex lg:w-auto"
    />
  );
  const label = selected.length ? `Mejorar ${selected.length} ${selected.length === 1 ? "producto" : "productos"}` : "Elige al menos 1 producto";

  return (
    <OnboardingScreen
      header={{ step: 2, total: 4, optionalSteps: [4], back: "Volver", backHref: "/onboarding/shopify" }}
      title="Elige con qué empezar"
      desc="Te recomendamos los que más venden y más pueden mejorar."
      deskAside={<div className="hidden lg:block">{filter}</div>}
      bodyClassName="gap-3 px-0 pt-0 lg:gap-4"
      footer={
        <StickyActions
          variant="bar"
          stack
          summary={`${count(selected.length)} ${selected.length === 1 ? "elegido" : "elegidos"} · tu plan incluye ${limit} al mes`}
          mobileNote={`Tu plan incluye ${limit} productos al mes.`}
        >
          <Button href="/onboarding/shopify" variant="ghost" className="max-lg:hidden">
            Volver
          </Button>
          <Button
            variant="primary"
            size="lg"
            block
            iconEnd="chevron-right"
            loading={saving}
            disabled={!selected.length}
            onClick={submit}
            className="lg:h-control lg:w-auto lg:text-row"
          >
            {label}
          </Button>
        </StickyActions>
      }
    >
      <div className="px-4 lg:hidden">{filter}</div>
      {snapshot.shop?.status === "importing" && view === "all" ? (
        <p role="status" className="flex items-center gap-1.5 px-4 text-caption text-muted-foreground lg:px-0">
          <Icon name="loader" size="sm" className="animate-df-spin" />
          Importando: {count(snapshot.shop.imported)} de {count(snapshot.shop.total)} productos
        </p>
      ) : null}
      {rows.length ? (
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="sr-only">
            {view === "rec" ? "Productos recomendados" : "Todos tus productos"}. {full ? `Llegaste al máximo de ${limit}.` : ""}
          </legend>
          <div className="mx-4 overflow-hidden rounded-lg border bg-card lg:mx-0 lg:max-w-content">
            {rows.map((p, i) => {
              const checked = selected.includes(p.id);
              return (
                <PickRow
                  key={p.id}
                  name={p.name}
                  image={p.image}
                  meta={meta(p, i === 0, snapshot.shop?.currency || "CLP")}
                  issues={p.issues.slice(0, 2)}
                  score={p.score}
                  checked={checked}
                  disabled={!checked && full}
                  onCheckedChange={(on) => toggle(p.id, on)}
                />
              );
            })}
          </div>
        </fieldset>
      ) : (
        <EmptyState
          icon={<Icon name="box" />}
          title="Tu tienda no tiene productos aún"
          action={
            <Button href="/onboarding/shopify" iconEnd="chevron-right">
              Revisar la conexión
            </Button>
          }
        >
          Agrega productos en Shopify o impórtalos desde tu proveedor; aparecerán aquí en minutos.
        </EmptyState>
      )}
      {full ? (
        <p className="px-4 text-caption text-muted-foreground lg:px-0">
          Llegaste a los {limit} productos de tu plan. Quita uno para elegir otro.
        </p>
      ) : null}
    </OnboardingScreen>
  );
}
