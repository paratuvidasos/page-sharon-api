import { generateId } from "../../../shared-kernel/infrastructure/ids/generate-id";
import { AttributeDefinition, AttributeValueOption } from "../../domain/entities/AttributeDefinition";
import { AttributeKeyAlreadyExistsException } from "../../domain/exceptions/AttributeKeyAlreadyExistsException";
import { AttributeDefinitionRepository } from "../../domain/repositories/AttributeDefinitionRepository";

export interface CreateAttributeDefinitionInput {
  key: string;
  label: string;
  values: AttributeValueOption[];
}

/** [0058]: alta del vocabulario controlado de un atributo de producto. */
export class CreateAttributeDefinition {
  constructor(private readonly attributeDefinitionRepository: AttributeDefinitionRepository) {}

  async execute(input: CreateAttributeDefinitionInput): Promise<{ id: string }> {
    const existing = await this.attributeDefinitionRepository.findByKey(input.key.trim());
    if (existing) {
      throw new AttributeKeyAlreadyExistsException(input.key);
    }

    const attribute = AttributeDefinition.create({ id: generateId(), ...input });
    await this.attributeDefinitionRepository.save(attribute);
    return { id: attribute.id };
  }
}
