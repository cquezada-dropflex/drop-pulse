"use client";

import { createClient } from "@/lib/supabase/client";
import { Button, Field } from "@/components/df";
import { AuthCard, FormError, linkClass } from "@/components/auth/auth-card";
import { authErrorMessage } from "@/lib/auth-errors";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Destino después de iniciar sesión: `?next=` si es una ruta interna; si no, Hoy. */
function nextPath(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/today";
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push(nextPath());
    } catch (error: unknown) {
      setError(authErrorMessage(error, "No pudimos iniciar sesión. Intenta de nuevo en un momento."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard title="Inicia sesión" description="Entra para ver qué te toca decidir hoy.">
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <Field
          label="Correo"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          required
          value={email}
          onValueChange={setEmail}
        />
        <Field
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onValueChange={setPassword}
          labelEnd={
            <Link href="/auth/forgot-password" className={`text-label font-normal ${linkClass}`}>
              ¿Olvidaste tu contraseña?
            </Link>
          }
        />
        <FormError>{error}</FormError>
        <Button type="submit" variant="primary" size="lg" block loading={isLoading}>
          {isLoading ? "Entrando" : "Iniciar sesión"}
        </Button>
      </form>
      <p className="text-center text-body text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/auth/create-account" className={linkClass}>
          Crea una
        </Link>
      </p>
    </AuthCard>
  );
}
