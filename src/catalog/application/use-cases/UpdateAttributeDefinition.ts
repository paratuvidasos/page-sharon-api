import { AttributeValueOption } from "../../domain/entities/AttributeDefinition";
import { AttributeDefinitionNotFoundException } from "../../domain/exceptions/AttributeDefinitionNotFoundException";
import { AttributeDefinitionRepository } from "../../domain/repositories/AttributeDefinitionRepository";

export interface UpdateAttributeDefinitionInput {
  attributeId: string;
  label?: string;
  values?: AttributeValueOption[];
}

/** [0058]: edición del vocabulario controlado de un atributo (la key no se puede cambiar). */
export class UpdateAttributeDefinition {
  constructor(private readonly attributeDefinitionRepository: AttributeDefinitionRepository) {}

  async execute(input: UpdateAttributeDefinitionInput): Promise<void> {
    const attribute = await this.attributeDefinitionRepository.findById(input.attributeId);
    if (!attribute) {
      throw new AttributeDefinitionNotFoundException();
    }

    attribute.update({ label: input.label, values: input.values });
    await this.attributeDefinitionRepository.save(attribute);
  }
}
