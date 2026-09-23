"use client";

import { createClient } from "@/lib/supabase/client";
import { Button, Field, Icon } from "@/components/df";
import { AuthCard, FormError, linkClass } from "@/components/auth/auth-card";
import { authErrorMessage } from "@/lib/auth-errors";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(authErrorMessage(error, "No pudimos enviar el correo. Intenta de nuevo en un momento."));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AuthCard
        title="Revisa tu correo"
        description={`Si ${email} tiene una cuenta, te enviamos un enlace para crear una contraseña nueva.`}
      >
        <p className="flex items-center gap-2 text-label font-normal text-muted-foreground">
          <Icon name="clock" size="sm" />
          El enlace vence en una hora. Revisa también la carpeta de spam.
        </p>
        <Link href="/auth/login" className={`text-body ${linkClass}`}>
          Volver a iniciar sesión
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Recupera tu contraseña" description="Escribe tu correo y te enviamos un enlace para crear una nueva.">
      <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
        <Field label="Correo" type="email" autoComplete="email" placeholder="tu@correo.com" required value={email} onValueChange={setEmail} />
        <FormError>{error}</FormError>
        <Button type="submit" variant="primary" size="lg" block loading={isLoading}>
          {isLoading ? "Enviando" : "Enviar enlace"}
        </Button>
      </form>
      <p className="text-center text-body text-muted-foreground">
        ¿La recordaste?{" "}
        <Link href="/auth/login" className={linkClass}>
          Inicia sesión
        </Link>
      </p>
    </AuthCard>
  );
}
