"use client";

import React, { useTransition, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface Option {
  label: string;
  value: string;
}

interface AdminFilterSelectProps {
  paramName: string;
  options: Option[];
  placeholder?: string;
  defaultValue?: string;
}

function AdminFilterSelectInner({
  paramName,
  options,
  placeholder,
  defaultValue = "",
}: AdminFilterSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentValue = searchParams.get(paramName) || defaultValue;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (val && val !== "ALL") {
      params.set(paramName, val);
    } else {
      params.delete(paramName);
    }
    params.delete("page"); // Reset pagination

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <select
      aria-label={placeholder || paramName}
      value={currentValue}
      onChange={handleChange}
      disabled={isPending}
      className={`min-h-11 bg-accent-cream border border-primary/20 text-primary rounded-lg py-2 pl-3 pr-8 text-sm cursor-pointer ${
        isPending ? "opacity-60" : ""
      }`}
    >
      {placeholder && <option value="ALL">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export default function AdminFilterSelect(props: AdminFilterSelectProps) {
  return (
    <Suspense
      fallback={
        <div className="h-11 w-32 bg-accent-cream border border-primary/10 rounded-lg animate-pulse" />
      }
    >
      <AdminFilterSelectInner {...props} />
    </Suspense>
  );
}
