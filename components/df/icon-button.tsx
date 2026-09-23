import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Icon, type IconName } from "./icon";
import { cn } from "@/lib/utils";

export interface IconButtonProps {
  icon: IconName;
  /** Obligatorio: es el nombre accesible y el tooltip. */
  label: string;
  /** `primary`: círculo para la acción de crear. */
  variant?: "primary";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  /** Texto extra solo para lectores (por ejemplo, un conteo). */
  badge?: string;
}

export function IconButton({ icon, label, variant, onClick, href, type = "button", disabled, className, badge }: IconButtonProps) {
  const classes = cn(
    buttonVariants({ variant: variant === "primary" ? "primary" : "ghost", size: "icon" }),
    "grid place-items-center",
    variant === "primary" && "rounded-full",
    className,
  );
  const content = (
    <>
      <Icon name={icon} />
      {badge ? <span className="sr-only">{badge}</span> : null}
    </>
  );
  if (href) {
    return (
      <Link href={href} aria-label={label} title={label} className={classes}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} aria-label={label} title={label} onClick={onClick} disabled={disabled} className={classes}>
      {content}
    </button>
  );
}
