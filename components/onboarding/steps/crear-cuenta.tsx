"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Icon, notify, type IconName } from "@/components/df";
import { cn } from "@/lib/utils";

export const PREFILL_KEY = "df:correo";

const PROMISE: [IconName, string, string][] = [
  ["store", "Conecta Shopify", "Traemos tus productos en segundos"],
  ["sparkle", "La IA los mejora", "Textos, imágenes y precio sugerido"],
  ["check", "Tú apruebas", "Nada se publica sin tu OK"],
];

/** O1 · Crear cuenta: la promesa en 3 pasos. */
export function CrearCuenta() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  
  const start = (kind: "google" | "email") => {
    if (kind === "google") {
      notify("Por ahora crea tu cuenta con tu correo: el acceso con Google aún no está configurado.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Escribe tu correo, como tu@correo.com.");
      return;
    }
    setError(undefined);
    try {
      sessionStorage.setItem(PREFILL_KEY, email.trim());
    } catch {}
    router.push("/auth/sign-up");
  };

  return (
    <main id="contenido" className="flex min-h-svh flex-col md:items-center md:justify-center md:py-12">
      <div className="flex flex-1 flex-col gap-5 px-5 pt-6 md:max-w-md md:flex-none">
        <div className="flex items-center gap-2 text-heading tracking-brand">
          <span aria-hidden className="grid size-5.5 place-items-center rounded-sm bg-foreground text-caption font-bold text-background">
            D
          </span>
          DropFlex
        </div>
        <div>
          <h1 className="text-display text-balance">Tus productos, mejores y listos para vender</h1>
          <p className="mt-2 text-body text-pretty text-muted-foreground">
            Conecta tu tienda y la IA prepara textos, imágenes y anuncios. Tú decides qué se publica.
          </p>
        </div>
        <ol className="flex flex-col gap-4">
          {PROMISE.map(([icon, title, text], i) => (
            <li key={title} className="flex items-center gap-3">
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-md",
                  i === PROMISE.length - 1 ? "bg-primary-soft text-primary" : "bg-muted text-foreground",
                )}
              >
                <Icon name={icon} />
              </span>
              <span>
                <b className="block text-row font-semibold">{title}</b>
                <small className="block text-label font-normal text-muted-foreground">{text}</small>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <form
        className="flex flex-col gap-2 px-4 pt-6 pb-[calc(var(--space-3)+env(safe-area-inset-bottom))] md:w-full md:max-w-md md:px-5"
        onSubmit={(e) => {
          e.preventDefault();
          start("email");
        }}
      >
        <Button variant="secondary" size="lg" block onClick={() => start("google")}>
          Continuar con Google
        </Button>
        <p className="flex items-center gap-3 text-caption text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
          o con tu correo
        </p>
        <Field
          label="Correo"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          value={email}
          onValueChange={(v) => {
            setEmail(v);
            setError(undefined);
          }}
          error={error}
        />
        <Button type="submit" variant="primary" size="lg" block>
          Crear cuenta gratis
        </Button>
        <p className="mt-1 text-center text-label font-normal text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/auth/login?next=/onboarding" className="font-medium text-primary underline underline-offset-3">
            Inicia sesión
          </Link>
        </p>
      </form>
    </main>
  );
}
