"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { analyticsUrl } from "@/lib/analytics-filter";

// Estatísticas de visita da Vercel: sem cookies e sem dados pessoais.
// Só envia no site publicado; em desenvolvimento o pacote apenas registra no console.
export default function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event: BeforeSendEvent) => {
        const url = analyticsUrl(event.url);
        return url ? { ...event, url } : null;
      }}
    />
  );
}
