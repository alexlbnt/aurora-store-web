"use client";

import React, { useId, useMemo, useState } from "react";
import { formatPhone } from "@/lib/formatters";
import { normalize, type CustomerDraft, type PickerCustomer } from "./types";

const fieldClass =
  "min-h-12 w-full rounded-lg border border-primary/20 bg-accent-cream px-3.5 text-base text-primary placeholder:text-primary/40";
const labelClass = "mb-1.5 block text-sm font-semibold text-primary";

interface CustomerPickerProps {
  customers: PickerCustomer[];
  value: CustomerDraft;
  onChange: (value: CustomerDraft) => void;
}

export default function CustomerPicker({ customers, value, onChange }: CustomerPickerProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();

  const results = useMemo(() => {
    const q = normalize(search);
    if (!q) return [];
    const digits = q.replace(/\D/g, "");
    return customers
      .filter(
        (c) =>
          normalize(c.name).includes(q) ||
          (c.email && normalize(c.email).includes(q)) ||
          (c.socialMedia && normalize(c.socialMedia).includes(q)) ||
          (digits.length >= 3 && c.phone.replace(/\D/g, "").includes(digits))
      )
      .slice(0, 6);
  }, [customers, search]);

  const select = (c: PickerCustomer) => {
    onChange({ id: c.id, name: c.name, phone: formatPhone(c.phone), email: c.email ?? "", socialMedia: c.socialMedia ?? "" });
    setSearch("");
    setOpen(false);
  };

  // Telefone digitado que já pertence a alguém cadastrado: oferece usar o cadastro.
  const phoneDigits = value.phone.replace(/\D/g, "");
  const phoneMatch =
    !value.id && phoneDigits.length >= 10
      ? customers.find((c) => c.phone.replace(/\D/g, "").endsWith(phoneDigits.slice(-10)))
      : undefined;

  if (value.id) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/15 bg-accent-cream p-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-blue font-semibold text-white" aria-hidden="true">
            {value.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-primary">{value.name}</p>
            <p className="truncate text-sm text-primary/70">
              {value.phone}
              {value.email && ` · ${value.email}`}
              {value.socialMedia && ` · ${value.socialMedia}`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange({ id: "", name: "", phone: "", email: "", socialMedia: "" })}
          className="min-h-11 shrink-0 rounded-lg border border-primary/25 bg-white px-3 text-sm font-semibold text-primary hover:bg-primary/5"
        >
          Trocar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <label htmlFor="customer-search" className={labelClass}>
          Buscar cliente cadastrado
        </label>
        <div className="relative">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-primary/50" aria-hidden="true">
            person_search
          </span>
          <input
            id="customer-search"
            type="search"
            role="combobox"
            aria-expanded={open && results.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && results[active] ? `${listId}-${results[active].id}` : undefined}
            autoComplete="off"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
              setActive(0);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={(e) => {
              if (!results.length) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                select(results[active]);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder="Nome, telefone, e-mail ou @"
            className={`${fieldClass} pl-10`}
          />
        </div>

        {open && search.trim() && (
          <ul
            id={listId}
            role="listbox"
            aria-label="Clientes encontrados"
            className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-72 overflow-y-auto rounded-lg border border-primary/15 bg-white shadow-lg"
          >
            {results.length === 0 ? (
              <li className="p-3 text-sm text-primary/70">Nenhum cliente encontrado. Cadastre abaixo.</li>
            ) : (
              results.map((c, i) => (
                <li
                  key={c.id}
                  id={`${listId}-${c.id}`}
                  role="option"
                  aria-selected={i === active}
                  // mousedown em vez de click: o blur do campo fecharia a lista antes do clique.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    select(c);
                  }}
                  className={`flex min-h-12 cursor-pointer flex-col justify-center px-3 py-2 ${
                    i === active ? "bg-accent-soft" : "hover:bg-accent-cream"
                  }`}
                >
                  <span className="font-medium text-primary">{c.name}</span>
                  <span className="text-sm text-primary/70">
                    {formatPhone(c.phone)}
                    {c.email && ` · ${c.email}`}
                    {c.socialMedia && ` · ${c.socialMedia}`}
                  </span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-3 text-sm text-primary/60" aria-hidden="true">
        <span className="h-px flex-1 bg-primary/10" />
        ou cadastre agora
        <span className="h-px flex-1 bg-primary/10" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="customer-name" className={labelClass}>
            Nome
          </label>
          <input
            id="customer-name"
            type="text"
            autoComplete="off"
            autoCapitalize="words"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="Maria Alice"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="customer-phone" className={labelClass}>
            Telefone ou WhatsApp
          </label>
          <input
            id="customer-phone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            value={value.phone}
            onChange={(e) => onChange({ ...value, phone: formatPhone(e.target.value) })}
            placeholder="(62) 99999-9999"
            className={fieldClass}
          />
        </div>
      </div>

      {phoneMatch && (
        <div role="status" className="flex flex-col gap-2 rounded-lg border border-accent-blue/30 bg-accent-blue/10 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-primary">
            Esse telefone já é de <strong className="font-semibold">{phoneMatch.name}</strong>.
          </p>
          <button
            type="button"
            onClick={() => select(phoneMatch)}
            className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-accent-blue"
          >
            Usar este cadastro
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="customer-email" className={labelClass}>
            E-mail <span className="font-normal text-primary/60">(opcional)</span>
          </label>
          <input
            id="customer-email"
            type="email"
            inputMode="email"
            autoComplete="off"
            value={value.email}
            onChange={(e) => onChange({ ...value, email: e.target.value })}
            placeholder="cliente@email.com"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="customer-social" className={labelClass}>
            Redes sociais <span className="font-normal text-primary/60">(opcional)</span>
          </label>
          <input
            id="customer-social"
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={value.socialMedia ?? ""}
            onChange={(e) => onChange({ ...value, socialMedia: e.target.value })}
            placeholder="@cliente.instagram"
            className={fieldClass}
          />
        </div>
      </div>
    </div>
  );
}
