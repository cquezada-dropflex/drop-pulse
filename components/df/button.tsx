import Link from "next/link";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { Icon, type IconName } from "./icon";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonOwnProps {
  /** `primary` marca la única acción principal de la vista. Por defecto `secondary`. */
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconEnd?: IconName;
  /** Spinner + `aria-busy`; deshabilita el botón. */
  loading?: boolean;
  /** Ocupa todo el ancho. */
  block?: boolean;
  /** Atajo de teclado visible en escritorio: 'A', 'D', 'E'. */
  kbd?: string | null;
}

/** Props de un Button que es <button> (sin href). */
export type NativeButtonProps = ButtonOwnProps & React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

export type ButtonProps = ButtonOwnProps &
  (
    | (React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined })
    | (Omit<React.ComponentProps<typeof Link>, "children"> & {
        href: string;
        children?: React.ReactNode;
        disabled?: undefined;
      })
  );

export function buttonClasses({
  variant = "secondary",
  size = "md",
  block,
  className,
}: { variant?: Variant; size?: Size; block?: boolean; className?: string }) {
  return cn(
    buttonVariants({ variant, size } as VariantProps<typeof buttonVariants>),
    block && "w-full",
    className,
  );
}

function Content({ size, icon, iconEnd, loading, kbd, children }: ButtonOwnProps & { children?: React.ReactNode }) {
  return (
    <>
      {loading ? (
        <Icon name="loader" size="sm" className="animate-df-spin" />
      ) : icon ? (
        <Icon name={icon} size={size === "sm" ? "sm" : undefined} />
      ) : null}
      {children}
      {kbd ? (
        <span
          aria-hidden
          className="rounded-kbd border border-current px-1.25 font-mono text-micro font-normal opacity-70 max-lg:hidden"
        >
          {kbd}
        </span>
      ) : null}
      {iconEnd ? <Icon name={iconEnd} size="sm" /> : null}
    </>
  );
}

export function Button(props: ButtonProps) {
  const { variant, size = "md", icon, iconEnd, loading, block, kbd, className, children, ...rest } = props;
  const classes = buttonClasses({ variant, size, block, className });
  const content = (
    <Content size={size} icon={icon} iconEnd={iconEnd} loading={loading} kbd={kbd}>
      {children}
    </Content>
  );

  if (typeof rest.href === "string") {
    const linkProps = rest as React.ComponentProps<typeof Link>;
    return (
      <Link {...linkProps} className={classes}>
        {content}
      </Link>
    );
  }

  const { disabled, type = "button", ...buttonProps } = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      {...buttonProps}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-keyshortcuts={kbd ?? undefined}
    >
      {content}
    </button>
  );
}
