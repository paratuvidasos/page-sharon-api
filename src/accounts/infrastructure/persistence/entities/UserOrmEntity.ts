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
import { UserRole } from "../../../domain/enums/UserRole";
import { UserStatus } from "../../../domain/enums/UserStatus";
import { UserAddressOrmEntity } from "./UserAddressOrmEntity";

@Entity({ name: "users" })
@Index("ux_users_email_active", ["email"], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class UserOrmEntity {
  @PrimaryColumn("uuid", { default: () => "uuidv7()" })
  id!: string;

  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ name: "password_hash", type: "varchar", length: 255 })
  passwordHash!: string;

  @Column({ name: "first_name", type: "varchar", length: 100 })
  firstName!: string;

  @Column({ name: "last_name", type: "varchar", length: 100 })
  lastName!: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: "enum", enum: UserRole, default: UserRole.CUSTOMER })
  role!: UserRole;

  @Column({ type: "enum", enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @Column({ name: "email_verified_at", type: "timestamptz", nullable: true })
  emailVerifiedAt!: Date | null;

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
