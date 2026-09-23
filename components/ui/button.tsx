import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

// Variantes y medidas de DropFlex (design-system/reference/bundle.css → .df-btn, .df-iconbtn).
// El área táctil de 44px se completa con un pseudo-elemento cuando el dibujo es menor.
const buttonVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-transparent whitespace-nowrap transition-[background-color,scale] duration-fast ease-standard select-none before:absolute before:inset-x-0 active:not-disabled:scale-press disabled:cursor-not-allowed disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:not-disabled:bg-primary-hover",
        secondary: "border-input bg-card text-foreground hover:not-disabled:bg-accent",
        ghost: "bg-transparent text-foreground hover:not-disabled:bg-accent",
        destructive: "bg-destructive text-destructive-foreground",
      },
      size: {
        sm: "h-8 min-w-touch px-3 text-label before:-inset-y-1.5",
        md: "h-control min-w-touch px-4 text-row before:-inset-y-0.5",
        lg: "h-12 min-w-touch px-5 text-heading font-medium",
        icon: "size-touch",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  }
)

function Button({
  className,
  variant = "secondary",
  size = "md",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
