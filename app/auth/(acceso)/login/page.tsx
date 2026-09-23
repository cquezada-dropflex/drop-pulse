import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Inicia sesión" };

export default function Page() {
  return <LoginForm />;
}
