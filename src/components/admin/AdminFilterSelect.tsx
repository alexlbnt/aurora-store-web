"use client";

import React, { useTransition } from "react";
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

export default function AdminFilterSelect({
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
      value={currentValue}
      onChange={handleChange}
      disabled={isPending}
      className={`bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg py-2 pl-3 pr-8 text-sm focus:ring-primary focus:border-primary outline-none cursor-pointer ${
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
