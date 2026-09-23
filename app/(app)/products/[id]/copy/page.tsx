import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button, Icon, StageMeter, TopBar, type MeterStage } from "@/components/df";
import { ReviewFlow } from "@/components/screens/review-flow";
import { AssistantButton, AssistantScope } from "@/components/shell/assistant-provider";
import { EmptyState } from "@/components/shell/page-header";
import { getProduct, getProductContent } from "@/lib/data/products";

export const metadata: Metadata = { title: "Textos" };

export default async function TextosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, items] = await Promise.all([getProduct(id), getProductContent(id)]);
  if (!product) notFound();

  const accepted = items.filter((i) => i.status === "aprobado").length;
  const pending = items.filter((i) => i.status === "generado" || i.status === "revision").length;
  const firstPending = items.findIndex((i) => i.status === "generado" || i.status === "revision");
  // Una rayita por propuesta: hechas, la actual y las que faltan.
  const meter: MeterStage[] = items.map((i, n) => (i.status === "aprobado" || i.status === "rechazado" ? "done" : n === firstPending ? "current" : "locked"));

  return (
    <>
      <AssistantScope productId={product.id} product={product.name} stage="Textos" stageKey="textos" image={product.image} />
      <TopBar
        back={product.name}
        backHref={`/products/${product.id}`}
        title="Textos"
        subtitle={items.length ? `${accepted} aceptados · ${pending} pendientes` : undefined}
        actions={<AssistantButton />}
        className="sticky top-0 z-sticky lg:hidden"
      />
      {items.length ? (
        <>
          <div className="px-4 pb-2 lg:hidden">
            <StageMeter stages={meter} />
          </div>
          <div className="px-4 py-2 lg:max-w-content lg:px-8 lg:py-6">
            <ReviewFlow items={items} nextHref={`/products/${product.id}/images`} nextLabel="Continuar: Imágenes" />
          </div>
        </>
      ) : (
        <EmptyState
          icon={<Icon name="sparkle" />}
          title="La IA está escribiendo los textos"
          action={<Button href={`/products/${product.id}`}>Volver a la ruta</Button>}
        >
          Te avisamos en Hoy cuando las propuestas estén listas para revisar.
        </EmptyState>
      )}
    </>
  );
}
