import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, linkClass } from "@/components/auth/auth-card";
import { Icon } from "@/components/df";

export const metadata: Metadata = { title: "Confirma tu correo" };

export default function Page() {
  return (
    <AuthCard
      title="Confirma tu correo"
      description="Te enviamos un enlace. Ábrelo para activar tu cuenta y luego inicia sesión."
    >
      <p className="flex items-center gap-2 text-label font-normal text-muted-foreground">
        <Icon name="clock" size="sm" />
        Si no llega en unos minutos, revisa la carpeta de spam.
      </p>
      <Link href="/auth/login" className={`text-body ${linkClass}`}>
        Ir a iniciar sesión
      </Link>
    </AuthCard>
  );
}
