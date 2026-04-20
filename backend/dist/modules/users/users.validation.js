"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRoleSchema = void 0;
const zod_1 = require("zod");
exports.updateUserRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(["admin", "technical_specialist", "guest"])
});
