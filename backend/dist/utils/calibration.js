"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLastCompletedCalibration = getLastCompletedCalibration;
exports.hasCalibrationWarning = hasCalibrationWarning;
const client_1 = require("@prisma/client");
const CALIBRATION_WARNING_DAYS = 10;
const DAY_MS = 24 * 60 * 60 * 1000;
function getLastCompletedCalibration(cycles) {
    return cycles
        .filter((cycle) => cycle.type === client_1.ServiceCycleType.calibration && cycle.status === client_1.ServiceCycleStatus.handed_over)
        .sort((a, b) => getCycleDate(b).getTime() - getCycleDate(a).getTime())[0];
}
function hasCalibrationWarning(cycles, deviceCreatedAt) {
    const lastCalibration = getLastCompletedCalibration(cycles);
    if (!lastCalibration) {
        return Date.now() - deviceCreatedAt.getTime() > CALIBRATION_WARNING_DAYS * DAY_MS;
    }
    return Date.now() - getCycleDate(lastCalibration).getTime() > CALIBRATION_WARNING_DAYS * DAY_MS;
}
function getCycleDate(cycle) {
    return cycle.closedAt ?? cycle.handedOverAt ?? cycle.createdAt;
}
