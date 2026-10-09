"use client";

import React from "react";

interface ChoiceChipsProps<T extends string> {
  /** Nome do grupo de rádios (precisa ser único na página). */
  name: string;
  legend: string;
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (value: T) => void;
  /** Esconde a legenda visualmente (continua para leitor de tela). */
  hideLegend?: boolean;
}

/**
 * Escolha única em botões grandes, bons para o polegar. Por baixo são rádios nativos,
 * então as setas do teclado e o leitor de tela funcionam sem código extra.
 */
export default function ChoiceChips<T extends string>({
  name,
  legend,
  value,
  options,
  onChange,
  hideLegend,
}: ChoiceChipsProps<T>) {
  return (
    <fieldset>
      <legend className={hideLegend ? "sr-only" : "mb-2 text-sm font-semibold text-primary"}>{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const checked = opt.value === value;
          return (
            <label
              key={opt.value}
              className={`flex min-h-11 cursor-pointer items-center rounded-lg border px-4 py-2 text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-blue ${
                checked
                  ? "border-primary bg-primary font-semibold text-white"
                  : "border-primary/20 bg-white font-medium text-primary hover:border-primary/50"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={checked}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <span>
                {opt.label}
                {opt.hint && (
                  <span className={`block text-xs font-normal ${checked ? "text-white/80" : "text-primary/60"}`}>
                    {opt.hint}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
