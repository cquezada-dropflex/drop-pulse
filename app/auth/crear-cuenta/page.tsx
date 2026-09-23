import type { Metadata } from "next";
import { CrearCuenta } from "@/components/onboarding/steps/crear-cuenta";

export const metadata: Metadata = { title: "Crea tu cuenta" };

export default function Page() {
  return <CrearCuenta />;
}
