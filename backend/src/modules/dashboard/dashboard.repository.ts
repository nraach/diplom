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
      status: { notIn: ["handed_over", "cancelled"] }
    },
    orderBy: { updatedAt: "desc" },
    take: 8,
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

export function getRecentAuditActionsForDashboard() {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true
        }
      }
    }
  });
}
