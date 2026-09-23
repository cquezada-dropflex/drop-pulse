/** Sección de /dev/components; `data-componente` la usa scripts/componentes.ts para capturarla. */
export function Section({ title, children, id }: { title: string; children: React.ReactNode; id: string }) {
  return (
    <section aria-labelledby={id} data-componente={id} className="flex flex-col gap-3 border-b py-6 last:border-b-0">
      <h2 id={id} className="text-heading">{title}</h2>
      {children}
    </section>
  );
}
