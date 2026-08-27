import { Category } from "../../../domain/entities/Category";
import { CategoryOrmEntity } from "../entities/CategoryOrmEntity";

export class CategoryMapper {
  static toOrm(category: Category): CategoryOrmEntity {
    const props = category.toProps();

    const orm = new CategoryOrmEntity();
    orm.id = props.id;
    orm.name = props.name;
    orm.slug = props.slug;
    orm.parentId = props.parentId;
    orm.createdAt = props.createdAt;
    orm.updatedAt = props.updatedAt;
    return orm;
  }

  static toDomain(orm: CategoryOrmEntity): Category {
    return Category.reconstitute({
      id: orm.id,
      name: orm.name,
      slug: orm.slug,
      parentId: orm.parentId,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }
}
