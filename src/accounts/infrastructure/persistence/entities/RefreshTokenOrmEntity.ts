import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { UserOrmEntity } from "./UserOrmEntity";

@Entity({ name: "refresh_tokens" })
export class RefreshTokenOrmEntity {
  @PrimaryColumn("uuid", { default: () => "uuidv7()" })
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  @Index("ix_refresh_tokens_user_id")
  userId!: string;

  @ManyToOne(() => UserOrmEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: UserOrmEntity;

  @Column({ name: "token_hash", type: "varchar", length: 255, unique: true })
  tokenHash!: string;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt!: Date;

  @Column({ name: "revoked_at", type: "timestamptz", nullable: true })
  revokedAt!: Date | null;

  @Column({ name: "user_agent", type: "varchar", length: 255, nullable: true })
  userAgent!: string | null;

  @Column({ name: "ip_address", type: "varchar", length: 45, nullable: true })
  ipAddress!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
