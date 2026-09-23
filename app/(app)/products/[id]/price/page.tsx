import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/df";
import { PriceEditor } from "@/components/screens/price-editor";
import { AssistantButton, AssistantScope } from "@/components/shell/assistant-provider";
import { getPricing, getProduct } from "@/lib/data/products";
import { getAssumptions } from "@/lib/data/settings";

export const metadata: Metadata = { title: "Precio y oferta" };

export default async function PrecioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, pricing, assumptions] = await Promise.all([getProduct(id), getPricing(id), getAssumptions()]);
  if (!product || !pricing) notFound();

  return (
    <>
      <AssistantScope productId={product.id} product={product.name} stage="Precio" stageKey="precio" image={product.image} />
      <TopBar
        back={product.name}
        backHref={`/products/${product.id}`}
        title="Precio y oferta"
        actions={<AssistantButton />}
        className="sticky top-0 z-sticky lg:hidden"
      />
      <div className="px-4 pb-4 lg:max-w-240 lg:px-8 lg:py-6">
        <PriceEditor pricing={pricing} title={product.name} image={product.image} store={assumptions.store} />
      </div>
    </>
  );
}
