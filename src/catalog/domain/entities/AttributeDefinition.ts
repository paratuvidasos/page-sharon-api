import { InvalidAttributeDefinitionException } from "../exceptions/InvalidAttributeDefinitionException";

export interface AttributeValueOption {
  value: string;
  label: string;
}

export interface AttributeDefinitionProps {
  id: string;
  key: string;
  label: string;
  values: AttributeValueOption[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAttributeDefinitionInput {
  id: string;
  key: string;
  label: string;
  values: AttributeValueOption[];
}

export interface UpdateAttributeDefinitionInput {
  label?: string;
  values?: AttributeValueOption[];
}

/**
 * [0058]: vocabulario controlado de un atributo de producto (tipo de
 * cabello, línea, ingrediente). `key` es la dimensión que hoy vive
 * hardcodeada en `ProductQueryRepository.getAvailableFilters` (hairType,
 * line, mainIngredient) — este agregado no la reemplaza en esta US, solo le
 * da al admin un lugar para mantener los valores válidos de cada una, que
 * `CreateProduct`/`UpdateProduct` ([0057]) validan contra `attributes`.
 *
 * `key` no se puede cambiar una vez creada: es lo que la identifica y lo que
 * ya está guardado en `Product.attributes` de productos existentes — permitir
 * renombrarla desincronizaría esos productos en silencio.
 */
export class AttributeDefinition {
  private constructor(private props: AttributeDefinitionProps) {}

  static create(input: CreateAttributeDefinitionInput): AttributeDefinition {
    const now = new Date();
    return new AttributeDefinition({
      id: input.id,
      key: normalizeKey(input.key),
      label: normalizeLabel(input.label),
      values: normalizeValues(input.values),
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: AttributeDefinitionProps): AttributeDefinition {
    return new AttributeDefinition(props);
  }

  get id(): string {
    return this.props.id;
  }

  get key(): string {
    return this.props.key;
  }

  update(input: UpdateAttributeDefinitionInput): void {
    if (input.label !== undefined) {
      this.props.label = normalizeLabel(input.label);
    }
    if (input.values !== undefined) {
      this.props.values = normalizeValues(input.values);
    }
    this.props.updatedAt = new Date();
  }

  toProps(): AttributeDefinitionProps {
    return { ...this.props, values: this.props.values.map((value) => ({ ...value })) };
  }
}

function normalizeKey(key: string): string {
  const trimmed = key.trim();
  if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(trimmed)) {
    throw new InvalidAttributeDefinitionException(
      "La key del atributo debe empezar por una letra y solo tener letras y números (ej. \"hairType\").",
    );
  }
  return trimmed;
}

function normalizeLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) {
    throw new InvalidAttributeDefinitionException("El atributo necesita una etiqueta visible.");
  }
  return trimmed;
}

function normalizeValues(values: AttributeValueOption[]): AttributeValueOption[] {
  const seen = new Set<string>();
  const normalized: AttributeValueOption[] = [];

  for (const option of values) {
    const value = option.value.trim();
    const label = option.label.trim();
    if (!value || !label) {
      throw new InvalidAttributeDefinitionException(
        "Cada valor del atributo necesita un value y un label.",
      );
    }
    if (seen.has(value)) {
      throw new InvalidAttributeDefinitionException(`El valor "${value}" está repetido.`);
    }
    seen.add(value);
    normalized.push({ value, label });
  }

  return normalized;
}
