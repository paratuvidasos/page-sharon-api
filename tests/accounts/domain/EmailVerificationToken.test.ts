import {
  EmailVerificationToken,
  EmailVerificationTokenProps,
} from "../../../src/accounts/domain/entities/registration/EmailVerificationToken";
import { describeExpiringTokenBehavior } from "./expiring-token.shared";

function build(overrides: Partial<EmailVerificationTokenProps>): EmailVerificationToken {
  return EmailVerificationToken.create({
    id: "token-1",
    userId: "user-1",
    tokenHash: "hash",
    expiresAt: new Date("2026-06-01T00:00:00.000Z"),
    usedAt: null,
    ...overrides,
  });
}

describeExpiringTokenBehavior("EmailVerificationToken", build);
