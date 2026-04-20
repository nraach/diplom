"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cyclesService = void 0;
const client_1 = require("@prisma/client");
const client_2 = require("../../prisma/client");
const audit_1 = require("../../utils/audit");
const cycle_status_1 = require("../../utils/cycle-status");
const errors_1 = require("../../utils/errors");
const cycles_repository_1 = require("./cycles.repository");
const deviceStatusByCycleType = {
    repair: "in_repair",
    calibration: "in_calibration"
};
exports.cyclesService = {
    list() {
        return (0, cycles_repository_1.listCycles)();
    },
    async create(input, actorUserId) {
        const device = await client_2.prisma.device.findUnique({ where: { id: input.deviceId } });
        if (!device) {
            throw new errors_1.AppError(404, "Прибор не найден");
        }
        if (device.isWrittenOff || device.currentStatus === "written_off") {
            throw new errors_1.AppError(400, "Нельзя создать сервисный цикл для списанного прибора");
        }
        const activeCycle = await (0, cycles_repository_1.findActiveCycleByDeviceId)(input.deviceId);
        if (activeCycle) {
            throw new errors_1.AppError(409, "У прибора уже есть активный сервисный цикл");
        }
        const cycle = await client_2.prisma.$transaction(async (tx) => {
            const createdCycle = await tx.serviceCycle.create({
                data: {
                    deviceId: input.deviceId,
                    type: input.type,
                    status: "created",
                    comment: input.comment,
                    createdByUserId: actorUserId
                },
                include: cycles_repository_1.cycleInclude
            });
            await tx.device.update({
                where: { id: input.deviceId },
                data: { currentStatus: deviceStatusByCycleType[input.type] }
            });
            return createdCycle;
        });
        await (0, audit_1.createAuditLog)({
            userId: actorUserId,
            entityType: "service_cycle",
            entityId: cycle.id,
            action: "create_cycle",
            newValue: (0, audit_1.toAuditValue)(cycle)
        });
        return cycle;
    },
    async update(id, input, actorUserId) {
        const cycle = await (0, cycles_repository_1.findCycleById)(id);
        if (!cycle) {
            throw new errors_1.AppError(404, "Сервисный цикл не найден");
        }
        if (input.status === "handed_over") {
            return this.handover(id, {}, actorUserId);
        }
        const data = {
            sopCheck: input.sopCheck,
            depotCheck: input.depotCheck,
            readyForHandover: input.readyForHandover,
            comment: input.comment,
            status: input.status
        };
        if (input.status === "ready_for_handover") {
            data.readyForHandover = true;
        }
        const updatedCycle = await client_2.prisma.$transaction(async (tx) => {
            const result = await tx.serviceCycle.update({
                where: { id },
                data,
                include: cycles_repository_1.cycleInclude
            });
            if (input.status === "ready_for_handover") {
                await tx.device.update({
                    where: { id: cycle.deviceId },
                    data: { currentStatus: "ready_for_handover" }
                });
            }
            // TODO: Docs do not define how cancelling a cycle should affect Device.currentStatus.
            return result;
        });
        await (0, audit_1.createAuditLog)({
            userId: actorUserId,
            entityType: "service_cycle",
            entityId: id,
            action: "update_cycle",
            oldValue: (0, audit_1.toAuditValue)(cycle),
            newValue: (0, audit_1.toAuditValue)(updatedCycle)
        });
        return updatedCycle;
    },
    async handover(id, input, actorUserId) {
        const cycle = await (0, cycles_repository_1.findCycleById)(id);
        if (!cycle) {
            throw new errors_1.AppError(404, "Сервисный цикл не найден");
        }
        if (!(0, cycle_status_1.isActiveCycleStatus)(cycle.status)) {
            throw new errors_1.AppError(400, "Передача разрешена только для активного сервисного цикла");
        }
        const now = new Date();
        const updatedCycle = await client_2.prisma.$transaction(async (tx) => {
            const result = await tx.serviceCycle.update({
                where: { id },
                data: {
                    status: client_1.ServiceCycleStatus.handed_over,
                    readyForHandover: true,
                    handedOverAt: now,
                    handedOverByUserId: actorUserId,
                    closedAt: now,
                    comment: input.comment ?? cycle.comment
                },
                include: cycles_repository_1.cycleInclude
            });
            await tx.device.update({
                where: { id: cycle.deviceId },
                data: { currentStatus: "handed_over" }
            });
            return result;
        });
        await (0, audit_1.createAuditLog)({
            userId: actorUserId,
            entityType: "service_cycle",
            entityId: id,
            action: "handover",
            oldValue: (0, audit_1.toAuditValue)(cycle),
            newValue: (0, audit_1.toAuditValue)(updatedCycle)
        });
        return updatedCycle;
    }
};
