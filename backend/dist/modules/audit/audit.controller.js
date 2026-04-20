"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditController = void 0;
const audit_service_1 = require("./audit.service");
exports.auditController = {
    async list(_req, res, next) {
        try {
            res.json(await audit_service_1.auditService.list());
        }
        catch (error) {
            next(error);
        }
    }
};
