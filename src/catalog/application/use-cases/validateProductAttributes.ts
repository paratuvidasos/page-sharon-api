import { InvalidProductException } from "../../domain/exceptions/InvalidProductException";
import { AttributeDefinitionRepository } from "../../domain/repositories/AttributeDefinitionRepository";

/**
 * [0057]: valida `Product.attributes` contra el vocabulario controlado de
 * [0058] de forma suave — una key que no está registrada como
 * `AttributeDefinition` sigue permitida (sigue siendo un
 * `Record<string,string>` libre), pero si la key SÍ está registrada, el
 * valor tiene que ser uno de los declarados. Evita que un producto quede con
 * `hairType: "rrizado"` por un typo sin bloquear atributos que el admin
 * todavía no formalizó.
 */
export async function validateAttributesAgainstDefinitions(
  attributeDefinitionRepository: AttributeDefinitionRepository,
  attributes: Record<string, string>,
): Promise<void> {
  for (const [key, value] of Object.entries(attributes)) {
    const definition = await attributeDefinitionRepository.findByKey(key);
    if (!definition) {
      continue;
    }

    const validValues = definition.toProps().values.map((option) => option.value);
    if (!validValues.includes(value)) {
      throw new InvalidProductException(
        `El valor "${value}" no es válido para el atributo "${key}". Valores válidos: ${validValues.join(", ")}.`,
      );
    }
  }
}
