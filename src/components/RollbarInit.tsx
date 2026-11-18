"use client";

import { useEffect } from "react";
import { loadClientRollbar } from "@/lib/rollbar-client";

/** Liga o alerta de erros no navegador depois que a página carrega. */
export default function RollbarInit() {
  useEffect(() => {
    void loadClientRollbar();
  }, []);
  return null;
}
