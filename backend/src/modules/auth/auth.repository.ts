import { prisma } from "../../prisma/client";
import { RegisterInput } from "./auth.validation";

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function createPendingUser(input: RegisterInput, passwordHash: string) {
  return prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      role: "technical_specialist",
      status: "pending"
    }
  });
}
