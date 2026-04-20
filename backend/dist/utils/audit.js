"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = createAuditLog;
exports.toAuditValue = toAuditValue;
const client_1 = require("@prisma/client");
const client_2 = require("../prisma/client");
function createAuditLog(input) {
    return client_2.prisma.auditLog.create({
        data: {
            userId: input.userId,
            entityType: input.entityType,
            entityId: input.entityId,
            action: input.action,
            oldValue: input.oldValue ?? client_1.Prisma.JsonNull,
            newValue: input.newValue ?? client_1.Prisma.JsonNull
        }
    });
}
function toAuditValue(value) {
    return JSON.parse(JSON.stringify(value));
}
