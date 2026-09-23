"use client";

import { createClient } from "@/lib/supabase/client";
import { Button, Field } from "@/components/df";
import { AuthCard, FormError, linkClass } from "@/components/auth/auth-card";
import { authErrorMessage } from "@/lib/auth-errors";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    setMismatch(false);

    if (password !== repeatPassword) {
      setMismatch(true);
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/hoy`,
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(authErrorMessage(error, "No pudimos crear tu cuenta. Intenta de nuevo en un momento."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard title="Crea tu cuenta" description="La IA propone, tú decides.">
      <form onSubmit={handleSignUp} className="flex flex-col gap-4">
        <Field label="Correo" type="email" autoComplete="email" placeholder="tu@correo.com" required value={email} onValueChange={setEmail} />
        <Field
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onValueChange={setPassword}
          hint="Al menos 6 caracteres."
        />
        <Field
          label="Repite la contraseña"
          type="password"
          autoComplete="new-password"
          required
          value={repeatPassword}
          onValueChange={setRepeatPassword}
          error={mismatch ? "Las contraseñas no coinciden. Escríbela igual en ambos campos." : undefined}
        />
        <FormError>{error}</FormError>
        <Button type="submit" variant="primary" size="lg" block loading={isLoading}>
          {isLoading ? "Creando tu cuenta" : "Crear cuenta"}
        </Button>
      </form>
      <p className="text-center text-body text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/auth/login" className={linkClass}>
          Inicia sesión
        </Link>
      </p>
    </AuthCard>
  );
}
