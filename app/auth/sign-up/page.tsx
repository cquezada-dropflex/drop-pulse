import type { Metadata } from "next";
import { SignUpForm } from "@/components/sign-up-form";

export const metadata: Metadata = { title: "Crea tu cuenta" };

export default function Page() {
  return <SignUpForm />;
}
