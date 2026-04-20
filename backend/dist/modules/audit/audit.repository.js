"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAuditLogs = listAuditLogs;
const client_1 = require("../../prisma/client");
function listAuditLogs() {
    return client_1.prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            user: {
                select: { id: true, fullName: true, email: true, role: true }
            }
        }
    });
}
