"use client";

import { useSyncExternalStore } from "react";

// Cor do céu conforme a hora local do visitante, de baixo (mais escuro) para cima.
const SKIES = {
  madrugada: "linear-gradient(to top, rgba(20,24,38,0.92) 0%, rgba(54,48,96,0.55) 55%, rgba(35,42,62,0.15) 100%)",
  amanhecer: "linear-gradient(to top, rgba(59,53,96,0.9) 0%, rgba(184,106,140,0.5) 55%, rgba(240,200,190,0.15) 100%)",
  dia: "linear-gradient(to top, rgba(35,42,62,0.82) 0%, rgba(75,90,140,0.3) 55%, rgba(238,235,242,0.05) 100%)",
  entardecer: "linear-gradient(to top, rgba(43,37,80,0.92) 0%, rgba(138,90,143,0.5) 55%, rgba(217,139,165,0.2) 100%)",
  noite: "linear-gradient(to top, rgba(20,24,38,0.94) 0%, rgba(35,42,62,0.6) 55%, rgba(35,42,62,0.2) 100%)",
} as const;

type Sky = keyof typeof SKIES;

function skyForHour(hour: number): Sky {
  if (hour < 5) return "madrugada";
  if (hour < 8) return "amanhecer";
  if (hour < 17) return "dia";
  if (hour < 20) return "entardecer";
  return "noite";
}

/**
 * Camada de cor sobre a foto do hero. Aparece uma única vez, com um fade na carga da página,
 * já na cor do céu da hora local do cliente. Sem JS (ou antes de hidratar), só o escurecimento
 * base do hero fica visível, o suficiente para o texto continuar legível.
 */
const subscribe = () => () => {};
const getClientSky = (): Sky => skyForHour(new Date().getHours());
const getServerSky = (): Sky | null => null;

export default function HeroSky() {
  // No servidor (e durante a hidratação) vale null; depois da hidratação vira a hora local,
  // e é essa troca que dispara o fade.
  const sky = useSyncExternalStore(subscribe, getClientSky, getServerSky);

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 transition-opacity duration-[1600ms] ease-out motion-reduce:transition-none"
      style={{ background: sky ? SKIES[sky] : SKIES.noite, opacity: sky ? 1 : 0 }}
    />
  );
}
