import { AttributeDefinitionProps } from "../../domain/entities/AttributeDefinition";
import { AttributeDefinitionRepository } from "../../domain/repositories/AttributeDefinitionRepository";

/** [0058]: listado completo de atributos para el panel administrativo (tabla de referencia chica, sin paginar). */
export class ListAttributeDefinitions {
  constructor(private readonly attributeDefinitionRepository: AttributeDefinitionRepository) {}

  async execute(): Promise<AttributeDefinitionProps[]> {
    const attributes = await this.attributeDefinitionRepository.findAll();
    return attributes.map((attribute) => attribute.toProps());
  }
}
