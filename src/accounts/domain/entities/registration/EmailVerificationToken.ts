export interface EmailVerificationTokenProps {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}

export class EmailVerificationToken {
  private constructor(private props: EmailVerificationTokenProps) {}

  static create(props: EmailVerificationTokenProps): EmailVerificationToken {
    return new EmailVerificationToken(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  isUsed(): boolean {
    return this.props.usedAt !== null;
  }

  isExpired(now: Date = new Date()): boolean {
    return this.props.expiresAt <= now;
  }

  isValid(now: Date = new Date()): boolean {
    return !this.isUsed() && !this.isExpired(now);
  }

  markAsUsed(now: Date = new Date()): void {
    this.props.usedAt = now;
  }

  toProps(): EmailVerificationTokenProps {
    return { ...this.props };
  }
}
