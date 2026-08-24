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

  get userId(): string {
    return this.props.userId;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  isRevoked(): boolean {
    return this.props.revokedAt !== null;
  }

  isExpired(now: Date = new Date()): boolean {
    return this.props.expiresAt <= now;
  }

  isValid(now: Date = new Date()): boolean {
    return !this.isRevoked() && !this.isExpired(now);
  }

  revoke(now: Date = new Date()): void {
    this.props.revokedAt = now;
  }

  toProps(): RefreshTokenProps {
    return { ...this.props };
  }
}
