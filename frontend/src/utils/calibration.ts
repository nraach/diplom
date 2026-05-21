import { Device } from "../types/device";

export const DEFAULT_CALIBRATION_INTERVAL_DAYS = 30;

export function getCalibrationWarningText(device: Pick<Device, "needsCalibrationWarning">) {
  return device.needsCalibrationWarning ? "Требуется калибровка" : "Калибровка в норме";
}
