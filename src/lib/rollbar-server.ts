import Rollbar from "rollbar";
import {
  ROLLBAR_IGNORED_MESSAGES,
  ROLLBAR_SCRUB_FIELDS,
  ROLLBAR_SERVER_TOKEN_PATTERN,
  findEnvToken,
} from "./rollbar-config";

// Uma instância por servidor. Sem a chave (no computador local, por exemplo), nada é enviado.
let instance: Rollbar | null | undefined;

export function serverRollbar(): Rollbar | null {
  if (instance === undefined) {
    const accessToken = findEnvToken(process.env, ROLLBAR_SERVER_TOKEN_PATTERN);
    instance = accessToken
      ? new Rollbar({
          accessToken,
          environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
          codeVersion: process.env.VERCEL_GIT_COMMIT_SHA,
          // Os erros chegam pelo onRequestError (instrumentation.ts), com a rota junto.
          captureUncaught: false,
          captureUnhandledRejections: false,
          captureIp: false,
          captureEmail: false,
          captureUsername: false,
          scrubFields: ROLLBAR_SCRUB_FIELDS,
          scrubRequestBody: true,
          ignoredMessages: ROLLBAR_IGNORED_MESSAGES,
        })
      : null;
  }
  return instance;
}

/** Envia o erro e espera a confirmação (a função do servidor pode ser encerrada logo depois). */
export function reportServerError(error: unknown, context: Record<string, unknown>): Promise<void> {
  const rollbar = serverRollbar();
  if (!rollbar) return Promise.resolve();
  const err = error instanceof Error ? error : new Error(String(error));
  return new Promise((resolve) => {
    rollbar.error(err, context, () => resolve());
  });
}
