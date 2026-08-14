export interface RefreshTokenProps {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  userAgent: string | null;
  ipAddress: string | null;
}

export class RefreshToken {
  private constructor(private props: RefreshTokenProps) {}

  static create(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(props);
  }

  get id(): string {
    return this.props.id;
  }

  isRevoked(): boolean {
    return this.props.revokedAt !== null;
  }

  isExpired(now: Date = new Date()): boolean {
    return this.props.expiresAt <= now;
  }

  toProps(): RefreshTokenProps {
    return { ...this.props };
  }
}
