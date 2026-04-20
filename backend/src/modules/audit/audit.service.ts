import { listAuditLogs } from "./audit.repository";

export const auditService = {
  list() {
    return listAuditLogs();
  }
};
