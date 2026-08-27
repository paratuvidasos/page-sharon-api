import { AttributeDefinition } from "../../../domain/entities/AttributeDefinition";
import { AttributeDefinitionOrmEntity } from "../entities/AttributeDefinitionOrmEntity";

export class AttributeDefinitionMapper {
  static toOrm(attribute: AttributeDefinition): AttributeDefinitionOrmEntity {
    const props = attribute.toProps();

    const orm = new AttributeDefinitionOrmEntity();
    orm.id = props.id;
    orm.key = props.key;
    orm.label = props.label;
    orm.values = props.values;
    orm.createdAt = props.createdAt;
    orm.updatedAt = props.updatedAt;
    return orm;
  }

  static toDomain(orm: AttributeDefinitionOrmEntity): AttributeDefinition {
    return AttributeDefinition.reconstitute({
      id: orm.id,
      key: orm.key,
      label: orm.label,
      values: orm.values,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }
}
