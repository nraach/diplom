import { ServiceCycle, ServiceCycleStatus, ServiceCycleType } from "@prisma/client";

const CALIBRATION_WARNING_DAYS = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

type CalibrationCycle = Pick<ServiceCycle, "type" | "status" | "closedAt" | "handedOverAt" | "createdAt">;

export function getLastCompletedCalibration(cycles: CalibrationCycle[]) {
  return cycles
    .filter((cycle) => cycle.type === ServiceCycleType.calibration && cycle.status === ServiceCycleStatus.handed_over)
    .sort((a, b) => getCycleDate(b).getTime() - getCycleDate(a).getTime())[0];
}

export function hasCalibrationWarning(cycles: CalibrationCycle[], deviceCreatedAt: Date) {
  const lastCalibration = getLastCompletedCalibration(cycles);

  if (!lastCalibration) {
    return Date.now() - deviceCreatedAt.getTime() > CALIBRATION_WARNING_DAYS * DAY_MS;
  }

  return Date.now() - getCycleDate(lastCalibration).getTime() > CALIBRATION_WARNING_DAYS * DAY_MS;
}

function getCycleDate(cycle: CalibrationCycle) {
  return cycle.closedAt ?? cycle.handedOverAt ?? cycle.createdAt;
}
