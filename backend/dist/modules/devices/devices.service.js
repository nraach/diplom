"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.devicesService = void 0;
const calibration_1 = require("../../utils/calibration");
const audit_1 = require("../../utils/audit");
const errors_1 = require("../../utils/errors");
const devices_repository_1 = require("./devices.repository");
exports.devicesService = {
    async list() {
        const devices = await (0, devices_repository_1.listDevices)();
        return devices.map(withCalibrationWarning);
    },
    async get(id) {
        const device = await (0, devices_repository_1.findDeviceById)(id);
        if (!device) {
            throw new errors_1.AppError(404, "Прибор не найден");
        }
        return withCalibrationWarning(device);
    },
    async create(input, actorUserId) {
        const existingDevice = await (0, devices_repository_1.findDeviceBySerialNumber)(input.serialNumber);
        if (existingDevice) {
            throw new errors_1.AppError(409, "Серийный номер должен быть уникальным");
        }
        const device = await (0, devices_repository_1.createDevice)(input);
        await (0, audit_1.createAuditLog)({
            userId: actorUserId,
            entityType: "device",
            entityId: device.id,
            action: "create_device",
            newValue: (0, audit_1.toAuditValue)(device)
        });
        return withCalibrationWarning(device);
    },
    async update(id, input, actorUserId) {
        const device = await (0, devices_repository_1.findDeviceById)(id);
        if (!device) {
            throw new errors_1.AppError(404, "Прибор не найден");
        }
        if (input.serialNumber && input.serialNumber !== device.serialNumber) {
            const existingDevice = await (0, devices_repository_1.findDeviceBySerialNumber)(input.serialNumber);
            if (existingDevice) {
                throw new errors_1.AppError(409, "Серийный номер должен быть уникальным");
            }
        }
        const updatedDevice = await (0, devices_repository_1.updateDevice)(id, input);
        await (0, audit_1.createAuditLog)({
            userId: actorUserId,
            entityType: "device",
            entityId: id,
            action: input.currentStatus === "written_off" || input.isWrittenOff ? "write_off_device" : "update_device",
            oldValue: (0, audit_1.toAuditValue)(device),
            newValue: (0, audit_1.toAuditValue)(updatedDevice)
        });
        return withCalibrationWarning(updatedDevice);
    }
};
function withCalibrationWarning(device) {
    return {
        ...device,
        needsCalibrationWarning: (0, calibration_1.hasCalibrationWarning)(device.serviceCycles, device.createdAt)
    };
}
