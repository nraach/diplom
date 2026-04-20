"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cycleInclude = void 0;
exports.listCycles = listCycles;
exports.findCycleById = findCycleById;
exports.findActiveCycleByDeviceId = findActiveCycleByDeviceId;
const client_1 = require("../../prisma/client");
exports.cycleInclude = {
    device: true,
    createdBy: {
        select: { id: true, fullName: true, email: true }
    },
    handedOverBy: {
        select: { id: true, fullName: true, email: true }
    }
};
function listCycles() {
    return client_1.prisma.serviceCycle.findMany({
        orderBy: { createdAt: "desc" },
        include: exports.cycleInclude
    });
}
function findCycleById(id) {
    return client_1.prisma.serviceCycle.findUnique({
        where: { id },
        include: exports.cycleInclude
    });
}
function findActiveCycleByDeviceId(deviceId) {
    return client_1.prisma.serviceCycle.findFirst({
        where: {
            deviceId,
            status: { notIn: ["handed_over", "cancelled"] }
        }
    });
}
