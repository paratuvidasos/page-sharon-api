import { DataSource, Repository } from "typeorm";
import { AttributeDefinition } from "../../domain/entities/AttributeDefinition";
import { AttributeDefinitionRepository } from "../../domain/repositories/AttributeDefinitionRepository";
import { AttributeDefinitionOrmEntity } from "./entities/AttributeDefinitionOrmEntity";
import { AttributeDefinitionMapper } from "./mappers/AttributeDefinitionMapper";

export class TypeOrmAttributeDefinitionRepository implements AttributeDefinitionRepository {
  private readonly ormRepository: Repository<AttributeDefinitionOrmEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(AttributeDefinitionOrmEntity);
  }

  async save(attribute: AttributeDefinition): Promise<void> {
    await this.ormRepository.save(AttributeDefinitionMapper.toOrm(attribute));
  }

  async findById(id: string): Promise<AttributeDefinition | null> {
    const orm = await this.ormRepository.findOne({ where: { id } });
    return orm ? AttributeDefinitionMapper.toDomain(orm) : null;
  }

  async findByKey(key: string): Promise<AttributeDefinition | null> {
    const orm = await this.ormRepository.findOne({ where: { key } });
    return orm ? AttributeDefinitionMapper.toDomain(orm) : null;
  }

  async findAll(): Promise<AttributeDefinition[]> {
    const rows = await this.ormRepository.find({ order: { label: "ASC" } });
    return rows.map((row) => AttributeDefinitionMapper.toDomain(row));
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete({ id });
  }
}
