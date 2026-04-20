import { User } from "./user";

export type AuditLog = {
  id: string;
  userId: string;
  user?: Pick<User, "id" | "fullName" | "email" | "role">;
  entityType: string;
  entityId: string;
  action: string;
  oldValue: unknown;
  newValue: unknown;
  createdAt: string;
};
