"use client";

import { useState } from "react";
import { Button, notify } from "@/components/df";
import { MarketFields, type MarketValue } from "@/components/onboarding/market";
import { ApiError, onboardingApi } from "@/lib/onboarding/client";

/** Ajustes › Dónde vendes: país, moneda e idioma con que la IA escribe y calcula. */
export function MarketSettings({ initial, confirmed }: { initial: MarketValue; confirmed: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [value, setValue] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof MarketValue, string>>>();
  const [saving, setSaving] = useState(false);
  const dirty = value.countryCode !== saved.countryCode || value.currency !== saved.currency || value.language !== saved.language;

  const save = async () => {
    setSaving(true);
    setErrors(undefined);
    try {
      await onboardingApi.saveMarket(value);
      setSaved(value);
      notify("Mercado guardado. Lo nuevo que genere la IA usará estos datos.");
    } catch (e) {
      if (e instanceof ApiError && e.field) setErrors({ [e.field]: e.message });
      else notify(e instanceof ApiError ? e.message : "No pudimos guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <MarketFields value={value} onChange={setValue} errors={errors} />
      {dirty || !confirmed ? (
        <div className="flex justify-end">
          <Button variant="primary" icon="check" loading={saving} onClick={save}>
            {confirmed ? "Guardar cambios" : "Confirmar mercado"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
