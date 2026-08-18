import { RefreshTokenRepository } from "../../../domain/repositories/session/RefreshTokenRepository";

export interface LogoutAllSessionsInput {
  userId: string;
}

export class LogoutAllSessions {
  constructor(private readonly refreshTokenRepository: RefreshTokenRepository) {}

  async execute(input: LogoutAllSessionsInput): Promise<void> {
    await this.refreshTokenRepository.revokeAllForUser(input.userId);
  }
}
