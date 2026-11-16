"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { authErrorMessage } from "@/lib/admin-access";

function Notice() {
  const message = authErrorMessage(useSearchParams().get("error"));
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-dawn-ink/40 bg-dawn/10 p-3 text-sm text-dawn-ink">
      <span className="material-symbols-outlined mt-0.5 text-[18px]" aria-hidden="true">error</span>
      <p>{message}</p>
    </div>
  );
}

/** Mostra o erro que o NextAuth devolve em ?error= depois do login com Google. */
export default function AuthErrorNotice() {
  return (
    <Suspense fallback={null}>
      <Notice />
    </Suspense>
  );
}
