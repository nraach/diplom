import { DeviceStatus, ServiceCycleStatus, ServiceCycleType } from "@prisma/client";

type CycleLike = {
  createdAt: Date;
  status: ServiceCycleStatus;
  type: ServiceCycleType;
};

export type DeviceWorkflowStatus = DeviceStatus | "sop" | "depot";

export function getDeviceWorkflowStatus(currentStatus: DeviceStatus, serviceCycles: CycleLike[]): DeviceWorkflowStatus {
  if (currentStatus === "written_off" || currentStatus === "handed_over" || currentStatus === "ready_for_handover") {
    return currentStatus;
  }

  const activeCycle = [...serviceCycles]
    .filter((cycle) => cycle.status !== "handed_over" && cycle.status !== "cancelled")
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0];

  if (!activeCycle) {
    return currentStatus;
  }

  if (activeCycle.status === "sop_passed" || activeCycle.status === "sop_failed") {
    return "sop";
  }

  if (activeCycle.status === "depot_passed" || activeCycle.status === "depot_failed") {
    return "depot";
  }

  if (activeCycle.status === "ready_for_handover") {
    return "ready_for_handover";
  }

  if (activeCycle.type === "repair") {
    return "in_repair";
  }

  return "in_calibration";
}
