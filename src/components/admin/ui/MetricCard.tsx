import React from "react";
import Link from "next/link";

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  /** Explica o número em uma linha, sem jargão ("Base Real", "Lifetime"...). */
  hint?: string;
  /** Quando há algo a fazer, o card vira link e ganha destaque. */
  href?: string;
  attention?: boolean;
}

export default function MetricCard({ label, value, hint, href, attention }: MetricCardProps) {
  const body = (
    <>
      <p className="text-sm text-primary/70">{label}</p>
      <p className="mt-1 truncate text-2xl font-semibold tracking-tight text-primary sm:text-3xl">{value}</p>
      {hint && (
        <p className={`mt-1 text-sm text-primary/60 ${attention ? "" : "hidden sm:block"}`}>{hint}</p>
      )}
    </>
  );
  const base = `block rounded-lg border p-4 sm:p-5 ${
    attention ? "border-amber-300 bg-amber-50" : "border-primary/10 bg-white"
  }`;
  return href ? (
    <Link href={href} className={`${base} transition-colors hover:border-primary/40`}>
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  );
}
