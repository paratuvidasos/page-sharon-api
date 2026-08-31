import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { Currency } from "../../../../shared-kernel/domain/enums/Currency";
import { Locale } from "../../../../shared-kernel/domain/enums/Locale";
import { UserRole } from "../../../domain/enums/UserRole";
import { UserStatus } from "../../../domain/enums/UserStatus";
import { UserAddressOrmEntity } from "./addresses/UserAddressOrmEntity";

@Entity({ name: "users" })
@Index("ux_users_email_active", ["email"], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Index("ux_users_clerk_user_id_active", ["clerkUserId"], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class UserOrmEntity {
  @PrimaryColumn("uuid", { default: () => "uuidv7()" })
  id!: string;

  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ name: "password_hash", type: "varchar", length: 255, nullable: true })
  passwordHash!: string | null;

  @Column({ name: "clerk_user_id", type: "varchar", length: 255, nullable: true })
  clerkUserId!: string | null;

  @Column({ name: "first_name", type: "varchar", length: 100 })
  firstName!: string;

  @Column({ name: "last_name", type: "varchar", length: 100 })
  lastName!: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  phone!: string | null;

  @Column({ name: "avatar_url", type: "varchar", length: 500, nullable: true })
  avatarUrl!: string | null;

  @Column({ type: "enum", enum: UserRole, default: UserRole.CUSTOMER })
  role!: UserRole;

  @Column({ type: "enum", enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @Column({ name: "email_verified_at", type: "timestamptz", nullable: true })
  emailVerifiedAt!: Date | null;

  @Column({ name: "failed_login_attempts", type: "int", default: 0 })
  failedLoginAttempts!: number;

  @Column({ name: "locked_until", type: "timestamptz", nullable: true })
  lockedUntil!: Date | null;

  @Column({ name: "preferred_locale", type: "enum", enum: Locale, nullable: true })
  preferredLocale!: Locale | null;

  @Column({ name: "preferred_currency", type: "enum", enum: Currency, nullable: true })
  preferredCurrency!: Currency | null;

  // Sin orphanedRowAction: quitar una dirección del array y hacer save() no
  // la borra de la tabla (TypeORM la deja huérfana intacta) — probamos
  // orphanedRowAction: "delete" y falla contra la FK NOT NULL (intenta un
  // UPDATE a null antes del delete). Por eso el borrado real de una
  // dirección se hace con UserRepository.deleteAddress(), no vía cascade.
  @OneToMany(() => UserAddressOrmEntity, (address) => address.user, {
    cascade: true,
  })
  addresses!: UserAddressOrmEntity[];

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt!: Date | null;
}
