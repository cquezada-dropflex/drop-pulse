import type { Metadata } from "next";
import { Suspense } from "react";
import { Icon, ProductRow } from "@/components/df";
import { NewProductButton } from "@/components/screens/actions";
import { UrlFilter } from "@/components/screens/filters";
import { EmptyState, PageHeader, SectionTitle } from "@/components/shell/page-header";
import { RowsSkeleton } from "@/components/shell/skeletons";
import { getProductCounts, getProducts } from "@/lib/data/products";
import type { ProductFilter, StageKey } from "@/lib/types";

export const metadata: Metadata = { title: "Productos" };

const FILTERS: ProductFilter[] = ["avanzan", "detenidos", "publicados"];
const LABEL: Record<ProductFilter, string> = { avanzan: "Avanzan", detenidos: "Detenidos", publicados: "Publicados" };
const EMPTY: Record<ProductFilter, { title: string; text: string }> = {
  avanzan: { title: "Nada avanzando ahora", text: "Cuando importes un producto, la IA empieza a generar su contenido y lo verás aquí." },
  detenidos: { title: "Nada detenido", text: "Todos tus productos avanzan o ya están publicados." },
  publicados: { title: "Aún no publicas productos", text: "Cuando apruebes textos, imágenes y precio, publícalo en tu tienda desde su ruta." },
};

// La fila lleva al producto en la etapa que lo detiene.
const stageHref = (id: string, stage: StageKey) =>
  stage === "textos" || stage === "imagenes" || stage === "precio" ? `/productos/${id}/${stage}` : `/productos/${id}`;

// Cómo se lee el medidor (ScreenProductos → "Así se leen").
const LEGEND = [
  ["bg-foreground", "Lista"],
  ["bg-primary", "En curso"],
  ["bg-warning", "Detenida"],
  ["bg-destructive", "Error"],
];

async function ProductList({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  const { filtro } = await searchParams;
  const filter: ProductFilter = FILTERS.includes(filtro as ProductFilter) ? (filtro as ProductFilter) : "detenidos";
  const [products, counts] = await Promise.all([getProducts(filter), getProductCounts()]);

  return (
    <>
      <div className="px-4 pb-2 lg:px-0 lg:pb-4">
        <UrlFilter
          block
          param="filtro"
          value={filter}
          label="Filtrar productos"
          className="lg:inline-flex lg:w-auto"
          options={FILTERS.map((f) => ({ value: f, label: LABEL[f], count: counts[f] }))}
        />
      </div>
      {products.length === 0 ? (
        <EmptyState icon={<Icon name="box" />} title={EMPTY[filter].title}>
          {EMPTY[filter].text}
        </EmptyState>
      ) : (
        <ul
          aria-label={`Productos: ${LABEL[filter].toLowerCase()}`}
          className="mx-4 grid overflow-hidden rounded-lg border bg-card md:grid-cols-2 lg:mx-0 lg:grid-cols-1"
        >
          {products.map((p) => (
            <li key={p.id} className="border-t first:border-t-0 md:max-lg:nth-2:border-t-0 md:max-lg:odd:border-r">
              <ProductRow
                name={p.name}
                image={p.image}
                stages={p.meter}
                tone={p.tone}
                reason={p.reason}
                href={stageHref(p.id, p.nextStage)}
              />
            </li>
          ))}
        </ul>
      )}
      <SectionTitle>Así se leen</SectionTitle>
      <ul className="flex flex-wrap gap-3 px-4 text-caption text-muted-foreground lg:px-0">
        {LEGEND.map(([color, label]) => (
          <li key={label} className="inline-flex items-center gap-1.5">
            <span aria-hidden className={`h-1.5 w-3.5 rounded-full ${color}`} />
            {label}
          </li>
        ))}
      </ul>
    </>
  );
}

export default async function ProductosPage({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  const counts = await getProductCounts();
  return (
    <>
      <PageHeader
        large
        title="Productos"
        subtitle={`${counts.total} productos`}
        actions={<NewProductButton />}
      />
      <div className="pb-6 lg:max-w-content lg:px-8 lg:py-6">
        <Suspense fallback={<RowsSkeleton rows={3} className="mt-12" />}>
          <ProductList searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
