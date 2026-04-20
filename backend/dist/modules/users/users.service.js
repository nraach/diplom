"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersService = void 0;
const errors_1 = require("../../utils/errors");
const audit_1 = require("../../utils/audit");
const users_repository_1 = require("./users.repository");
exports.usersService = {
    list() {
        return (0, users_repository_1.listUsers)();
    },
    async approve(id, actorUserId) {
        const user = await (0, users_repository_1.findUserById)(id);
        if (!user) {
            throw new errors_1.AppError(404, "Пользователь не найден");
        }
        const updatedUser = await (0, users_repository_1.updateUserStatus)(id, "active");
        await (0, audit_1.createAuditLog)({
            userId: actorUserId,
            entityType: "user",
            entityId: id,
            action: "approve_user",
            oldValue: (0, audit_1.toAuditValue)({ status: user.status }),
            newValue: (0, audit_1.toAuditValue)({ status: updatedUser.status })
        });
        return updatedUser;
    },
    async block(id, actorUserId) {
        const user = await (0, users_repository_1.findUserById)(id);
        if (!user) {
            throw new errors_1.AppError(404, "Пользователь не найден");
        }
        const updatedUser = await (0, users_repository_1.updateUserStatus)(id, "blocked");
        await (0, audit_1.createAuditLog)({
            userId: actorUserId,
            entityType: "user",
            entityId: id,
            action: "block_user",
            oldValue: (0, audit_1.toAuditValue)({ status: user.status }),
            newValue: (0, audit_1.toAuditValue)({ status: updatedUser.status })
        });
        return updatedUser;
    },
    async changeRole(id, role, actorUserId) {
        const user = await (0, users_repository_1.findUserById)(id);
        if (!user) {
            throw new errors_1.AppError(404, "Пользователь не найден");
        }
        const updatedUser = await (0, users_repository_1.updateUserRole)(id, role);
        await (0, audit_1.createAuditLog)({
            userId: actorUserId,
            entityType: "user",
            entityId: id,
            action: "change_user_role",
            oldValue: (0, audit_1.toAuditValue)({ role: user.role }),
            newValue: (0, audit_1.toAuditValue)({ role: updatedUser.role })
        });
        return updatedUser;
    }
};
