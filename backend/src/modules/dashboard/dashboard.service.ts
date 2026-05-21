import { hasCalibrationWarning } from "../../utils/calibration";
import { getDeviceWorkflowStatus } from "../../utils/device-workflow-status";
import { getActiveCyclesForDashboard, getDevicesForDashboard } from "./dashboard.repository";

export const dashboardService = {
  async getSummary() {
    const devices = await getDevicesForDashboard();
    const activeCycles = await getActiveCyclesForDashboard();

    const decoratedDevices = devices.map((device) => ({
      ...device,
      currentStatus: getDeviceWorkflowStatus(device.currentStatus, device.serviceCycles),
      needsCalibrationWarning: hasCalibrationWarning(
        device.serviceCycles,
        device.createdAt,
        (device as { calibrationIntervalDays?: number | null }).calibrationIntervalDays ?? null
      )
    }));

    return {
      summary: {
        totalDevices: devices.length,
        inRepair: decoratedDevices.filter((device) => device.currentStatus === "in_repair").length,
        inCalibration: decoratedDevices.filter((device) => device.currentStatus === "in_calibration").length,
        readyForHandover: decoratedDevices.filter((device) => device.currentStatus === "ready_for_handover").length,
        handedOver: decoratedDevices.filter((device) => device.currentStatus === "handed_over").length,
        needsCalibrationWarning: decoratedDevices.filter((device) => device.needsCalibrationWarning).length
      },
      recentDeviceUpdates: decoratedDevices.slice(0, 5).map((device) => ({
        id: device.id,
        serialNumber: device.serialNumber,
        name: device.name,
        currentStatus: device.currentStatus,
        needsCalibrationWarning: device.needsCalibrationWarning,
        updatedAt: device.updatedAt
      })),
      activeCycles
    };
  }
};
