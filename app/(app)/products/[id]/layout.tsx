import { notFound } from "next/navigation";
import { Suspense } from "react";
import { IconButton, StageList, StatusBadge, Thumb } from "@/components/df";
import { StageNav } from "@/components/screens/stage-nav";
import { AssistantButton } from "@/components/shell/assistant-provider";
import { getProduct } from "@/lib/data/products";

/**
 * Escritorio (≥lg): encabezado del producto, ruta fija a la izquierda y la etapa al centro.
 * Móvil: cada pantalla trae su propia barra superior.
 */
export default async function ProductLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <>
      <header className="hidden items-center gap-3 border-b px-8 pt-5 pb-4 lg:flex">
        <IconButton icon="chevron-left" label="Productos" href="/products" />
        {product.image ? <Thumb src={product.image} /> : null}
        <div className="min-w-0 flex-1">
          <h1 className="text-display">{product.name}</h1>
          <p className="text-caption text-muted-foreground">{product.summary}</p>
        </div>
        {product.status ? <StatusBadge status={product.status} /> : null}
        <AssistantButton />
      </header>
      <div className="lg:flex">
        <nav aria-label="Ruta del producto" className="sticky top-0 hidden max-h-svh w-66 shrink-0 self-start overflow-auto border-r pt-3 lg:block">
          {/* La etapa actual sale de la ruta (usePathname): mientras llega, la ruta sin enlaces. */}
          <Suspense fallback={<StageList stages={product.stages.map(({ title, state, desc, optional }) => ({ title, state, desc, optional }))} />}>
            <StageNav productId={product.id} stages={product.stages} />
          </Suspense>
        </nav>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </>
  );
}
