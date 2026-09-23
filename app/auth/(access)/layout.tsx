import { ThemeSwitcher } from "@/components/theme-switcher";

// Marco de las pantallas de acceso: marca arriba, contenido centrado en una columna estrecha.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-topbar items-center justify-between pr-1 pl-4">
        <span className="flex items-center gap-2 text-heading tracking-brand">
          <span aria-hidden className="grid size-5.5 place-items-center rounded-sm bg-foreground text-caption font-bold text-background">
            D
          </span>
          DropFlex
        </span>
        <ThemeSwitcher />
      </header>
      <main className="flex flex-1 flex-col px-4 pt-6 pb-12 md:items-center md:justify-center md:pt-0">
        <div className="w-full md:max-w-sm">{children}</div>
      </main>
    </div>
  );
}
