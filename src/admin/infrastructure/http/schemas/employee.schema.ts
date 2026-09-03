import { z } from "zod";
import { UserRole } from "../../../../accounts/domain/enums/UserRole";
import { UserStatus } from "../../../../accounts/domain/enums/UserStatus";
import {
  paginatedResponseSchema,
  PaginationQuerySchema,
} from "../../../../shared-kernel/infrastructure/http/pagination";
import { registry } from "../../../../shared-kernel/infrastructure/swagger/registry";

const StaffRoleSchema = z.enum([UserRole.ADMIN, UserRole.EMPLOYEE]);

export const ListEmployeesQuerySchema = PaginationQuerySchema.extend({
  search: z.string().min(1).max(150).optional(),
});

export const EmployeeParamsSchema = z.object({ id: z.string().uuid() });

export const CreateEmployeeRequestSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: StaffRoleSchema,
  jobTitle: z.string().min(1).max(150).nullable().optional().default(null),
});

export const UpdateEmployeeRequestSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: StaffRoleSchema,
  jobTitle: z.string().min(1).max(150).nullable().optional().default(null),
});

export const EmployeeAdminResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  jobTitle: z.string().nullable(),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus),
  createdAt: z.coerce.date(),
});

export const ListEmployeesResponseSchema = paginatedResponseSchema(EmployeeAdminResponseSchema);

registry.registerPath({
  method: "get",
  path: "/admin/employees",
  tags: ["admin"],
  summary: "Lista los empleados/staff con acceso al panel (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: { query: ListEmployeesQuerySchema },
  responses: {
    200: {
      description: "Página de empleados.",
      content: { "application/json": { schema: ListEmployeesResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/admin/employees",
  tags: ["admin"],
  summary: "Crea un empleado con acceso al panel administrativo (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: CreateEmployeeRequestSchema } } } },
  responses: {
    201: { description: "Empleado creado." },
    409: { description: "Ya existe una cuenta con ese correo." },
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/employees/{id}",
  tags: ["admin"],
  summary: "Edita nombre, puesto y rol de un empleado (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: {
    params: EmployeeParamsSchema,
    body: { content: { "application/json": { schema: UpdateEmployeeRequestSchema } } },
  },
  responses: {
    204: { description: "Empleado actualizado." },
    404: { description: "El empleado no existe." },
  },
});

registry.registerPath({
  method: "delete",
  path: "/admin/employees/{id}",
  tags: ["admin"],
  summary: "Elimina el acceso de un empleado al panel administrativo (solo administradores)",
  security: [{ bearerAuth: [] }],
  request: { params: EmployeeParamsSchema },
  responses: {
    204: { description: "Empleado eliminado." },
    404: { description: "El empleado no existe." },
  },
});
