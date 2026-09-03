export enum UserRole {
  CUSTOMER = "CUSTOMER",
  ADMIN = "ADMIN",
  EMPLOYEE = "EMPLOYEE",
}

/** Roles que dan acceso al panel administrativo (ver requireRole en admin.module). */
export const STAFF_ROLES = [UserRole.ADMIN, UserRole.EMPLOYEE] as const;
