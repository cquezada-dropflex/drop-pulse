"use client";

import { useId, useState } from "react";
import { Button, Icon } from "@/components/df";
import { COUNTRIES, CURRENCIES, LANGUAGES, countryInfo, countryName, currencyName, languageName, type Market } from "@/lib/market";
import { cn } from "@/lib/utils";

export type MarketValue = Pick<Market, "countryCode" | "currency" | "language">;

/** Lista desplegable nativa con el marco de Field (16px: el teléfono no hace zoom). */
function SelectField({
  label,
  value,
  onChange,
  options,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  error?: string;
}) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-label">
        {label}
      </label>
      <div
        className={cn(
          "relative flex h-control items-center rounded-md border border-input bg-background transition-[border-color,box-shadow] duration-fast ease-standard",
          "focus-within:border-primary focus-within:ring-3 focus-within:ring-primary-soft",
          error && "border-destructive",
        )}
      >
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          className="h-full w-full appearance-none bg-transparent pr-9 pl-3 text-heading font-normal text-foreground outline-none"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon name="chevron-right" size="sm" className="pointer-events-none absolute right-3 rotate-90 text-muted-foreground" />
      </div>
      {error ? <span className="text-caption text-destructive">{error}</span> : null}
    </div>
  );
}

/** País, moneda e idioma. Al cambiar el país se sugieren su moneda y su idioma. */
export function MarketFields({
  value,
  onChange,
  errors,
}: {
  value: MarketValue;
  onChange: (v: MarketValue) => void;
  errors?: Partial<Record<keyof MarketValue, string>>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <SelectField
        label="País"
        value={value.countryCode}
        error={errors?.countryCode}
        options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
        onChange={(code) => {
          const c = countryInfo(code);
          onChange({ countryCode: code, currency: c?.currency ?? value.currency, language: c?.language ?? value.language });
        }}
      />
      <SelectField
        label="Moneda"
        value={value.currency}
        error={errors?.currency}
        options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.name} (${c.code})` }))}
        onChange={(currency) => onChange({ ...value, currency })}
      />
      <SelectField
        label="Idioma de los textos"
        value={value.language}
        error={errors?.language}
        options={LANGUAGES.map((l) => ({ value: l.code, label: l.name }))}
        onChange={(language) => onChange({ ...value, language })}
      />
    </div>
  );
}

/**
 * Mercado detectado en Shopify, para confirmar: “Vendes en Chile, en pesos chilenos, con textos en
 * español neutro”. “Cambiar” abre las listas. La IA escribe y calcula con lo que aquí se confirme.
 */
export function MarketCard({
  value,
  onChange,
  confirmed,
  errors,
}: {
  value: MarketValue;
  onChange: (v: MarketValue) => void;
  confirmed: boolean;
  errors?: Partial<Record<keyof MarketValue, string>>;
}) {
  const [editing, setEditing] = useState(Boolean(errors && Object.keys(errors).length));
  return (
    <section aria-labelledby="mercado" className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 id="mercado" className="text-heading">
            Dónde vendes
          </h2>
          <p className="mt-0.5 flex items-center gap-1 text-label font-normal text-muted-foreground">
            {confirmed ? null : <Icon name="sparkle" size="sm" />}
            {confirmed ? "La IA escribe y calcula para este mercado." : "Lo detectamos en tu Shopify. Revisa que esté bien."}
          </p>
        </div>
        {editing ? null : (
          <Button size="sm" variant="ghost" icon="edit" onClick={() => setEditing(true)}>
            Cambiar
          </Button>
        )}
      </div>
      {editing ? (
        <div className="mt-4">
          <MarketFields value={value} onChange={onChange} errors={errors} />
        </div>
      ) : (
        <dl className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-md border bg-border">
          {[
            ["País", countryName(value.countryCode)],
            ["Moneda", `${currencyName(value.currency)}`],
            ["Idioma", languageName(value.language)],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0 bg-card p-3">
              <dt className="text-caption text-muted-foreground">{k}</dt>
              <dd className="text-small font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
