import { AuditLog } from "../types/audit";
import { apiRequest } from "./client";

export const auditApi = {
  list() {
    return apiRequest<AuditLog[]>("/audit");
  }
};
