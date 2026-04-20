"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./config/env");
const error_middleware_1 = require("./middleware/error.middleware");
const audit_routes_1 = require("./modules/audit/audit.routes");
const auth_routes_1 = require("./modules/auth/auth.routes");
const cycles_routes_1 = require("./modules/cycles/cycles.routes");
const dashboard_routes_1 = require("./modules/dashboard/dashboard.routes");
const devices_routes_1 = require("./modules/devices/devices.routes");
const users_routes_1 = require("./modules/users/users.routes");
exports.app = (0, express_1.default)();
const allowedOrigins = env_1.env.CORS_ORIGIN.split(",").map((origin) => origin.trim());
exports.app.use((0, cors_1.default)({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error("CORS origin is not allowed"));
    }
}));
exports.app.use(express_1.default.json());
exports.app.use("/uploads", express_1.default.static(path_1.default.resolve(process.cwd(), "uploads")));
exports.app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
exports.app.use("/auth", auth_routes_1.authRoutes);
exports.app.use("/users", users_routes_1.usersRoutes);
exports.app.use("/devices", devices_routes_1.devicesRoutes);
exports.app.use("/cycles", cycles_routes_1.cyclesRoutes);
exports.app.use("/audit", audit_routes_1.auditRoutes);
exports.app.use("/dashboard", dashboard_routes_1.dashboardRoutes);
exports.app.use(error_middleware_1.errorMiddleware);
