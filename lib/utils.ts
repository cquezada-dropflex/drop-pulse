import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge debe conocer la escala tipográfica de DropFlex (app/globals.css); si no,
// confunde `text-heading` con un color y borra `text-primary-foreground`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "display", "title", "heading", "body", "label", "caption", "code", "metric", "metric-lg",
        "micro", "tab", "small", "row", "topbar",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
