export interface PasswordResetTokenProps {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}

export class PasswordResetToken {
  private constructor(private props: PasswordResetTokenProps) {}

  static create(props: PasswordResetTokenProps): PasswordResetToken {
    return new PasswordResetToken(props);
  }

  get id(): string {
    return this.props.id;
  }

  isUsed(): boolean {
    return this.props.usedAt !== null;
  }

  isExpired(now: Date = new Date()): boolean {
    return this.props.expiresAt <= now;
  }

  toProps(): PasswordResetTokenProps {
    return { ...this.props };
  }
}
