import { PaginationMeta, buildPaginationMeta } from "../../../../shared-kernel/infrastructure/http/pagination";
import { EmployeeListItem, UserQueryRepository } from "../../../domain/repositories/UserQueryRepository";

export interface ListEmployeesInput {
  page: number;
  limit: number;
  search?: string;
}

export interface ListEmployeesResult {
  items: EmployeeListItem[];
  meta: PaginationMeta;
}

/** Listado de staff (roles ADMIN/EMPLOYEE) para el panel administrativo de empleados. */
export class ListEmployees {
  constructor(private readonly userQueryRepository: UserQueryRepository) {}

  async execute(input: ListEmployeesInput): Promise<ListEmployeesResult> {
    const { items, total } = await this.userQueryRepository.listEmployees(
      { search: input.search },
      { page: input.page, limit: input.limit },
    );

    return { items, meta: buildPaginationMeta(input.page, input.limit, total) };
  }
}
