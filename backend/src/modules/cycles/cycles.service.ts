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

type CycleEntity = NonNullable<Awaited<ReturnType<typeof findCycleById>>>;

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function normalizeOptionalText(value: string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function parseOptionalDate(value: string | null | undefined, fieldLabel: string) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(400, `Некорректная дата в поле "${fieldLabel}"`);
  }

  return parsed;
}

function parseOptionalRequiredDate(value: string | null | undefined, fieldLabel: string) {
  const parsed = parseOptionalDate(value, fieldLabel);
  return parsed === null ? undefined : parsed;
}

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

  if (nextStatus === "handed_over") {
    return "handed_over";
  }

  return deviceStatusByCycleType[cycleType];
}

async function getDeviceStatusAfterCycleDelete(tx: Prisma.TransactionClient, cycle: CycleEntity): Promise<DeviceStatus> {
  const remainingActiveCycle = await tx.serviceCycle.findFirst({
    where: {
      deviceId: cycle.deviceId,
      id: { not: cycle.id },
      status: { notIn: ["handed_over"] }
    },
    orderBy: { createdAt: "desc" }
  });

  if (remainingActiveCycle) {
    return getDeviceStatusAfterCycleUpdate(remainingActiveCycle.status, remainingActiveCycle.type) ?? "active";
  }

  const latestArchivedCycle = await tx.serviceCycle.findFirst({
    where: {
      deviceId: cycle.deviceId,
      id: { not: cycle.id }
    },
    orderBy: { createdAt: "desc" }
  });

  if (!latestArchivedCycle) {
    return "active";
  }

  if (latestArchivedCycle.status === "handed_over") {
    return "handed_over";
  }

  return "active";
}

