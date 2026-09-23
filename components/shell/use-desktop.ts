"use client";

import { useSyncExternalStore } from "react";

// bp-lg de tokens.json: desde 1024px la barra inferior pasa a riel y el asistente a panel derecho.
const QUERY = "(min-width: 1024px)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** true desde bp-lg. En el servidor, false (móvil primero). */
export function useDesktop() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
