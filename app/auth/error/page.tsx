import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/df";
import { authErrorMessage } from "@/lib/auth-errors";

export const metadata: Metadata = { title: "No pudimos continuar" };

async function ErrorContent({ searchParams }: { searchParams: Promise<{ error: string }> }) {
  const params = await searchParams;
  return (
    <p className="text-body text-muted-foreground">
      {authErrorMessage(params?.error, "Algo falló al validar tu acceso. Vuelve a iniciar sesión o pide un enlace nuevo.")}
    </p>
  );
}

export default function Page({ searchParams }: { searchParams: Promise<{ error: string }> }) {
  return (
    <AuthCard title="No pudimos continuar">
      <Suspense>
        <ErrorContent searchParams={searchParams} />
      </Suspense>
      <div className="flex flex-col gap-2">
        <Button href="/auth/login" variant="primary" size="lg" block>
          Iniciar sesión
        </Button>
        <Link href="/auth/forgot-password" className="py-3 text-center text-body text-primary underline underline-offset-4">
          Pedir un enlace nuevo
        </Link>
      </div>
    </AuthCard>
  );
}
