import Image from "next/image";
import { cn } from "@/lib/utils";

/** Miniatura cuadrada de producto (.df-thumb): 48px y `radius-sm` por defecto. Decorativa. */
export function Thumb({ src, className, size = 48 }: { src?: string; className?: string; size?: number }) {
  if (!src) return <span aria-hidden className={cn("block size-12 shrink-0 rounded-sm bg-muted", className)} />;
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      unoptimized
      className={cn("block size-12 shrink-0 rounded-sm bg-muted object-cover", className)}
    />
  );
}
