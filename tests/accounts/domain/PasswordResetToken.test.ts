import {
  PasswordResetToken,
  PasswordResetTokenProps,
} from "../../../src/accounts/domain/entities/password-reset/PasswordResetToken";
import { describeExpiringTokenBehavior } from "./expiring-token.shared";

function build(overrides: Partial<PasswordResetTokenProps>): PasswordResetToken {
  return PasswordResetToken.create({
    id: "token-1",
    userId: "user-1",
    tokenHash: "hash",
    expiresAt: new Date("2026-06-01T00:00:00.000Z"),
    usedAt: null,
    ...overrides,
  });
}

describeExpiringTokenBehavior("PasswordResetToken", build);
