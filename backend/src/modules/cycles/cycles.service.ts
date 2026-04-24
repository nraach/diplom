import { DeviceStatus, Prisma, ServiceCycleStatus } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { createAuditLog, toAuditValue } from "../../utils/audit";
import { isActiveCycleStatus } from "../../utils/cycle-status";
import { AppError } from "../../utils/errors";
import { cycleInclude, findActiveCycleByDeviceId, findCycleById, listCycles } from "./cycles.repository";
import { CreateCycleInput, HandoverCycleInput, UpdateCycleInput } from "./cycles.validation";

const deviceStatusByCycleType = {
  repair: "in_repair",
  calibration: "in_calibration"
} satisfies Record<string, DeviceStatus>;

function getDeviceStatusAfterCycleUpdate(
  nextStatus: ServiceCycleStatus | undefined,
  cycleType: keyof typeof deviceStatusByCycleType
): DeviceStatus | null {
  if (!nextStatus) {
    return null;
  }

  if (nextStatus === "ready_for_handover") {
    return "ready_for_handover";
  }

  if (nextStatus === "cancelled") {
    return null;
  }

  if (nextStatus === "handed_over") {
    return "handed_over";
  }

  return deviceStatusByCycleType[cycleType];
}

export const cyclesService = {
  list() {
    return listCycles();
  },

  async create(input: CreateCycleInput, actorUserId: string) {
    const device = await prisma.device.findUnique({ where: { id: input.deviceId } });

    if (!device) {
      throw new AppError(404, "Прибор не найден");
    }

    if (device.isWrittenOff || device.currentStatus === "written_off") {
      throw new AppError(400, "Нельзя создать сервисный цикл для списанного прибора");
    }

    const activeCycle = await findActiveCycleByDeviceId(input.deviceId);

    if (activeCycle) {
      throw new AppError(409, "У прибора уже есть активный сервисный цикл");
    }

    const cycle = await prisma.$transaction(async (tx) => {
      const createdCycle = await tx.serviceCycle.create({
        data: {
          deviceId: input.deviceId,
          type: input.type,
          status: "created",
          comment: input.comment,
          createdByUserId: actorUserId
        },
        include: cycleInclude
      });

      await tx.device.update({
        where: { id: input.deviceId },
        data: { currentStatus: deviceStatusByCycleType[input.type] }
      });

      return createdCycle;
    });

    await createAuditLog({
      userId: actorUserId,
      entityType: "service_cycle",
      entityId: cycle.id,
      action: "create_cycle",
      newValue: toAuditValue(cycle)
    });

    return cycle;
  },

  async update(id: string, input: UpdateCycleInput, actorUserId: string) {
    const cycle = await findCycleById(id);

    if (!cycle) {
      throw new AppError(404, "Сервисный цикл не найден");
    }

    if (input.status === "handed_over") {
      return this.handover(id, {}, actorUserId);
    }

    const data: Prisma.ServiceCycleUpdateInput = {
      sopCheck: input.sopCheck,
      depotCheck: input.depotCheck,
      readyForHandover: input.readyForHandover,
      comment: input.comment,
      status: input.status
    };

    if (input.status === "ready_for_handover") {
      data.readyForHandover = true;
    }

    if (cycle.status === "handed_over" && input.status) {
      data.handedOverAt = null;
      data.handedOverBy = { disconnect: true };
      data.closedAt = null;

      if (input.status !== "ready_for_handover" && input.readyForHandover === undefined) {
        data.readyForHandover = false;
      }
    }

    const updatedCycle = await prisma.$transaction(async (tx) => {
      const result = await tx.serviceCycle.update({
        where: { id },
        data,
        include: cycleInclude
      });

      const nextDeviceStatus = getDeviceStatusAfterCycleUpdate(input.status, cycle.type);

      if (nextDeviceStatus) {
        await tx.device.update({
          where: { id: cycle.deviceId },
          data: { currentStatus: nextDeviceStatus }
        });
      }

      // TODO: Docs do not define how cancelling a cycle should affect Device.currentStatus.
      return result;
    });

    await createAuditLog({
      userId: actorUserId,
      entityType: "service_cycle",
      entityId: id,
      action: "update_cycle",
      oldValue: toAuditValue(cycle),
      newValue: toAuditValue(updatedCycle)
    });

    return updatedCycle;
  },

  async handover(id: string, input: HandoverCycleInput, actorUserId: string) {
    const cycle = await findCycleById(id);

    if (!cycle) {
      throw new AppError(404, "Сервисный цикл не найден");
    }

    if (!isActiveCycleStatus(cycle.status)) {
      throw new AppError(400, "Передача разрешена только для активного сервисного цикла");
    }

    const now = new Date();
    const updatedCycle = await prisma.$transaction(async (tx) => {
      const result = await tx.serviceCycle.update({
        where: { id },
        data: {
          status: ServiceCycleStatus.handed_over,
          readyForHandover: true,
          handedOverAt: now,
          handedOverByUserId: actorUserId,
          closedAt: now,
          comment: input.comment ?? cycle.comment
        },
        include: cycleInclude
      });

      await tx.device.update({
        where: { id: cycle.deviceId },
        data: { currentStatus: "handed_over" }
      });

      return result;
    });

    await createAuditLog({
      userId: actorUserId,
      entityType: "service_cycle",
      entityId: id,
      action: "handover",
      oldValue: toAuditValue(cycle),
      newValue: toAuditValue(updatedCycle)
    });

    return updatedCycle;
  }
};
