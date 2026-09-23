"use client";

import { createClient } from "@/lib/supabase/client";
import { Button, Field } from "@/components/df";
import { AuthCard, FormError } from "@/components/auth/auth-card";
import { authErrorMessage } from "@/lib/auth-errors";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push("/hoy");
    } catch (error: unknown) {
      setError(authErrorMessage(error, "No pudimos guardar tu contraseña. Intenta de nuevo en un momento."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard title="Crea una contraseña nueva" description="Úsala la próxima vez que inicies sesión.">
      <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
        <Field
          label="Contraseña nueva"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onValueChange={setPassword}
          hint="Al menos 6 caracteres."
        />
        <FormError>{error}</FormError>
        <Button type="submit" variant="primary" size="lg" block loading={isLoading}>
          {isLoading ? "Guardando" : "Guardar contraseña"}
        </Button>
      </form>
    </AuthCard>
  );
}
