import { describe, expect, it } from "vitest";
import {
  ROLLBAR_CLIENT_TOKEN_PATTERN,
  ROLLBAR_SCRUB_FIELDS,
  ROLLBAR_SERVER_TOKEN_PATTERN,
  findEnvToken,
  stripQuery,
} from "./rollbar-config";

describe("chaves do Rollbar", () => {
  const env = {
    ROLLBAR_AURORA_STORE_WEB_SERVER_TOKEN_1795020899: "srv",
    NEXT_PUBLIC_ROLLBAR_AURORA_STORE_WEB_CLIENT_TOKEN_1795020899: "cli",
    DATABASE_URL: "nada a ver",
  };

  it("acha as chaves criadas pela integração da Vercel", () => {
    expect(findEnvToken(env, ROLLBAR_SERVER_TOKEN_PATTERN)).toBe("srv");
    expect(findEnvToken(env, ROLLBAR_CLIENT_TOKEN_PATTERN)).toBe("cli");
  });

  it("aceita os nomes simples do guia do Rollbar", () => {
    expect(findEnvToken({ ROLLBAR_SERVER_TOKEN: "a" }, ROLLBAR_SERVER_TOKEN_PATTERN)).toBe("a");
    expect(findEnvToken({ NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN: "b" }, ROLLBAR_CLIENT_TOKEN_PATTERN)).toBe("b");
  });

  it("a chave do servidor nunca é confundida com a do navegador", () => {
    expect(findEnvToken({ NEXT_PUBLIC_ROLLBAR_X_CLIENT_TOKEN_1: "cli" }, ROLLBAR_SERVER_TOKEN_PATTERN)).toBeUndefined();
    expect(findEnvToken({ ROLLBAR_X_SERVER_TOKEN_1: "srv" }, ROLLBAR_CLIENT_TOKEN_PATTERN)).toBeUndefined();
  });

  it("sem chave (ou vazia): desligado", () => {
    expect(findEnvToken({}, ROLLBAR_SERVER_TOKEN_PATTERN)).toBeUndefined();
    expect(findEnvToken({ ROLLBAR_SERVER_TOKEN: "" }, ROLLBAR_SERVER_TOKEN_PATTERN)).toBeUndefined();
  });

  it("duas instalações: usa a mais recente", () => {
    expect(
      findEnvToken({ ROLLBAR_A_SERVER_TOKEN_100: "velha", ROLLBAR_A_SERVER_TOKEN_200: "nova" }, ROLLBAR_SERVER_TOKEN_PATTERN),
    ).toBe("nova");
  });
});

describe("privacidade", () => {
  it("esconde dados de cliente", () => {
    for (const f of ["phone", "email", "name", "shippingAddress", "cep", "q", "password"]) {
      expect(ROLLBAR_SCRUB_FIELDS).toContain(f);
    }
  });

  it("tira a busca do endereço", () => {
    expect(stripQuery("/admin/customers?q=Ana")).toBe("/admin/customers");
    expect(stripQuery("/catalog")).toBe("/catalog");
  });
});
