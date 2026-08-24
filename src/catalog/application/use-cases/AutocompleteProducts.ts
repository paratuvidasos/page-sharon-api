import { ProductQueryRepository, ProductSuggestion } from "../../domain/repositories/ProductQueryRepository";

export interface AutocompleteProductsInput {
  term: string;
}

const SUGGESTION_LIMIT = 8;

/**
 * Si el término viene vacío devuelve sin resultados en vez de listar
 * productos al azar — no tiene sentido "autocompletar" sin haber escrito
 * nada.
 */
export class AutocompleteProducts {
  constructor(private readonly productQueryRepository: ProductQueryRepository) {}

  async execute(input: AutocompleteProductsInput): Promise<ProductSuggestion[]> {
    const term = input.term.trim();
    if (term.length === 0) {
      return [];
    }
    return this.productQueryRepository.suggestByPrefix(term, SUGGESTION_LIMIT);
  }
}
