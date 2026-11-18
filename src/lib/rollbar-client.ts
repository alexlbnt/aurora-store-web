import type Rollbar from "rollbar";
import { ROLLBAR_IGNORED_MESSAGES, ROLLBAR_SCRUB_FIELDS } from "./rollbar-config";

// Rollbar no navegador. Carrega à parte (import dinâmico) para não pesar na primeira
// visita da loja. Sem a chave (no computador local), não carrega nada.
// A chave e o ambiente são definidos no next.config.ts a partir das variáveis da Vercel.

let loading: Promise<Rollbar | null> | null = null;

export function loadClientRollbar(): Promise<Rollbar | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const accessToken = process.env.NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN;
  if (!accessToken) return Promise.resolve(null);
  loading ??= import("rollbar")
    .then(
      ({ default: RollbarClass }) =>
        new RollbarClass({
          accessToken,
          environment: process.env.NEXT_PUBLIC_APP_ENV || "production",
          codeVersion: process.env.NEXT_PUBLIC_APP_VERSION,
          captureUncaught: true,
          captureUnhandledRejections: true,
          captureIp: false,
          captureEmail: false,
          captureUsername: false,
          scrubFields: ROLLBAR_SCRUB_FIELDS,
          scrubTelemetryInputs: true, // o que a pessoa digita não vai junto
          autoInstrument: {
            log: false,
            dom: true,
            navigation: true,
            connectivity: true,
            network: true,
            networkRequestBody: false,
            networkResponseBody: false,
            networkRequestHeaders: false,
          },
          ignoredMessages: ROLLBAR_IGNORED_MESSAGES,
        }),
    )
    .catch(() => null); // bloqueador de anúncios etc.: segue sem alerta
  return loading;
}

/** Erro pego por uma tela de erro (error.tsx): não chega como "não tratado", então avisamos aqui. */
export function reportClientError(error: Error & { digest?: string }): void {
  void loadClientRollbar().then((rollbar) => rollbar?.error(error, { digest: error.digest }));
}
