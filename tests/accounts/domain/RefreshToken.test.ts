import { describe, expect, it } from "vitest";
import {
  RefreshToken,
  RefreshTokenProps,
} from "../../../src/accounts/domain/entities/session/RefreshToken";

function build(overrides: Partial<RefreshTokenProps> = {}): RefreshToken {
  return RefreshToken.create({
    id: "token-1",
    userId: "user-1",
    tokenHash: "hash",
    expiresAt: new Date("2026-06-01T00:00:00.000Z"),
    revokedAt: null,
    userAgent: null,
    ipAddress: null,
    ...overrides,
  });
}

describe("RefreshToken", () => {
  it("isValid() es true cuando no está revocado ni expirado", () => {
    const token = build({ expiresAt: new Date("2026-06-01T00:00:00.000Z"), revokedAt: null });
    expect(token.isValid(new Date("2026-01-01T00:00:00.000Z"))).toBe(true);
  });

  it("isExpired() es true cuando `now` alcanza o pasa expiresAt", () => {
    const token = build({ expiresAt: new Date("2026-01-01T00:00:00.000Z") });
    expect(token.isExpired(new Date("2026-01-01T00:00:00.000Z"))).toBe(true);
  });

  it("isValid() es false si ya expiró", () => {
    const token = build({ expiresAt: new Date("2026-01-01T00:00:00.000Z"), revokedAt: null });
    expect(token.isValid(new Date("2026-01-02T00:00:00.000Z"))).toBe(false);
  });

  it("revoke()/isRevoked() marcan la revocación", () => {
    const token = build({ revokedAt: null });
    expect(token.isRevoked()).toBe(false);

    token.revoke(new Date("2026-01-01T00:00:00.000Z"));

    expect(token.isRevoked()).toBe(true);
    expect(token.toProps().revokedAt).toEqual(new Date("2026-01-01T00:00:00.000Z"));
  });

  it("isValid() es false si ya estaba revocado, aunque no haya expirado", () => {
    const token = build({ expiresAt: new Date("2026-06-01T00:00:00.000Z"), revokedAt: new Date("2026-01-01T00:00:00.000Z") });
    expect(token.isValid(new Date("2026-01-02T00:00:00.000Z"))).toBe(false);
  });

  it("expiresAt expone el valor crudo", () => {
    const expiresAt = new Date("2026-06-01T00:00:00.000Z");
    expect(build({ expiresAt }).expiresAt).toEqual(expiresAt);
  });
});
