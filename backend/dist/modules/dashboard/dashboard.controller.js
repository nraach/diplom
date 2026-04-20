"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = void 0;
const dashboard_service_1 = require("./dashboard.service");
exports.dashboardController = {
    async getSummary(req, res, next) {
        try {
            const { role } = req.user;
            res.json(await dashboard_service_1.dashboardService.getSummary(role));
        }
        catch (error) {
            next(error);
        }
    }
};
