import Image from "next/image";
import { Icon } from "./icon";
import { money } from "@/lib/format";

// EXCEPCIÓN A LA REGLA DE TOKENS (design-system/reference/OfferPreview/README.md):
// es una vista de otra superficie (la tienda), con colores fijos de tienda (blanco y tinta)
// que no cambian con el modo oscuro de DropFlex. Valores de reference/bundle.css → .df-offer*.
const STORE = {
  bg: "#ffffff",
  ink: "#15171c",
  muted: "#5a606b",
  imageBg: "#f3f4f6",
  off: "#12784a",
  onInk: "#ffffff",
  ctaRadius: 8,
} as const;

export interface OfferPreviewProps {
  title: string;
  price: number;
  /** Precio tachado. */
  compareAt?: number;
  image?: string;
  store?: string;
  cta?: string;
}

/** Cómo verá la oferta el comprador en la tienda. Siempre incluye “Paga al recibir”. */
export function OfferPreview({ title, price, compareAt, image, store = "tutienda.cl", cta = "Pedir ahora, pagar al recibir" }: OfferPreviewProps) {
  const off = compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0;
  return (
    <figure aria-label="Vista del comprador">
      <figcaption className="mb-2 flex justify-between text-micro text-muted-foreground">
        <span>Vista del comprador</span>
        <span>{store}</span>
      </figcaption>
      <div className="overflow-hidden rounded-lg border" style={{ background: STORE.bg, color: STORE.ink }}>
        <div className="relative aspect-4/3 w-full" style={{ background: STORE.imageBg }}>
          {image ? <Image src={image} alt="" fill unoptimized sizes="(min-width: 1024px) 360px, 100vw" className="object-cover" /> : null}
        </div>
        <div className="flex flex-col gap-1.5 px-4 pt-3 pb-4">
          <div className="text-row font-semibold">{title}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-title tracking-normal">{money(price)}</span>
            {compareAt ? (
              <span className="text-label font-normal line-through" style={{ color: STORE.muted }}>
                {money(compareAt)}
              </span>
            ) : null}
            {off > 0 ? (
              <span className="text-caption font-semibold" style={{ color: STORE.off }}>
                −{off}%
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1 text-caption" style={{ color: STORE.muted }}>
            <Icon name="truck" size="sm" />
            Paga al recibir · Envío gratis
          </div>
          <div
            className="mt-1.5 grid h-10 place-items-center text-small font-semibold"
            style={{ background: STORE.ink, color: STORE.onInk, borderRadius: STORE.ctaRadius }}
          >
            {cta}
          </div>
        </div>
      </div>
    </figure>
  );
}
