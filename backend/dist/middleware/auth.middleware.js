"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const client_1 = require("../prisma/client");
const errors_1 = require("../utils/errors");
async function authMiddleware(req, _res, next) {
    const authorization = req.header("authorization");
    if (!authorization?.startsWith("Bearer ")) {
        return next(new errors_1.AppError(401, "Требуется токен авторизации"));
    }
    try {
        const token = authorization.slice("Bearer ".length);
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        const user = await client_1.prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, role: true, status: true }
        });
        if (!user) {
            return next(new errors_1.AppError(401, "Пользователь не найден"));
        }
        if (user.status !== "active") {
            return next(new errors_1.AppError(403, "Пользователь не активен"));
        }
        req.user = user;
        return next();
    }
    catch (error) {
        return next(new errors_1.AppError(401, "Недействительный токен авторизации"));
    }
}
