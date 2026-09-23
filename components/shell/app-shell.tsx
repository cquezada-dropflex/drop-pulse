"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Navigation, type NavId } from "@/components/df";
import { AssistantPanel, useAssistant } from "./assistant-provider";
import { useDesktop } from "./use-desktop";

// Las pantallas de etapa (revisión, imágenes, precio) ocupan el alto completo con su propia barra
// de acción, sin barra de pestañas (design-system/reference/bundle.js → ScreenRevision/Imagenes/Precio).
const STAGE_SCREEN = /^\/productos\/[^/]+\/(textos|imagenes|precio)$/;

/**
 * Móvil (<1024px): contenido + barra de 3 pestañas abajo. Escritorio: riel de 232px a la izquierda
 * y, si está abierto, el asistente como panel derecho de 340px, sin tapar el trabajo.
 */
export function AppShell({ children, badges }: { children: React.ReactNode; badges?: Partial<Record<NavId, number>> }) {
  const pathname = usePathname();
  const desktop = useDesktop();
  const { open } = useAssistant();
  const showTabbar = !desktop && !STAGE_SCREEN.test(pathname);

  // La barra fija de acción y el toast se apoyan sobre la barra de pestañas cuando está visible.
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--df-tabbar-h", showTabbar ? "calc(var(--size-tabbar) + env(safe-area-inset-bottom))" : "0px");
    root.setProperty("--df-sticky-safe", showTabbar ? "0px" : "env(safe-area-inset-bottom)");
  }, [showTabbar]);

  return (
    <>
      <a
        href="#contenido"
        className="sr-only z-toast rounded-md bg-background px-4 py-3 text-body focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <div className="lg:flex">
        <div className="sticky top-0 hidden h-svh shrink-0 lg:block">
          <Navigation variant="rail" badges={badges} />
        </div>
        <main id="contenido" className="min-h-svh min-w-0 flex-1 pb-[var(--df-tabbar-h,0px)] lg:pb-0">
          {children}
        </main>
        {desktop && open ? (
          <div className="sticky top-0 h-svh w-85 shrink-0">
            <AssistantPanel variant="panel" />
          </div>
        ) : null}
      </div>
      {showTabbar ? (
        <div className="fixed inset-x-0 bottom-0 z-nav lg:hidden">
          <Navigation badges={badges} />
        </div>
      ) : null}
    </>
  );
}
