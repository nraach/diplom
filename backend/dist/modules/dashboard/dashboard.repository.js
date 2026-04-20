"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDevicesForDashboard = getDevicesForDashboard;
exports.getActiveCyclesForDashboard = getActiveCyclesForDashboard;
exports.getRecentAuditActionsForDashboard = getRecentAuditActionsForDashboard;
const client_1 = require("../../prisma/client");
function getDevicesForDashboard() {
    return client_1.prisma.device.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
            serviceCycles: true
        }
    });
}
function getActiveCyclesForDashboard() {
    return client_1.prisma.serviceCycle.findMany({
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
function getRecentAuditActionsForDashboard() {
    return client_1.prisma.auditLog.findMany({
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
