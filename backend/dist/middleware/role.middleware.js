"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
const errors_1 = require("../utils/errors");
function requireRole(...roles) {
    return (req, _res, next) => {
        const user = req.user;
        if (!user || !roles.includes(user.role)) {
            return next(new errors_1.AppError(403, "Доступ запрещен"));
        }
        return next();
    };
}
