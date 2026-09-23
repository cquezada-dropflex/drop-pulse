"use client";

import { useState } from "react";
import { Button, Field, OfferPreview, PriceBreakdown } from "@/components/df";
import { StickyActions } from "@/components/shell/sticky-actions";
import { count, parseMoney } from "@/lib/format";
import type { Pricing } from "@/lib/types";

/** Precio y oferta: la ganancia se recalcula mientras escribes. */
export function PriceEditor({
  pricing,
  title,
  image,
  store,
  onApprove,
}: {
  pricing: Pricing;
  title: string;
  image?: string;
  store?: string;
  onApprove?: (price: number, compareAt?: number) => void;
}) {
  const [priceText, setPriceText] = useState(count(pricing.price));
  const [compareText, setCompareText] = useState(pricing.compareAt ? count(pricing.compareAt) : "");

  const price = parseMoney(priceText);
  const compareAt = parseMoney(compareText);
  const priceError = Number.isNaN(price) || price <= 0 ? "Escribe el precio de venta" : undefined;
  const compareError =
    !Number.isNaN(compareAt) && !priceError && compareAt <= price ? "Debe ser mayor que el precio de venta" : undefined;
  const livePrice = priceError ? 0 : price;

  // Punto de miles mientras escribe: 24990 → 24.990.
  const reformat = (setter: (v: string) => void) => (v: string) => {
    const n = parseMoney(v);
    setter(Number.isNaN(n) ? "" : count(n));
  };

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Precio de venta" prefix="$" value={priceText} onValueChange={reformat(setPriceText)} error={priceError} />
          <Field label="Precio tachado" prefix="$" value={compareText} onValueChange={reformat(setCompareText)} error={compareError} />
        </div>
        <div className="rounded-lg border bg-card p-4">
          <PriceBreakdown price={livePrice} parts={pricing.costs} note={pricing.note} />
        </div>
      </div>
      <OfferPreview
        title={title}
        price={livePrice}
        compareAt={Number.isNaN(compareAt) || compareError ? undefined : compareAt}
        image={image}
        store={store}
      />
      <StickyActions className="lg:col-span-2">
        <Button
          variant="primary"
          size="lg"
          icon="check"
          disabled={Boolean(priceError || compareError)}
          onClick={() => onApprove?.(price, Number.isNaN(compareAt) ? undefined : compareAt)}
        >
          Aprobar precio
        </Button>
      </StickyActions>
    </div>
  );
}
