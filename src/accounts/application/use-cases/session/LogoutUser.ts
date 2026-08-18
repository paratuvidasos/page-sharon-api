import { hashToken } from "../../../../shared-kernel/infrastructure/security/tokens";
import { RefreshTokenRepository } from "../../../domain/repositories/session/RefreshTokenRepository";

export interface LogoutUserInput {
  refreshToken: string | null | undefined;
}

export class LogoutUser {
  constructor(private readonly refreshTokenRepository: RefreshTokenRepository) {}

  async execute(input: LogoutUserInput): Promise<void> {
    if (!input.refreshToken) {
      return;
    }

    const currentToken = await this.refreshTokenRepository.findByTokenHash(
      hashToken(input.refreshToken),
    );

    if (!currentToken || currentToken.isRevoked()) {
      return;
    }

    currentToken.revoke();
    await this.refreshTokenRepository.save(currentToken);
  }
}
