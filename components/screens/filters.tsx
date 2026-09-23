"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SegmentedControl, type SegmentedOption } from "@/components/df";

/**
 * Filtro sobre la misma lista, guardado en la URL (?param=valor). No es navegación:
 * reemplaza la entrada del historial y mantiene el scroll.
 */
export function UrlFilter({
  param,
  value,
  options,
  label,
  block,
  className,
}: {
  param: string;
  value: string;
  options: SegmentedOption[];
  label: string;
  block?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [, startTransition] = useTransition();

  return (
    <SegmentedControl
      block={block}
      label={label}
      value={value}
      options={options}
      className={className}
      onChange={(v) => {
        const params = new URLSearchParams(search);
        params.set(param, v);
        startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
      }}
    />
  );
}
