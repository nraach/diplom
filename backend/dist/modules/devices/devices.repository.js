"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDevices = listDevices;
exports.findDeviceById = findDeviceById;
exports.findDeviceBySerialNumber = findDeviceBySerialNumber;
exports.createDevice = createDevice;
exports.updateDevice = updateDevice;
const client_1 = require("../../prisma/client");
const deviceInclude = {
    serviceCycles: {
        orderBy: { createdAt: "desc" },
        include: {
            createdBy: {
                select: { id: true, fullName: true, email: true }
            },
            handedOverBy: {
                select: { id: true, fullName: true, email: true }
            }
        }
    }
};
function listDevices() {
    return client_1.prisma.device.findMany({
        orderBy: { createdAt: "desc" },
        include: deviceInclude
    });
}
function findDeviceById(id) {
    return client_1.prisma.device.findUnique({
        where: { id },
        include: deviceInclude
    });
}
function findDeviceBySerialNumber(serialNumber) {
    return client_1.prisma.device.findUnique({ where: { serialNumber } });
}
function createDevice(input) {
    return client_1.prisma.device.create({
        data: input,
        include: deviceInclude
    });
}
function updateDevice(id, input) {
    const data = {
        ...input,
        isWrittenOff: input.currentStatus === "written_off" ? true : input.isWrittenOff,
        currentStatus: input.isWrittenOff ? "written_off" : input.currentStatus
    };
    return client_1.prisma.device.update({
        where: { id },
        data,
        include: deviceInclude
    });
}
