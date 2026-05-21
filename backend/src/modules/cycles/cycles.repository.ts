import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client";

export const cycleInclude = {
  device: true,
  createdBy: {
    select: { id: true, fullName: true, email: true }
  },
  handedOverBy: {
    select: { id: true, fullName: true, email: true }
  }
} satisfies Prisma.ServiceCycleInclude;

export function listCycles() {
  return prisma.serviceCycle.findMany({
    orderBy: { createdAt: "desc" },
    include: cycleInclude
  });
}

export function findCycleById(id: string) {
  return prisma.serviceCycle.findUnique({
    where: { id },
    include: cycleInclude
  });
}

export function findActiveCycleByDeviceId(deviceId: string) {
  return prisma.serviceCycle.findFirst({
    where: {
      deviceId,
      status: { notIn: ["handed_over"] }
    }
  });
}