function toIsoString(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

function getAggregateCheckedAt(values: Array<Date | null | undefined>) {
  const normalized = values.filter((value): value is Date => Boolean(value));

  if (normalized.length === 0) {
    return null;
  }

  return new Date(Math.max(...normalized.map((value) => value.getTime())));
}

function getDerivedCycleStatus(
  currentStatus: ServiceCycleStatus,
  input: UpdateCycleInput,
  nextState: ReturnType<typeof getMergedCycleState>
): ServiceCycleStatus {
  if (currentStatus === "handed_over") {
    return input.status ?? currentStatus;
  }

  if (input.status === "created" || input.status === "in_progress") {
    return input.status;
  }

  if (input.status === "ready_for_handover" || nextState.readyForHandover) {
    return "ready_for_handover";
  }

  if (nextState.depotCheck === true) {
    return "depot_passed";
  }

  if (nextState.depotCheck === false) {
    return "depot_failed";
  }

  if (nextState.sopCheck === true) {
    return "sop_passed";
  }

  if (nextState.sopCheck === false) {
    return "sop_failed";
  }

  if (input.status) {
    return input.status;
  }

  return currentStatus === "created" ? "created" : "in_progress";
}

function getMergedCycleState(cycle: CycleEntity, input: UpdateCycleInput | HandoverCycleInput) {
  return {
    status: "status" in input && input.status !== undefined ? input.status : cycle.status,
    sopCheck: "sopCheck" in input && input.sopCheck !== undefined ? input.sopCheck : cycle.sopCheck,
    depotCheck: "depotCheck" in input && input.depotCheck !== undefined ? input.depotCheck : cycle.depotCheck,
    readyForHandover:
      "readyForHandover" in input && input.readyForHandover !== undefined ? input.readyForHandover : cycle.readyForHandover,
    checkedAt: "checkedAt" in input && input.checkedAt !== undefined ? input.checkedAt : cycle.checkedAt?.toISOString() ?? null,
    sopCheckedAt:
      "sopCheckedAt" in input && input.sopCheckedAt !== undefined
        ? input.sopCheckedAt
        : toIsoString(cycle.sopCheckedAt),
    depotCheckedAt:
      "depotCheckedAt" in input && input.depotCheckedAt !== undefined
        ? input.depotCheckedAt
        : toIsoString(cycle.depotCheckedAt),
    diagnosis: "diagnosis" in input && input.diagnosis !== undefined ? input.diagnosis : cycle.diagnosis,
    workPerformed: "workPerformed" in input && input.workPerformed !== undefined ? input.workPerformed : cycle.workPerformed,
    finalConclusion:
      "finalConclusion" in input && input.finalConclusion !== undefined ? input.finalConclusion : cycle.finalConclusion
  };
}

function validateRepairDataBeforeChecks(cycle: CycleEntity, input: UpdateCycleInput) {
  const needsValidation =
    input.sopCheck !== undefined && input.sopCheck !== null ||
    input.depotCheck !== undefined && input.depotCheck !== null ||
    input.status === "sop_passed" ||
    input.status === "sop_failed" ||
    input.status === "depot_passed" ||
    input.status === "depot_failed" ||
    input.status === "ready_for_handover" ||
    input.readyForHandover === true;

  if (!needsValidation || cycle.type !== "repair") {
    return;
  }

  const nextState = getMergedCycleState(cycle, input);

  if (!hasText(nextState.diagnosis)) {
    throw new AppError(400, 'Для ремонта сначала заполните поле "Диагноз".');
  }

  if (!hasText(nextState.workPerformed)) {
    throw new AppError(400, 'Для ремонта сначала заполните поле "Что сделано".');
  }
}

function validateReadyForHandover(cycle: CycleEntity, input: UpdateCycleInput | HandoverCycleInput) {
  const nextState = getMergedCycleState(cycle, input);
  const isMovingToReady =
    ("status" in input && input.status === "ready_for_handover") ||
    ("readyForHandover" in input && input.readyForHandover === true) ||
    !("status" in input);

  if (!isMovingToReady) {
    return;
  }

  if (cycle.type === "repair" && !hasText(nextState.diagnosis)) {
    throw new AppError(400, 'Перед завершением ремонта заполните поле "Диагноз".');
  }

  if (cycle.type === "repair" && !hasText(nextState.workPerformed)) {
    throw new AppError(400, 'Перед завершением ремонта заполните поле "Что сделано".');
  }

  if (nextState.sopCheck === null) {
    throw new AppError(400, "Перед готовностью к передаче зафиксируйте результат SOP.");
  }

  if (nextState.depotCheck === null) {
    throw new AppError(400, "Перед готовностью к передаче зафиксируйте результат Depot.");
  }

  if (nextState.sopCheck === true && !nextState.sopCheckedAt) {
    throw new AppError(400, 'Перед готовностью к передаче заполните поле "Дата SOP".');
  }

  if (nextState.depotCheck === true && !nextState.depotCheckedAt) {
    throw new AppError(400, 'Перед готовностью к передаче заполните поле "Дата Depot".');
  }

  if (!hasText(nextState.finalConclusion)) {
    throw new AppError(400, 'Перед готовностью к передаче заполните поле "Итог".');
  }
}

function validatePassedCheckDates(cycle: CycleEntity, input: UpdateCycleInput) {
  const nextState = getMergedCycleState(cycle, input);

  if (nextState.sopCheck === true && !nextState.sopCheckedAt) {
    throw new AppError(400, 'Если SOP пройдена, заполните поле "Дата SOP".');
  }

  if (nextState.depotCheck === true && !nextState.depotCheckedAt) {
    throw new AppError(400, 'Если Depot пройдена, заполните поле "Дата Depot".');
  }
}

function validateExplicitStatusTransition(cycle: CycleEntity, input: UpdateCycleInput) {
  if (!input.status) {
    return;
  }

  const nextState = getMergedCycleState(cycle, input);

  if (input.status === "sop_passed" && nextState.sopCheck !== true) {
    throw new AppError(400, 'Для статуса "SOP пройден" укажите результат SOP "Пройдена".');
  }

  if (input.status === "sop_failed" && nextState.sopCheck !== false) {
    throw new AppError(400, 'Для статуса "SOP не пройден" укажите результат SOP "Не пройдена".');
  }

  if ((input.status === "depot_passed" || input.status === "depot_failed") && nextState.sopCheck === null) {
    throw new AppError(400, "Перед этапом Depot сначала зафиксируйте результат SOP.");
  }

  if (input.status === "depot_passed" && nextState.depotCheck !== true) {
    throw new AppError(400, 'Для статуса "Depot пройден" укажите результат Depot "Пройдена".');
  }

  if (input.status === "depot_failed" && nextState.depotCheck !== false) {
    throw new AppError(400, 'Для статуса "Depot не пройден" укажите результат Depot "Не пройдена".');
  }
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

    const legacyCheckedAt = parseOptionalDate(input.checkedAt, "checkedAt");
    const sopCheckedAt = parseOptionalDate(input.sopCheckedAt, "sopCheckedAt");
    const depotCheckedAt = parseOptionalDate(input.depotCheckedAt, "depotCheckedAt");
    const aggregateCheckedAt = getAggregateCheckedAt([sopCheckedAt, depotCheckedAt, legacyCheckedAt]);

    const cycle = await prisma.$transaction(async (tx) => {
      const createdCycle = await tx.serviceCycle.create({
        data: {
          deviceId: input.deviceId,
          type: input.type,
          status: "created",
          receivedAt: parseOptionalRequiredDate(input.receivedAt, "receivedAt"),
          checkedAt: aggregateCheckedAt,
          sopCheckedAt,
          diagnosis: normalizeOptionalText(input.diagnosis),
          workPerformed: normalizeOptionalText(input.workPerformed),
          serviceNotes: normalizeOptionalText(input.serviceNotes),
          depotName: normalizeOptionalText(input.depotName),
          depotCheckedAt,
          equipmentNotes: normalizeOptionalText(input.equipmentNotes),
          finalConclusion: normalizeOptionalText(input.finalConclusion),
          comment: normalizeOptionalText(input.comment),
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

    validateRepairDataBeforeChecks(cycle, input);
    validateExplicitStatusTransition(cycle, input);
    validatePassedCheckDates(cycle, input);
    validateReadyForHandover(cycle, input);
    const nextState = getMergedCycleState(cycle, input);
    const resolvedStatus = getDerivedCycleStatus(cycle.status, input, nextState);

    const legacyCheckedAt = parseOptionalDate(input.checkedAt, "checkedAt");
    const sopCheckedAt = parseOptionalDate(input.sopCheckedAt, "sopCheckedAt");
    const depotCheckedAt = parseOptionalDate(input.depotCheckedAt, "depotCheckedAt");
    const aggregateCheckedAt = getAggregateCheckedAt([
      input.sopCheckedAt !== undefined ? sopCheckedAt : cycle.sopCheckedAt,
      input.depotCheckedAt !== undefined ? depotCheckedAt : cycle.depotCheckedAt,
      input.checkedAt !== undefined ? legacyCheckedAt : cycle.checkedAt
    ]);

    const data: Prisma.ServiceCycleUpdateInput = {
      sopCheck: input.sopCheck,
      depotCheck: input.depotCheck,
      readyForHandover: input.readyForHandover,
      receivedAt: parseOptionalRequiredDate(input.receivedAt, "receivedAt"),
      checkedAt: aggregateCheckedAt,
      sopCheckedAt,
      diagnosis: normalizeOptionalText(input.diagnosis),
      workPerformed: normalizeOptionalText(input.workPerformed),
      serviceNotes: normalizeOptionalText(input.serviceNotes),
      depotName: normalizeOptionalText(input.depotName),
      depotCheckedAt,
      equipmentNotes: normalizeOptionalText(input.equipmentNotes),
      finalConclusion: normalizeOptionalText(input.finalConclusion),
      comment: normalizeOptionalText(input.comment),
      status: resolvedStatus
    };

    if (resolvedStatus === "ready_for_handover") {
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

      const nextDeviceStatus = getDeviceStatusAfterCycleUpdate(resolvedStatus, cycle.type);

      if (nextDeviceStatus) {
        await tx.device.update({
          where: { id: cycle.deviceId },
          data: { currentStatus: nextDeviceStatus }
        });
      }
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

    if (!cycle.readyForHandover && cycle.status !== "ready_for_handover") {
      throw new AppError(400, "Перед handover сначала отметьте цикл как готовый к передаче.");
    }

    validateReadyForHandover(cycle, input);

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
          comment: normalizeOptionalText(input.comment) ?? cycle.comment
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
  },

  async remove(id: string, actorUserId: string) {
    const cycle = await findCycleById(id);

    if (!cycle) {
      throw new AppError(404, "Сервисный цикл не найден");
    }

    await prisma.$transaction(async (tx) => {
      const nextDeviceStatus = await getDeviceStatusAfterCycleDelete(tx, cycle);

      await tx.serviceCycle.delete({
        where: { id }
      });

      await tx.device.update({
        where: { id: cycle.deviceId },
        data: {
          currentStatus: nextDeviceStatus
        }
      });
    });

    await createAuditLog({
      userId: actorUserId,
      entityType: "service_cycle",
      entityId: id,
      action: "delete_cycle",
      oldValue: toAuditValue(cycle)
    });
  }
};
