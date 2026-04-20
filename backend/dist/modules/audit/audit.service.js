"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = void 0;
const audit_repository_1 = require("./audit.repository");
exports.auditService = {
    list() {
        return (0, audit_repository_1.listAuditLogs)();
    }
};
