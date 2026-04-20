"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const errors_1 = require("../../utils/errors");
const password_1 = require("../../utils/password");
const audit_1 = require("../../utils/audit");
const auth_repository_1 = require("./auth.repository");
exports.authService = {
    async register(input) {
        const existingUser = await (0, auth_repository_1.findUserByEmail)(input.email);
        if (existingUser) {
            throw new errors_1.AppError(409, "Email уже зарегистрирован");
        }
        const passwordHash = await (0, password_1.hashPassword)(input.password);
        const user = await (0, auth_repository_1.createPendingUser)(input, passwordHash);
        await (0, audit_1.createAuditLog)({
            userId: user.id,
            entityType: "user",
            entityId: user.id,
            action: "register",
            newValue: (0, audit_1.toAuditValue)(toSafeUser(user))
        });
        return { user: toSafeUser(user) };
    },
    async login(input) {
        const user = await (0, auth_repository_1.findUserByEmail)(input.email);
        if (!user) {
            throw new errors_1.AppError(401, "Неверный email или пароль");
        }
        const passwordMatches = await (0, password_1.comparePassword)(input.password, user.passwordHash);
        if (!passwordMatches) {
            throw new errors_1.AppError(401, "Неверный email или пароль");
        }
        if (user.status !== "active") {
            throw new errors_1.AppError(403, "Пользователь не активен");
        }
        await (0, audit_1.createAuditLog)({
            userId: user.id,
            entityType: "user",
            entityId: user.id,
            action: "login",
            newValue: (0, audit_1.toAuditValue)({ email: user.email })
        });
        const signOptions = {
            expiresIn: env_1.env.JWT_EXPIRES_IN
        };
        return {
            token: jsonwebtoken_1.default.sign({ userId: user.id }, env_1.env.JWT_SECRET, signOptions),
            user: toSafeUser(user)
        };
    }
};
function toSafeUser(user) {
    return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
    };
}
