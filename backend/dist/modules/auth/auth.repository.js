"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByEmail = findUserByEmail;
exports.createPendingUser = createPendingUser;
const client_1 = require("../../prisma/client");
function findUserByEmail(email) {
    return client_1.prisma.user.findUnique({ where: { email } });
}
function createPendingUser(input, passwordHash) {
    return client_1.prisma.user.create({
        data: {
            fullName: input.fullName,
            email: input.email,
            passwordHash,
            role: "technical_specialist",
            status: "pending"
        }
    });
}
