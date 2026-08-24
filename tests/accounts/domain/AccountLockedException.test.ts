import { describe, expect, it } from "vitest";
import { AccountLockedException } from "../../../src/accounts/domain/exceptions/session/AccountLockedException";

describe("AccountLockedException", () => {
  it("expone code y statusCode fijos", () => {
    const exception = new AccountLockedException(5);
    expect(exception.code).toBe("ACCOUNT_LOCKED");
    expect(exception.statusCode).toBe(423);
  });

  it("pluraliza 'minutos' cuando son más de uno", () => {
    expect(new AccountLockedException(5).message).toContain("5 minutos");
  });

  it("no pluraliza cuando es exactamente 1 minuto", () => {
    expect(new AccountLockedException(1).message).toContain("1 minuto.");
    expect(new AccountLockedException(1).message).not.toContain("1 minutos");
  });

  it("redondea hacia arriba a mínimo 1 minuto para valores <= 0", () => {
    expect(new AccountLockedException(0).message).toContain("1 minuto.");
    expect(new AccountLockedException(-3).message).toContain("1 minuto.");
  });
});
