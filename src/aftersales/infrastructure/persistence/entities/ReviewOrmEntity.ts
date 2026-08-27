import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";
import { ReviewStatus } from "../../../domain/enums/ReviewStatus";

// Sin FK a "users" ni a catalog.products: aftersales es dueño de su propia
// tabla y no cruza esquemas con otros módulos (ver regla 4 del CLAUDE.md
// del repo).
@Entity({ name: "reviews" })
@Index("ux_reviews_product_id_user_id", ["productId", "userId"], { unique: true })
export class ReviewOrmEntity {
  @PrimaryColumn("uuid", { default: () => "uuidv7()" })
  id!: string;

  @Column({ name: "product_id", type: "uuid" })
  @Index("ix_reviews_product_id")
  productId!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ type: "smallint" })
  rating!: number;

  @Column({ type: "text" })
  comment!: string;

  // [0064]: default APPROVED para no ocultar reseñas ya existentes al
  // desplegar la migración — el comportamiento actual (auto-publicar) se
  // preserva salvo que el admin encienda REVIEWS_REQUIRE_MODERATION.
  @Column({ type: "enum", enum: ReviewStatus, default: ReviewStatus.APPROVED })
  @Index("ix_reviews_status")
  status!: ReviewStatus;

  @Column({ name: "rejection_reason", type: "varchar", length: 300, nullable: true })
  rejectionReason!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
