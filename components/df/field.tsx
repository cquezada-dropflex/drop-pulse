"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "./icon";
import { cn } from "@/lib/utils";

export interface FieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix" | "value" | "defaultValue" | "onChange" | "size"> {
  label: string;
  /** Controlado. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** `$` */
  prefix?: string;
  /** `%` */
  suffix?: string;
  hint?: string;
  /** Qué está mal y cómo arreglarlo. */
  error?: string;
  /** El valor lo estimó la IA: destello en la ayuda. */
  ai?: boolean;
  /** Acción al lado de la etiqueta (por ejemplo, un enlace). */
  labelEnd?: React.ReactNode;
  className?: string;
}

/** Campo de entrada, pensado para cifras de dinero. Texto a 16px para que el teléfono no haga zoom. */
export function Field({
  label,
  value,
  defaultValue,
  onValueChange,
  id,
  prefix,
  suffix,
  hint,
  error,
  disabled,
  ai,
  inputMode,
  labelEnd,
  className,
  ...inputProps
}: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-ayuda`;
  const message = error ?? hint;

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={inputId} className="text-label">
          {label}
        </Label>
        {labelEnd}
      </div>
      <div
        className={cn(
          "flex h-control items-center gap-2 rounded-md border border-input bg-background px-3 transition-[border-color,box-shadow] duration-fast ease-standard",
          "focus-within:border-primary focus-within:ring-3 focus-within:ring-primary-soft",
          error && "border-destructive focus-within:border-destructive",
          disabled && "border-border bg-muted",
        )}
      >
        {prefix ? <span className="text-body text-muted-foreground">{prefix}</span> : null}
        <Input
          id={inputId}
          value={value}
          defaultValue={defaultValue}
          onChange={onValueChange ? (e) => onValueChange(e.target.value) : undefined}
          disabled={disabled}
          inputMode={inputMode ?? (prefix === "$" ? "numeric" : undefined)}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? hintId : undefined}
          data-focus="within"
          className={cn(
            "h-full min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-heading font-normal text-foreground shadow-none md:text-heading dark:bg-transparent",
            "focus-visible:ring-0 disabled:opacity-100 aria-invalid:ring-0",
          )}
          {...inputProps}
        />
        {suffix ? <span className="text-body text-muted-foreground">{suffix}</span> : null}
      </div>
      {message ? (
        <span
          id={hintId}
          className={cn("flex items-center gap-1 text-caption", error ? "text-destructive" : "text-muted-foreground")}
        >
          {ai && !error ? <Icon name="sparkle" size="sm" /> : null}
          {message}
        </span>
      ) : null}
    </div>
  );
}
