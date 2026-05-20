import { UserRole } from "@prisma/client";
import { hasCalibrationWarning } from "../../utils/calibration";
import { getDeviceWorkflowStatus } from "../../utils/device-workflow-status";
import {
  getActiveCyclesForDashboard,
  getDevicesForDashboard,
  getRecentAuditActionsForDashboard
} from "./dashboard.repository";

export const dashboardService = {
  async getSummary(role: UserRole) {
    const devices = await getDevicesForDashboard();
    const activeCycles = await getActiveCyclesForDashboard();
    const recentAuditActions = role === "admin" ? await getRecentAuditActionsForDashboard() : [];

    const devicesWithCalibrationWarning = devices.map((device) => ({
      ...device,
      currentStatus: getDeviceWorkflowStatus(device.currentStatus, device.serviceCycles),
      needsCalibrationWarning: hasCalibrationWarning(device.serviceCycles, device.createdAt)
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
