"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const zod_1 = require("zod");
const errors_1 = require("../utils/errors");
function errorMiddleware(error, _req, res, _next) {
    if (error instanceof errors_1.AppError) {
        return res.status(error.statusCode).json({
            message: error.message,
            details: error.details
        });
    }
    if (error instanceof zod_1.ZodError) {
        return res.status(400).json({
            message: "Ошибка валидации",
            details: error.flatten()
        });
    }
    console.error(error);
    return res.status(500).json({ message: "Внутренняя ошибка сервера" });
}
