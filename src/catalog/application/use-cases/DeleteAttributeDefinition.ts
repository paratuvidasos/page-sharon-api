import { AttributeDefinitionNotFoundException } from "../../domain/exceptions/AttributeDefinitionNotFoundException";
import { AttributeDefinitionRepository } from "../../domain/repositories/AttributeDefinitionRepository";

/**
 * [0058]: baja del vocabulario controlado de un atributo. No valida contra
 * productos existentes: `Product.attributes` es un `Record<string,string>`
 * libre (ver nota en `AttributeDefinition`), así que borrar la definición no
 * deja ninguna fila huérfana ni rompe ninguna FK — solo deja de ofrecerse
 * como opción en el formulario de producto.
 */
export class DeleteAttributeDefinition {
  constructor(private readonly attributeDefinitionRepository: AttributeDefinitionRepository) {}

  async execute(input: { attributeId: string }): Promise<void> {
    const attribute = await this.attributeDefinitionRepository.findById(input.attributeId);
    if (!attribute) {
      throw new AttributeDefinitionNotFoundException();
    }
    await this.attributeDefinitionRepository.delete(input.attributeId);
  }
}
