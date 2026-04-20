import { prisma } from "../../prisma/client";

export function listAuditLogs() {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, fullName: true, email: true, role: true }
      }
    }
  });
}
