import { ServiceCycle, ServiceCycleStatus, ServiceCycleType } from "@prisma/client";

export const DEFAULT_CALIBRATION_INTERVAL_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

type CalibrationCycle = Pick<ServiceCycle, "type" | "status" | "closedAt" | "handedOverAt" | "createdAt">;

export function getLastCompletedCalibration(cycles: CalibrationCycle[]) {
  return cycles
    .filter((cycle) => cycle.type === ServiceCycleType.calibration && cycle.status === ServiceCycleStatus.handed_over)
    .sort((a, b) => getCycleDate(b).getTime() - getCycleDate(a).getTime())[0];
}

export function hasCalibrationWarning(
  cycles: CalibrationCycle[],
  deviceCreatedAt: Date,
  calibrationIntervalDays: number | null | undefined
) {
  const intervalDays = calibrationIntervalDays ?? DEFAULT_CALIBRATION_INTERVAL_DAYS;
  const lastCalibration = getLastCompletedCalibration(cycles);

  if (!lastCalibration) {
    return Date.now() - deviceCreatedAt.getTime() > intervalDays * DAY_MS;
  }

  return Date.now() - getCycleDate(lastCalibration).getTime() > intervalDays * DAY_MS;
}

function getCycleDate(cycle: CalibrationCycle) {
  return cycle.closedAt ?? cycle.handedOverAt ?? cycle.createdAt;
}
