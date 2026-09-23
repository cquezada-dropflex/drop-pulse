"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/df";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <Button onClick={logout} loading={loading}>
      Cerrar sesión
    </Button>
  );
}
