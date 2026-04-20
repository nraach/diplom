"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.findUserById = findUserById;
exports.updateUserStatus = updateUserStatus;
exports.updateUserRole = updateUserRole;
const client_1 = require("../../prisma/client");
function listUsers() {
    return client_1.prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            status: true,
            createdAt: true
        }
    });
}
function findUserById(id) {
    return client_1.prisma.user.findUnique({ where: { id } });
}
function updateUserStatus(id, status) {
    return client_1.prisma.user.update({
        where: { id },
        data: { status },
        select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            status: true,
            createdAt: true
        }
    });
}
function updateUserRole(id, role) {
    return client_1.prisma.user.update({
        where: { id },
        data: { role },
        select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            status: true,
            createdAt: true
        }
    });
}
