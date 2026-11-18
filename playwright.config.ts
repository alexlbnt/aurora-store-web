import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

// Testes de ponta a ponta (navegador de verdade). Rodam só no computador, contra o banco de
// DESENVOLVIMENTO do .env: veja a trava em e2e/support/db.ts. Comando: npm run test:e2e
loadEnvConfig(process.cwd());

const PORT = 3100; // não conflita com o `npm run dev` (3000)
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  // O fluxo usa um banco compartilhado: um teste por vez evita disputa de estoque.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // A primeira visita a cada página compila o código (next dev), o que pode demorar.
  timeout: 180_000,
  expect: { timeout: 30_000 },
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: BASE_URL,
    timeout: 300_000,
    reuseExistingServer: false,
    env: {
      // Sem chaves de aviso: nenhum celular recebe notificação de pedido de teste.
      VAPID_PUBLIC_KEY: "",
      VAPID_PRIVATE_KEY: "",
      NEXT_PUBLIC_SITE_URL: BASE_URL,
      AUTH_URL: BASE_URL,
      NEXTAUTH_URL: BASE_URL,
    },
  },
});
