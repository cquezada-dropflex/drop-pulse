import { notFound } from "next/navigation";

// Páginas de verificación del design system: solo en desarrollo.
export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== "development") notFound();
  return children;
}
