import { describe, expect, it } from "vitest";
import {
  ANNOUNCEMENT_MAX_LENGTH,
  announcementStatus,
  dismissKey,
  isSafeAnnouncementLink,
  parseAnnouncementInput,
  pickLiveAnnouncement,
  type AnnouncementView,
} from "./announcement";

const now = new Date("2026-11-20T12:00:00Z");
const base: AnnouncementView = {
  id: "a",
  message: "Frete grátis",
  linkUrl: null,
  active: true,
  startsAt: null,
  endsAt: null,
  updatedAt: "2026-11-01T00:00:00.000Z",
};

describe("announcementStatus", () => {
  it("classifica ligado, agendado, encerrado e desligado", () => {
    expect(announcementStatus(base, now)).toBe("live");
    expect(announcementStatus({ ...base, active: false }, now)).toBe("off");
    expect(announcementStatus({ ...base, startsAt: "2026-11-21T00:00:00Z" }, now)).toBe("scheduled");
    expect(announcementStatus({ ...base, endsAt: "2026-11-20T12:00:00Z" }, now)).toBe("ended");
    expect(
      announcementStatus({ ...base, startsAt: "2026-11-19T00:00:00Z", endsAt: "2026-11-21T00:00:00Z" }, now),
    ).toBe("live");
  });
});

describe("pickLiveAnnouncement", () => {
  it("escolhe o aviso no ar alterado por último", () => {
    const list = [
      { ...base, id: "velho" },
      { ...base, id: "novo", updatedAt: "2026-11-10T00:00:00.000Z" },
      { ...base, id: "agendado", startsAt: "2026-12-01T00:00:00Z", updatedAt: "2026-11-15T00:00:00.000Z" },
      { ...base, id: "desligado", active: false, updatedAt: "2026-11-16T00:00:00.000Z" },
    ];
    expect(pickLiveAnnouncement(list, now)?.id).toBe("novo");
  });

  it("devolve null quando nada está no ar", () => {
    expect(pickLiveAnnouncement([{ ...base, active: false }], now)).toBeNull();
    expect(pickLiveAnnouncement([], now)).toBeNull();
  });
});

describe("isSafeAnnouncementLink", () => {
  it("aceita caminho da loja e https", () => {
    expect(isSafeAnnouncementLink("/catalog")).toBe(true);
    expect(isSafeAnnouncementLink("/category/pijamas?page=2")).toBe(true);
    expect(isSafeAnnouncementLink("https://instagram.com/aurora")).toBe(true);
  });

  it("recusa endereços perigosos ou de outro site disfarçado", () => {
    expect(isSafeAnnouncementLink("javascript:alert(1)")).toBe(false);
    expect(isSafeAnnouncementLink("data:text/html,oi")).toBe(false);
    expect(isSafeAnnouncementLink("http://site.com")).toBe(false);
    expect(isSafeAnnouncementLink("//site-malicioso.com")).toBe(false);
    expect(isSafeAnnouncementLink("/\\site-malicioso.com")).toBe(false);
    expect(isSafeAnnouncementLink("catalog")).toBe(false);
  });
});

describe("parseAnnouncementInput", () => {
  const form = { message: "  Frete   grátis acima de R$ 200 ", linkUrl: "", active: "on", startsAt: "", endsAt: "" };

  it("limpa o texto e aceita campos opcionais vazios", () => {
    const r = parseAnnouncementInput(form);
    expect(r).toEqual({
      ok: true,
      data: { message: "Frete grátis acima de R$ 200", linkUrl: null, active: true, startsAt: null, endsAt: null },
    });
  });

  it("checkbox desmarcado vira desligado", () => {
    const r = parseAnnouncementInput({ ...form, active: null });
    expect(r.ok && r.data.active).toBe(false);
  });

  it("recusa texto vazio ou longo demais", () => {
    expect(parseAnnouncementInput({ ...form, message: "   " }).ok).toBe(false);
    expect(parseAnnouncementInput({ ...form, message: "a".repeat(ANNOUNCEMENT_MAX_LENGTH + 1) }).ok).toBe(false);
    expect(parseAnnouncementInput({ ...form, message: "a".repeat(ANNOUNCEMENT_MAX_LENGTH) }).ok).toBe(true);
  });

  it("recusa link inseguro", () => {
    expect(parseAnnouncementInput({ ...form, linkUrl: "javascript:alert(1)" }).ok).toBe(false);
  });

  it("confere as datas", () => {
    expect(parseAnnouncementInput({ ...form, startsAt: "ontem" }).ok).toBe(false);
    expect(
      parseAnnouncementInput({ ...form, startsAt: "2026-11-20T10:00:00Z", endsAt: "2026-11-20T09:00:00Z" }).ok,
    ).toBe(false);
    const r = parseAnnouncementInput({ ...form, startsAt: "2026-11-20T10:00:00.000Z", endsAt: "2026-11-27T03:00:00.000Z" });
    expect(r.ok && r.data.endsAt?.toISOString()).toBe("2026-11-27T03:00:00.000Z");
  });
});

describe("dismissKey", () => {
  it("muda quando o aviso é editado", () => {
    expect(dismissKey(base)).not.toBe(dismissKey({ ...base, updatedAt: "2026-11-02T00:00:00.000Z" }));
  });
});
