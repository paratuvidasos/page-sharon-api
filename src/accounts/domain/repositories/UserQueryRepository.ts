import { UserRole } from "../enums/UserRole";
import { UserStatus } from "../enums/UserStatus";

export interface CustomerListFilter {
  /** Búsqueda libre por nombre o email. */
  search?: string;
  status?: UserStatus;
  role?: UserRole;
}

export interface CustomerListPagination {
  page: number;
  limit: number;
}

export interface CustomerListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: UserStatus;
  createdAt: Date;
}

export interface CustomerListPage {
  items: CustomerListItem[];
  total: number;
}

export interface EmployeeListFilter {
  search?: string;
}

export interface EmployeeListPagination {
  page: number;
  limit: number;
}

export interface EmployeeListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
}

export interface EmployeeListPage {
  items: EmployeeListItem[];
  total: number;
}

/**
 * [0063]: read model de solo lectura para el listado de clientes del panel
 * administrativo. No existía ningún query repository de `accounts` hasta
 * ahora — `UserRepository` es de escritura únicamente (ver "Repository
 * pattern" del CLAUDE.md del repo). El resumen de compras (pedidos/gastado)
 * no vive acá: `accounts` no puede leer tablas de `orders` (regla 4); lo
 * resuelve el caso de uso vía el puerto `GetOrderSummaryForUsers`.
 */
export interface UserQueryRepository {
  listCustomers(filter: CustomerListFilter, pagination: CustomerListPagination): Promise<CustomerListPage>;
  /** [Empleados]: listado de staff (roles ADMIN/EMPLOYEE) para el panel administrativo. */
  listEmployees(filter: EmployeeListFilter, pagination: EmployeeListPagination): Promise<EmployeeListPage>;
}
