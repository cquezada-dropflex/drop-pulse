"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const OPTIONS = [
  { value: "light", label: "Claro", Icon: Sun },
  { value: "dark", label: "Oscuro", Icon: Moon },
  { value: "system", label: "Sistema", Icon: Laptop },
] as const;

const subscribe = () => () => {};

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  // El tema solo se conoce en el cliente; en el servidor se dibuja el de "Sistema".
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const current = OPTIONS.find((o) => o.value === (mounted ? theme : "system")) ?? OPTIONS[2];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Tema: ${current.label}. Cambiar tema`}
        title="Cambiar tema"
        className="inline-grid size-touch place-items-center rounded-md text-foreground hover:bg-accent"
      >
        <current.Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" data-focus="within" className="min-w-40 rounded-md p-1">
        <DropdownMenuRadioGroup value={mounted ? theme : undefined} onValueChange={setTheme}>
          {OPTIONS.map(({ value, label, Icon }) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              className="min-h-touch gap-3 rounded-sm pr-3 text-body"
            >
              <Icon className="size-4" strokeWidth={1.75} aria-hidden />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
