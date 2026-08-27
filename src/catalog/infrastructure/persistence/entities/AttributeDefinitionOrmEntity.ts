import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { AttributeValueOption } from "../../../domain/entities/AttributeDefinition";

@Entity({ name: "attribute_definitions" })
export class AttributeDefinitionOrmEntity {
  @PrimaryColumn("uuid", { default: () => "uuidv7()" })
  id!: string;

  @Column({ type: "varchar", length: 60, unique: true })
  key!: string;

  @Column({ type: "varchar", length: 150 })
  label!: string;

  @Column({ type: "jsonb", default: [] })
  values!: AttributeValueOption[];

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
