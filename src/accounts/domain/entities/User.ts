import { Currency } from "../../../shared-kernel/domain/enums/Currency";
import { Locale } from "../../../shared-kernel/domain/enums/Locale";
import { UserRole } from "../enums/UserRole";
import { UserStatus } from "../enums/UserStatus";
import { InvalidUserStatusTransitionException } from "../exceptions/InvalidUserStatusTransitionException";
import { PasswordAlreadySetException } from "../exceptions/profile/PasswordAlreadySetException";
import { Email } from "../value-objects/Email";
import { Address } from "./addresses/Address";

export interface UserProps {
  id: string;
  email: Email;
  /** Null cuando la cuenta se creó por un proveedor externo (Google/Clerk) y nunca se le definió contraseña propia. */
  passwordHash: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  /** Puesto mostrado en el panel de empleados (ej. "Fundadora"). Solo aplica a roles de staff. */
  jobTitle: string | null;
  emailVerifiedAt: Date | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  addresses: Address[];
  /** Id del usuario en Clerk cuando la cuenta se vinculó a un login social (Google). */
  clerkUserId: string | null;
  /** [0070]: null cuando el usuario nunca eligió manualmente — la sugerencia por geo-IP no cuenta como elección. */
  preferredLocale: Locale | null;
  preferredCurrency: Currency | null;
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

  get jobTitle(): string | null {
    return this.props.jobTitle;
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

  hasPassword(): boolean {
    return this.props.passwordHash !== null;
  }

  get clerkUserId(): string | null {
    return this.props.clerkUserId;
  }

  /**
   * Primera contraseña de una cuenta que hasta ahora solo tenía login social
   * (Google vía Clerk). No sirve para cambiar una contraseña existente —
   * eso pasa por el flujo normal de reset/cambio de contraseña.
   */
  setInitialPassword(passwordHash: string): void {
    if (this.hasPassword()) {
      throw new PasswordAlreadySetException();
    }
    this.props.passwordHash = passwordHash;
  }

  /**
   * Vincula esta cuenta a una identidad de Clerk (login con Google). El email
   * ya viene verificado por Google, así que también cierra la verificación
   * propia si todavía estaba pendiente.
   */
  linkClerkIdentity(clerkUserId: string, now: Date = new Date()): void {
    this.props.clerkUserId = clerkUserId;
    if (!this.isEmailVerified()) {
      this.markEmailAsVerified(now);
    }
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

  /** Edición de un miembro de staff desde el panel de empleados — no aplica a clientes. */
  updateEmployeeProfile(input: { firstName: string; lastName: string; jobTitle: string | null; role: UserRole }): void {
    this.props.firstName = input.firstName;
    this.props.lastName = input.lastName;
    this.props.jobTitle = input.jobTitle;
    this.props.role = input.role;
  }

  get preferredLocale(): Locale | null {
    return this.props.preferredLocale;
  }

  get preferredCurrency(): Currency | null {
    return this.props.preferredCurrency;
  }

  /**
   * [0070]: guarda una elección manual de idioma/moneda. Solo se llama desde
   * `PUT /localization/preferences` — nunca desde la sugerencia por geo-IP,
   * que no debe pisar lo que el usuario ya eligió.
   */
  updatePreferences(input: { locale?: Locale; currency?: Currency }): void {
    if (input.locale !== undefined) {
      this.props.preferredLocale = input.locale;
    }
    if (input.currency !== undefined) {
      this.props.preferredCurrency = input.currency;
    }
  }

  /**
   * Elimina/anonimiza los datos personales identificables del usuario
   * (email, nombre, teléfono, foto, contraseña) para cumplir con el
   * derecho de eliminación, dejando el registro como un "tombstone"
   * inutilizable en vez de borrar la fila (el borrado físico y el
   * soft-delete los coordina el repositorio).
   */
  anonymize(anonymizedEmail: Email, unusablePasswordHash: string): void {
    this.props.email = anonymizedEmail;
    this.props.passwordHash = unusablePasswordHash;
    this.props.firstName = "Usuario";
    this.props.lastName = "eliminado";
    this.props.phone = null;
    this.props.avatarUrl = null;
    this.props.clerkUserId = null;
    this.props.status = UserStatus.DELETED;
  }

  /**
   * [0063]: bloqueo temporal desde el panel administrativo ante actividad
   * sospechosa. Distinto de `anonymize` (borrado permanente e irreversible) —
   * acá los datos del usuario quedan intactos, solo se le impide operar.
   */
  suspend(): void {
    if (this.props.status === UserStatus.DELETED) {
      throw new InvalidUserStatusTransitionException(this.props.status, UserStatus.SUSPENDED);
    }
    this.props.status = UserStatus.SUSPENDED;
  }

  reactivate(): void {
    if (this.props.status !== UserStatus.SUSPENDED && this.props.status !== UserStatus.INACTIVE) {
      throw new InvalidUserStatusTransitionException(this.props.status, UserStatus.ACTIVE);
    }
    this.props.status = UserStatus.ACTIVE;
  }

  toProps(): UserProps {
    return { ...this.props, addresses: this.addresses };
  }
}
