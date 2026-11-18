// Configuração do Rollbar (alerta de erros) comum ao servidor e ao navegador.
// Sem dependências: usada também no next.config.ts.

/**
 * A integração da Vercel cria as chaves com o nome do recurso e um número no fim
 * (ex.: ROLLBAR_AURORA_STORE_WEB_SERVER_TOKEN_1795020899). O código procura pelo padrão,
 * então reinstalar o Rollbar não exige mudar nada aqui.
 */
export const ROLLBAR_SERVER_TOKEN_PATTERN = /^ROLLBAR_(?:.+_)?SERVER_TOKEN(?:_\d+)?$/;
export const ROLLBAR_CLIENT_TOKEN_PATTERN = /^NEXT_PUBLIC_ROLLBAR_(?:.+_)?CLIENT_TOKEN(?:_\d+)?$/;

export function findEnvToken(env: Record<string, string | undefined>, pattern: RegExp): string | undefined {
  const key = Object.keys(env)
    .filter((k) => pattern.test(k) && env[k])
    .sort()
    .pop(); // mais de uma instalação: fica a mais recente (número maior)
  return key ? env[key] : undefined;
}

/**
 * LGPD: dados de cliente nunca saem para o Rollbar. Campos com estes nomes (em formulários,
 * parâmetros de endereço e dados extras) chegam como "********".
 */
export const ROLLBAR_SCRUB_FIELDS = [
  // padrão
  "password",
  "senha",
  "secret",
  "token",
  "accessToken",
  "authorization",
  "cookie",
  // pessoa
  "name",
  "nome",
  "customerName",
  "email",
  "phone",
  "telefone",
  "whatsapp",
  "customerPhone",
  "cpf",
  // endereço
  "address",
  "endereco",
  "shippingAddress",
  "street",
  "rua",
  "cep",
  "shippingCep",
  "city",
  "shippingCity",
  // buscas digitadas podem conter nome ou telefone
  "q",
];

/** Erros que fazem parte do funcionamento normal (redirecionamento, página não encontrada). */
export const ROLLBAR_IGNORED_MESSAGES = [/NEXT_REDIRECT/, /NEXT_HTTP_ERROR_FALLBACK/, /NEXT_NOT_FOUND/, /ResizeObserver loop/];

/** Endereço sem a parte depois do "?" (pode ter busca com dado pessoal). */
export const stripQuery = (path: string) => path.split("?")[0];
