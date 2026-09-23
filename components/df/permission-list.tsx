import { Icon } from "./icon";
import { cn } from "@/lib/utils";

export interface Permission {
  kind: "read" | "write" | "never";
  text: string;
}

export interface PermissionListProps {
  title?: string;
  items: Permission[];
  note?: string;
  className?: string;
}

const KIND = { read: "Lee", write: "Escribe", never: "Nunca" } as const;

/**
 * Qué lee, qué escribe y qué nunca hace DropFlex con una cuenta conectada. Va antes del botón
 * que abre la autorización del proveedor. Nunca lista permisos técnicos (scopes).
 */
export function PermissionList({ title, items, note, className }: PermissionListProps) {
  return (
    <div className={cn("rounded-lg border p-4", className)}>
      {title ? (
        <h2 className="mb-2 flex items-center gap-1.5 text-label font-semibold">
          <Icon name="shield" size="sm" />
          {title}
        </h2>
      ) : null}
      <ul className="flex flex-col gap-2">
        {items.map((it) => (
          <li key={`${it.kind}-${it.text}`} className="flex items-baseline gap-2 text-small">
            <span
              className={cn(
                "w-15 shrink-0 rounded-sm text-center text-micro leading-4.5 font-semibold",
                it.kind === "write" ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground",
              )}
            >
              {KIND[it.kind]}
            </span>
            <span>{it.text}</span>
          </li>
        ))}
      </ul>
      {note ? <p className="mt-3 text-caption text-muted-foreground">{note}</p> : null}
    </div>
  );
}
