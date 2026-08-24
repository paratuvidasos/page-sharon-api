import { describe, expect, it } from "vitest";

/**
 * PasswordResetToken y EmailVerificationToken tienen exactamente la misma
 * forma (expira, se usa una vez, isValid = !usado && !expirado) — se prueban
 * con la misma batería en vez de duplicar los casos en dos archivos.
 */
export interface ExpiringToken {
  isUsed(): boolean;
  isExpired(now?: Date): boolean;
  isValid(now?: Date): boolean;
  markAsUsed(now?: Date): void;
  toProps(): { usedAt: Date | null };
}

export function describeExpiringTokenBehavior<T extends ExpiringToken>(
  name: string,
  build: (overrides: { expiresAt?: Date; usedAt?: Date | null }) => T,
) {
  describe(`${name} (comportamiento compartido de token con expiración)`, () => {
    it("isValid() es true cuando no está usado ni expirado", () => {
      const token = build({ expiresAt: new Date("2026-06-01T00:00:00.000Z"), usedAt: null });
      expect(token.isValid(new Date("2026-01-01T00:00:00.000Z"))).toBe(true);
    });

    it("isExpired() es true cuando `now` alcanza o pasa expiresAt", () => {
      const token = build({ expiresAt: new Date("2026-01-01T00:00:00.000Z") });
      expect(token.isExpired(new Date("2026-01-01T00:00:00.000Z"))).toBe(true);
      expect(token.isExpired(new Date("2026-01-02T00:00:00.000Z"))).toBe(true);
    });

    it("isExpired() es false antes de expiresAt", () => {
      const token = build({ expiresAt: new Date("2026-06-01T00:00:00.000Z") });
      expect(token.isExpired(new Date("2026-01-01T00:00:00.000Z"))).toBe(false);
    });

    it("isValid() es false si ya expiró, aunque no esté usado", () => {
      const token = build({ expiresAt: new Date("2026-01-01T00:00:00.000Z"), usedAt: null });
      expect(token.isValid(new Date("2026-01-02T00:00:00.000Z"))).toBe(false);
    });

    it("isUsed()/isValid() reflejan markAsUsed()", () => {
      const token = build({ expiresAt: new Date("2026-06-01T00:00:00.000Z"), usedAt: null });
      expect(token.isUsed()).toBe(false);

      token.markAsUsed(new Date("2026-01-01T00:00:00.000Z"));

      expect(token.isUsed()).toBe(true);
      expect(token.isValid(new Date("2026-01-02T00:00:00.000Z"))).toBe(false);
      expect(token.toProps().usedAt).toEqual(new Date("2026-01-01T00:00:00.000Z"));
    });

    it("isValid() es false si ya estaba usado, aunque no haya expirado", () => {
      const token = build({ expiresAt: new Date("2026-06-01T00:00:00.000Z"), usedAt: new Date("2026-01-01T00:00:00.000Z") });
      expect(token.isValid(new Date("2026-01-02T00:00:00.000Z"))).toBe(false);
    });
  });
}
