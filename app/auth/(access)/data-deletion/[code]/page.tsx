import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { adminClient } from "@/lib/integrations/admin";
import { longDate } from "@/lib/format";

export const metadata: Metadata = { title: "Borrado de datos" };

/** Estado de una solicitud de borrado de datos de Meta (la URL que se entrega en el callback). Pública. */
async function Status({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { data } = /^[a-f0-9]{16}$/.test(code)
    ? await adminClient().from("data_deletion_requests").select("status, completed_at").eq("confirmation_code", code).maybeSingle()
    : { data: null };

  if (!data) {
    return (
      <AuthCard
        title="No encontramos esa solicitud"
        description="Revisa que el código de confirmación esté completo. Si el problema sigue, escríbenos con el código."
      />
    );
  }
  const done = data.status === "completed";
  return (
    <AuthCard
      title={done ? "Borramos tus datos de Meta" : "Estamos borrando tus datos de Meta"}
      description={
        done && data.completed_at
          ? `El ${longDate(data.completed_at.slice(0, 10)).toLowerCase()} borramos el acceso y los datos de tu cuenta de Meta Ads en DropFlex.`
          : "Borraremos el acceso y los datos de tu cuenta de Meta Ads en DropFlex en las próximas horas."
      }
    >
      <p className="text-label font-normal text-muted-foreground">
        Código de confirmación: <span className="font-mono tabular-nums">{code}</span>
      </p>
    </AuthCard>
  );
}

export default function Page({ params }: { params: Promise<{ code: string }> }) {
  return (
    <Suspense>
      <Status params={params} />
    </Suspense>
  );
}
