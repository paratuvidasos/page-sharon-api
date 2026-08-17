import { UserRole } from "../enums/UserRole";
import { UserStatus } from "../enums/UserStatus";
import { Email } from "../value-objects/Email";
import { Address } from "./Address";

export interface UserProps {
  id: string;
  email: Email;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  addresses: Address[];
}

export class User {
  private constructor(private props: UserProps) {}

  static create(props: UserProps): User {
    return new User(props);
  }

  get id(): string {
    return this.props.id;
  }

  get email(): Email {
    return this.props.email;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get status(): UserStatus {
    return this.props.status;
  }

  get addresses(): Address[] {
    return [...this.props.addresses];
  }

  isActive(): boolean {
    return this.props.status === UserStatus.ACTIVE;
  }

  isEmailVerified(): boolean {
    return this.props.emailVerifiedAt !== null;
  }

  markEmailAsVerified(now: Date = new Date()): void {
    this.props.emailVerifiedAt = now;
  }

  get failedLoginAttempts(): number {
    return this.props.failedLoginAttempts;
  }

  get lockedUntil(): Date | null {
    return this.props.lockedUntil;
  }

  isLockedOut(now: Date = new Date()): boolean {
    return this.props.lockedUntil !== null && this.props.lockedUntil > now;
  }

  recordFailedLoginAttempt(): void {
    this.props.failedLoginAttempts += 1;
  }

  lockUntil(date: Date): void {
    this.props.lockedUntil = date;
  }

  resetFailedLoginAttempts(): void {
    this.props.failedLoginAttempts = 0;
    this.props.lockedUntil = null;
  }

  toProps(): UserProps {
    return { ...this.props, addresses: this.addresses };
  }
}
