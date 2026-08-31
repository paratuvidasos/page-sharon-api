import { InvalidCategoryException } from "../exceptions/InvalidCategoryException";

export interface CategoryProps {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryInput {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  parentId?: string | null;
}

/**
 * [0058]: agregado raíz de una categoría del catálogo. Hasta ahora las
 * categorías solo existían como filas sembradas por una migración — no había
 * caso de uso de creación/edición porque no estaba en el backlog. Con el
 * panel administrativo esos datos pasan a venir de afuera, así que las
 * invariantes (nombre y slug no vacíos, no ser padre de sí misma) tienen que
 * vivir acá.
 */
export class Category {
  private constructor(private props: CategoryProps) {}

  static create(input: CreateCategoryInput): Category {
    const parentId = input.parentId ?? null;
    if (parentId === input.id) {
      throw new InvalidCategoryException("Una categoría no puede ser su propio padre.");
    }

    const now = new Date();
    return new Category({
      id: input.id,
      name: normalizeName(input.name),
      slug: normalizeSlug(input.slug),
      parentId,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: CategoryProps): Category {
    return new Category(props);
  }

  get id(): string {
    return this.props.id;
  }

  get slug(): string {
    return this.props.slug;
  }

  get parentId(): string | null {
    return this.props.parentId;
  }

  update(input: UpdateCategoryInput): void {
    if (input.name !== undefined) {
      this.props.name = normalizeName(input.name);
    }
    if (input.slug !== undefined) {
      this.props.slug = normalizeSlug(input.slug);
    }
    if (input.parentId !== undefined) {
      if (input.parentId === this.props.id) {
        throw new InvalidCategoryException("Una categoría no puede ser su propio padre.");
      }
      this.props.parentId = input.parentId;
    }
    this.props.updatedAt = new Date();
  }

  toProps(): CategoryProps {
    return { ...this.props };
  }
}

function normalizeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new InvalidCategoryException("La categoría necesita un nombre.");
  }
  return trimmed;
}

function normalizeSlug(slug: string): string {
  const trimmed = slug.trim().toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(trimmed)) {
    throw new InvalidCategoryException(
      "El slug solo puede tener minúsculas, números y guiones (ej. \"shampoos-rizado\").",
    );
  }
  return trimmed;
}
