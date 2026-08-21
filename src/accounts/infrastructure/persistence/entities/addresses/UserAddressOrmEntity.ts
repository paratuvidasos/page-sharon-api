import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserOrmEntity } from "../UserOrmEntity";

@Entity({ name: "user_addresses" })
export class UserAddressOrmEntity {
  @PrimaryColumn("uuid", { default: () => "uuidv7()" })
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  @Index("ix_user_addresses_user_id")
  userId!: string;

  @ManyToOne(() => UserOrmEntity, (user) => user.addresses, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user!: UserOrmEntity;

  @Column({ type: "varchar", length: 50 })
  label!: string;

  @Column({ name: "recipient_name", type: "varchar", length: 150 })
  recipientName!: string;

  @Column({ type: "varchar", length: 30 })
  phone!: string;

  @Column({ name: "country_code", type: "char", length: 2 })
  countryCode!: string;

  @Column({ name: "state_province", type: "varchar", length: 100 })
  stateProvince!: string;

  @Column({ type: "varchar", length: 100 })
  city!: string;

  @Column({ name: "postal_code", type: "varchar", length: 20 })
  postalCode!: string;

  @Column({ name: "street_line1", type: "varchar", length: 200 })
  streetLine1!: string;

  @Column({ name: "street_line2", type: "varchar", length: 200, nullable: true })
  streetLine2!: string | null;

  @Column({ name: "is_default_shipping", type: "boolean", default: false })
  isDefaultShipping!: boolean;

  @Column({ name: "is_default_billing", type: "boolean", default: false })
  isDefaultBilling!: boolean;

  @Column({ name: "is_archived", type: "boolean", default: false })
  isArchived!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
