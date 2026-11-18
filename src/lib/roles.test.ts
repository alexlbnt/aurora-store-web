import { describe, expect, it } from "vitest";
import { isAdminUser } from "./roles";

describe("isAdminUser", () => {
  it("só ADMIN é administrador", () => {
    expect(isAdminUser({ role: "ADMIN" })).toBe(true);
    expect(isAdminUser({ role: "USER" })).toBe(false);
    expect(isAdminUser({})).toBe(false);
    expect(isAdminUser(null)).toBe(false);
    expect(isAdminUser(undefined)).toBe(false);
  });
});
