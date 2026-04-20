import { Device } from "../types/device";

export function getCalibrationWarningText(device: Pick<Device, "needsCalibrationWarning">) {
  return device.needsCalibrationWarning ? "Требуется калибровка" : "Калибровка в норме";
}
