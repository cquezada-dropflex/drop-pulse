"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./icon";
import { cn } from "@/lib/utils";

export type NavId = "hoy" | "productos" | "campanas";

export interface NavItem {
  id: string;
  label: string;
  icon: IconName;
  href: string;
}

const NAV: NavItem[] = [
  { id: "hoy", label: "Hoy", icon: "inbox", href: "/hoy" },
  { id: "productos", label: "Productos", icon: "box", href: "/productos" },
  { id: "campanas", label: "Campañas", icon: "megaphone", href: "/campanas" },
];

const SETTINGS: NavItem = { id: "ajustes", label: "Ajustes", icon: "settings", href: "/ajustes" };

export interface NavigationProps {
  /** `bar`: barra inferior (móvil). `rail`: riel lateral (≥1024px). */
  variant?: "bar" | "rail";
  /** Pestaña activa; si falta, sale de la ruta actual. */
  active?: NavId | "ajustes";
  /** Conteo por pestaña. El de Hoy es la cantidad de decisiones pendientes. */
  badges?: Partial<Record<NavId, number>>;
  items?: NavItem[];
  className?: string;
}

const BADGE_SR: Partial<Record<string, string>> = { hoy: "decisiones pendientes" };

function useActive(active: NavigationProps["active"], items: NavItem[]) {
  const pathname = usePathname();
  if (active) return active;
  return [...items, SETTINGS].find((it) => pathname === it.href || pathname.startsWith(`${it.href}/`))?.id;
}

/** Navegación principal: tres destinos. El asistente no es pestaña. */
export function Navigation({ variant = "bar", active, badges, items = NAV, className }: NavigationProps) {
  const current = useActive(active, items);
  const rail = variant === "rail";

  const tab = (it: NavItem) => {
    const isActive = current === it.id;
    const badge = badges?.[it.id as NavId];
    const badgeEl = badge ? (
      <span
        className={cn(
          "h-4.5 min-w-4.5 rounded-full bg-foreground px-1.25 text-center text-micro leading-4.5 font-semibold text-background",
          rail ? "ml-auto" : "absolute -top-0.5 left-8.5 ring-2 ring-background",
        )}
      >
        {badge}
        {BADGE_SR[it.id] ? <span className="sr-only"> {BADGE_SR[it.id]}</span> : null}
      </span>
    ) : null;

    if (rail) {
      return (
        <Link
          key={it.id}
          href={it.href}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "flex h-10 items-center gap-3 rounded-md px-3 text-small font-medium",
            isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-accent",
          )}
        >
          <Icon name={it.icon} />
          <span>{it.label}</span>
          {badgeEl}
        </Link>
      );
    }
    return (
      <Link
        key={it.id}
        href={it.href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "relative flex flex-1 flex-col items-center justify-center gap-0.5 text-tab",
          isActive ? "text-primary" : "text-muted-foreground",
        )}
      >
        <span
          className={cn(
            "relative grid h-7 w-14 place-items-center rounded-full transition-colors duration-base ease-standard",
            isActive && "bg-primary-soft",
          )}
        >
          <Icon name={it.icon} />
          {badgeEl}
        </span>
        <span>{it.label}</span>
      </Link>
    );
  };

  if (!rail) {
    return (
      <nav aria-label="Principal" className={cn("border-t bg-background pb-safe", className)}>
        <div className="flex h-tabbar">{items.map(tab)}</div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Principal"
      className={cn(
        "flex h-full w-rail flex-col gap-0.5 border-r border-sidebar-border bg-sidebar px-3 py-4 text-sidebar-foreground",
        className,
      )}
    >
      <div className="flex items-center gap-2 px-3 pt-1 pb-5 text-heading tracking-brand">
        <span aria-hidden className="grid size-5.5 place-items-center rounded-sm bg-foreground text-caption font-bold text-background">
          D
        </span>
        DropFlex
      </div>
      {items.map(tab)}
      <div className="flex-1" />
      {tab(SETTINGS)}
    </nav>
  );
}
