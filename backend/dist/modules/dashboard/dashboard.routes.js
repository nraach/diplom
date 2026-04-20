"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const dashboard_controller_1 = require("./dashboard.controller");
exports.dashboardRoutes = (0, express_1.Router)();
exports.dashboardRoutes.use(auth_middleware_1.authMiddleware);
exports.dashboardRoutes.get("/", dashboard_controller_1.dashboardController.getSummary);
