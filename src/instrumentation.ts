import type { Instrumentation } from "next";

// Erros do servidor (páginas, rotas de API, ações de salvar) vão para o Rollbar.
// Só no runtime Node: o middleware roda no Edge e não carrega o Rollbar.
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const [{ reportServerError }, { stripQuery }] = await Promise.all([
    import("./lib/rollbar-server"),
    import("./lib/rollbar-config"),
  ]);
  await reportServerError(error, {
    method: request.method,
    path: stripQuery(request.path), // sem ?q=… (pode ter nome ou telefone)
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
    digest: (error as { digest?: string } | null)?.digest,
  });
};
