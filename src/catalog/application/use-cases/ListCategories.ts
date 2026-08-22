import { PaginationMeta, buildPaginationMeta } from "../../../shared-kernel/infrastructure/http/pagination";
import { CategoryListItem, CategoryQueryRepository } from "../../domain/repositories/CategoryQueryRepository";

export interface ListCategoriesInput {
  page: number;
  limit: number;
}

export interface ListCategoriesResult {
  items: CategoryListItem[];
  meta: PaginationMeta;
}

export class ListCategories {
  constructor(private readonly categoryQueryRepository: CategoryQueryRepository) {}

  async execute(input: ListCategoriesInput): Promise<ListCategoriesResult> {
    const { items, total } = await this.categoryQueryRepository.listAll({
      page: input.page,
      limit: input.limit,
    });

    return { items, meta: buildPaginationMeta(input.page, input.limit, total) };
  }
}
