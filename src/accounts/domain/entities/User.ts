import { UserRole } from "../enums/UserRole";
import { UserStatus } from "../enums/UserStatus";
import { Email } from "../value-objects/Email";
import { Address } from "./addresses/Address";

export interface UserProps {
  id: string;
  email: Email;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
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

  findAddressById(addressId: string): Address | undefined {
    return this.props.addresses.find((address) => address.id === addressId);
  }

  hasActiveAddresses(): boolean {
    return this.props.addresses.some((address) => !address.isArchived);
  }

  addAddress(address: Address): void {
    this.props.addresses.push(address);
  }

  removeAddress(addressId: string): void {
    this.props.addresses = this.props.addresses.filter((address) => address.id !== addressId);
  }

  setDefaultShippingAddress(addressId: string): void {
    this.props.addresses.forEach((address) => {
      if (address.id === addressId) {
        address.markAsDefaultShipping();
      } else {
        address.unmarkAsDefaultShipping();
      }
    });
  }

  /**
   * Al borrar la dirección predeterminada, promueve la primera dirección
   * activa restante para que siempre quede una predeterminada mientras haya
   * al menos una dirección activa.
   */
  promoteFirstActiveAddressToDefault(): void {
    const nextDefault = this.props.addresses.find((address) => !address.isArchived);
    nextDefault?.markAsDefaultShipping();
  }

  get avatarUrl(): string | null {
    return this.props.avatarUrl;
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

  /**
   * Restablecer la contraseña por un enlace de recuperación ya prueba que el
   * usuario es dueño del correo, así que también levanta un bloqueo por
   * intentos fallidos previo.
   */
  changePassword(newPasswordHash: string): void {
    this.props.passwordHash = newPasswordHash;
    this.resetFailedLoginAttempts();
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

  /**
   * El correo no se incluye aquí a propósito: cambiarlo requiere su propio
   * flujo de reverificación, no la edición de perfil.
   */
  updateProfile(input: { firstName: string; lastName: string; phone: string | null; avatarUrl: string | null }): void {
    this.props.firstName = input.firstName;
    this.props.lastName = input.lastName;
    this.props.phone = input.phone;
    this.props.avatarUrl = input.avatarUrl;
  }

  toProps(): UserProps {
    return { ...this.props, addresses: this.addresses };
  }
}
