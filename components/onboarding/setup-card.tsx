"use client";

import { useRouter } from "next/navigation";
import { Button, SetupChecklist, notify } from "@/components/df";
import { onboardingApi } from "@/lib/onboarding/client";

const ITEMS = [
  { title: "Conectar Shopify", done: true },
  { title: "Elegir productos", done: true },
  { title: "Definir tus números", done: true },
  { title: "Conectar Meta Ads", desc: "Para lanzar y vigilar anuncios", action: "Conectar", actionHref: "/onboarding/meta" },
];

/** En Hoy se oculta con la x; en Ajustes reaparece con la opción de volver a mostrarla en Hoy. */
export function SetupCard({ where }: { where: "hoy" | "ajustes" }) {
  const router = useRouter();
  const toggle = async (hidden: boolean) => {
    await onboardingApi.setChecklistHidden(hidden);
    notify(hidden ? "Lista oculta. La encuentras en Ajustes." : "La lista vuelve a aparecer en Hoy.");
    router.refresh();
  };
  if (where === "hoy") return <SetupChecklist items={ITEMS} onHide={() => toggle(true)} />;
  return (
    <div className="flex flex-col gap-2">
      <SetupChecklist items={ITEMS} />
      <div className="flex justify-end">
        <Button size="sm" variant="ghost" onClick={() => toggle(false)}>
          Mostrar en Hoy
        </Button>
      </div>
    </div>
  );
}
