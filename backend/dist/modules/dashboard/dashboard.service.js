"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardService = void 0;
const calibration_1 = require("../../utils/calibration");
const dashboard_repository_1 = require("./dashboard.repository");
exports.dashboardService = {
    async getSummary(role) {
        const devices = await (0, dashboard_repository_1.getDevicesForDashboard)();
        const activeCycles = await (0, dashboard_repository_1.getActiveCyclesForDashboard)();
        const recentAuditActions = role === "admin" ? await (0, dashboard_repository_1.getRecentAuditActionsForDashboard)() : [];
        const devicesWithCalibrationWarning = devices.map((device) => ({
            ...device,
            needsCalibrationWarning: (0, calibration_1.hasCalibrationWarning)(device.serviceCycles, device.createdAt)
        }));
        return {
            summary: {
                totalDevices: devices.length,
                inRepair: devices.filter((device) => device.currentStatus === "in_repair").length,
                inCalibration: devices.filter((device) => device.currentStatus === "in_calibration").length,
                readyForHandover: devices.filter((device) => device.currentStatus === "ready_for_handover").length,
                handedOver: devices.filter((device) => device.currentStatus === "handed_over").length,
                needsCalibrationWarning: devicesWithCalibrationWarning.filter((device) => device.needsCalibrationWarning).length
            },
            recentDeviceUpdates: devicesWithCalibrationWarning.slice(0, 5).map((device) => ({
                id: device.id,
                serialNumber: device.serialNumber,
                name: device.name,
                currentStatus: device.currentStatus,
                needsCalibrationWarning: device.needsCalibrationWarning,
                updatedAt: device.updatedAt
            })),
            activeCycles,
            recentAuditActions
        };
    }
};
