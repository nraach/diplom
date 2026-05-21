import { prisma } from "../../prisma/client";

export function getDevicesForDashboard() {
  return prisma.device.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      serviceCycles: true
    }
  });
}

export function getActiveCyclesForDashboard() {
  return prisma.serviceCycle.findMany({
    where: {
      status: { notIn: ["handed_over"] }
    },
    orderBy: { updatedAt: "desc" },
    include: {
      device: {
        select: {
          id: true,
          serialNumber: true,
          name: true
        }
      },
      createdBy: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      }
    }
  });
}
