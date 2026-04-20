import { hasCalibrationWarning } from "../../utils/calibration";
import { createAuditLog, toAuditValue } from "../../utils/audit";
import { AppError } from "../../utils/errors";
import {
  createDevice,
  findDeviceById,
  findDeviceBySerialNumber,
  listDevices,
  updateDevice
} from "./devices.repository";
import { CreateDeviceInput, UpdateDeviceInput } from "./devices.validation";

export const devicesService = {
  async list() {
    const devices = await listDevices();
    return devices.map(withCalibrationWarning);
  },

  async get(id: string) {
    const device = await findDeviceById(id);

    if (!device) {
      throw new AppError(404, "Прибор не найден");
    }

    return withCalibrationWarning(device);
  },

  async create(input: CreateDeviceInput, actorUserId: string) {
    const existingDevice = await findDeviceBySerialNumber(input.serialNumber);

    if (existingDevice) {
      throw new AppError(409, "Серийный номер должен быть уникальным");
    }

    const device = await createDevice(input);

    await createAuditLog({
      userId: actorUserId,
      entityType: "device",
      entityId: device.id,
      action: "create_device",
      newValue: toAuditValue(device)
    });

    return withCalibrationWarning(device);
  },

  async update(id: string, input: UpdateDeviceInput, actorUserId: string) {
    const device = await findDeviceById(id);

    if (!device) {
      throw new AppError(404, "Прибор не найден");
    }

    if (input.serialNumber && input.serialNumber !== device.serialNumber) {
      const existingDevice = await findDeviceBySerialNumber(input.serialNumber);

      if (existingDevice) {
        throw new AppError(409, "Серийный номер должен быть уникальным");
      }
    }

    const updatedDevice = await updateDevice(id, input);

    await createAuditLog({
      userId: actorUserId,
      entityType: "device",
      entityId: id,
      action: input.currentStatus === "written_off" || input.isWrittenOff ? "write_off_device" : "update_device",
      oldValue: toAuditValue(device),
      newValue: toAuditValue(updatedDevice)
    });

    return withCalibrationWarning(updatedDevice);
  }
};

function withCalibrationWarning<T extends { serviceCycles: Parameters<typeof hasCalibrationWarning>[0]; createdAt: Date }>(
  device: T
) {
  return {
    ...device,
    needsCalibrationWarning: hasCalibrationWarning(device.serviceCycles, device.createdAt)
  };
}
