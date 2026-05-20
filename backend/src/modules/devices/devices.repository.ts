import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { CreateDeviceInput, UpdateDeviceInput } from "./devices.validation";

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
} satisfies Prisma.DeviceInclude;

export function listDevices() {
  return prisma.device.findMany({
    orderBy: { createdAt: "desc" },
    include: deviceInclude
  });
}

export function findDeviceById(id: string) {
  return prisma.device.findUnique({
    where: { id },
    include: deviceInclude
  });
}

export function findDeviceBySerialNumber(serialNumber: string) {
  return prisma.device.findUnique({ where: { serialNumber } });
}

export function createDevice(input: CreateDeviceInput) {
  return prisma.device.create({
    data: {
      ...input,
      customAttributes: toPrismaJson(input.customAttributes)
    },
    include: deviceInclude
  });
}

export function updateDevice(id: string, input: UpdateDeviceInput) {
  const data = {
    ...input,
    customAttributes: toPrismaJson(input.customAttributes),
    isWrittenOff: input.currentStatus === "written_off" ? true : input.isWrittenOff,
    currentStatus: input.isWrittenOff ? "written_off" : input.currentStatus
  };

  return prisma.device.update({
    where: { id },
    data,
    include: deviceInclude
  });
}

function toPrismaJson(value: CreateDeviceInput["customAttributes"] | UpdateDeviceInput["customAttributes"]) {
  if (value === undefined) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
}
