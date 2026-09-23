"use client";

import { useState } from "react";
import { Button, Field, notify } from "@/components/df";
import { count, parseMoney } from "@/lib/format";
import type { Assumptions } from "@/lib/types";

/** Supuestos que usan el precio y las campañas: tasa de entrega y CPA máximo. */
export function AssumptionsForm({ initial }: { initial: Assumptions }) {
  const [rate, setRate] = useState(String(initial.deliveryRate));
  const [cpa, setCpa] = useState(count(initial.maxCpa));
  const rateN = Number(rate);
  const rateError = !rate || Number.isNaN(rateN) || rateN < 1 || rateN > 100 ? "Escribe un porcentaje entre 1 y 100" : undefined;
  const cpaN = parseMoney(cpa);
  const cpaError = Number.isNaN(cpaN) || cpaN <= 0 ? "Escribe cuánto puedes pagar como máximo por venta" : undefined;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!rateError && !cpaError) notify("Supuestos guardados. Las cifras se recalculan con estos valores.");
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Tasa de entrega"
          suffix="%"
          inputMode="numeric"
          value={rate}
          onValueChange={(v) => setRate(v.replace(/[^\d]/g, ""))}
          error={rateError}
          hint={`De cada 100 pedidos, cuántos se entregan y pagan. Hoy: ${rateN || 0} de 100.`}
        />
        <Field
          label="Costo máximo por venta (CPA)"
          prefix="$"
          value={cpa}
          onValueChange={(v) => {
            const n = parseMoney(v);
            setCpa(Number.isNaN(n) ? "" : count(n));
          }}
          error={cpaError}
          hint="Con este límite se juzga cada campaña."
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="primary" icon="check" disabled={Boolean(rateError || cpaError)}>
          Guardar supuestos
        </Button>
      </div>
    </form>
  );
}
