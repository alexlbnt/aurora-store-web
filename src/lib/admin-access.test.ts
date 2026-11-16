import { describe, expect, it } from "vitest";
import { authErrorMessage, isAdminEmail, isVerifiedGoogleProfile, parseAdminEmails } from "./admin-access";

describe("parseAdminEmails", () => {
  it("usa o Gmail da marca quando a variável não está configurada", () => {
    expect(parseAdminEmails(undefined)).toEqual(["auroraadm25@gmail.com"]);
    expect(parseAdminEmails("  ")).toEqual(["auroraadm25@gmail.com"]);
  });

  it("aceita vários e-mails separados por vírgula, sem diferenciar maiúsculas", () => {
    expect(parseAdminEmails(" AuroraADM25@gmail.com , vendedora@gmail.com,")).toEqual([
      "auroraadm25@gmail.com",
      "vendedora@gmail.com",
    ]);
  });
});

describe("isAdminEmail", () => {
  const allowed = ["auroraadm25@gmail.com"];

  it("libera só e-mails da lista", () => {
    expect(isAdminEmail("auroraadm25@gmail.com", allowed)).toBe(true);
    expect(isAdminEmail("AuroraAdm25@Gmail.com", allowed)).toBe(true);
    expect(isAdminEmail("cliente@gmail.com", allowed)).toBe(false);
    expect(isAdminEmail(null, allowed)).toBe(false);
  });
});

describe("isVerifiedGoogleProfile", () => {
  it("exige e-mail confirmado pelo Google", () => {
    expect(isVerifiedGoogleProfile({ email: "a@gmail.com", email_verified: true })).toBe(true);
    expect(isVerifiedGoogleProfile({ email: "a@gmail.com", email_verified: false })).toBe(false);
    expect(isVerifiedGoogleProfile({ email: "a@gmail.com" })).toBe(false);
    expect(isVerifiedGoogleProfile({ email_verified: true })).toBe(false);
    expect(isVerifiedGoogleProfile(undefined)).toBe(false);
  });
});

describe("authErrorMessage", () => {
  it("traduz os erros do login", () => {
    expect(authErrorMessage(null)).toBeNull();
    expect(authErrorMessage("AccessDenied")).toMatch(/verificado/);
    expect(authErrorMessage("Configuration")).toMatch(/configurado/);
    expect(authErrorMessage("Qualquer")).toMatch(/Tente de novo/);
  });
});
