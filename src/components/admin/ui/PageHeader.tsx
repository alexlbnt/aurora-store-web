import React from "react";

/**
 * Descrição e ações da página. O título fica só na barra superior (Header),
 * para não aparecer duas vezes.
 */
export default function PageHeader({
  description,
  actions,
}: {
  description?: string;
  actions?: React.ReactNode;
}) {
  if (!description && !actions) return null;
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {description ? <p className="max-w-xl text-sm text-primary/70">{description}</p> : <span />}
      {actions && <div className="flex items-center gap-2 sm:gap-3">{actions}</div>}
    </div>
  );
}
